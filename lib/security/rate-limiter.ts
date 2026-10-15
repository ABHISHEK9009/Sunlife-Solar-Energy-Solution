import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  actionName: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
  totalHits: number;
}

// In-memory local sliding window cache for fast checks within the same instance
const localHitCache = new Map<string, { count: number; expiresAt: number }>();

/**
 * Extracts a normalized client IP address from standard reverse-proxy headers
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/**
 * Enterprise serverless rate limiter.
 * Uses an in-memory sliding window cache per serverless instance for sub-millisecond,
 * zero-database-overhead protection during normal traffic.
 *
 * Database records (AuditLog) are created ONLY when a limit is exceeded (rate limit violation),
 * preventing table bloat, avoiding race conditions, and eliminating unneeded Neon queries on legitimate users.
 */
export async function checkRateLimit(
  req: Request,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const cacheKey = `${config.actionName}:${ip}`;

  // Clean up expired cache items periodically if cache grows
  if (localHitCache.size > 2000) {
    localHitCache.forEach((entry, key) => {
      if (entry.expiresAt < now) localHitCache.delete(key);
    });
  }

  const existing = localHitCache.get(cacheKey);
  let count = 1;
  let expiresAt = now + windowMs;

  if (existing && existing.expiresAt > now) {
    count = existing.count + 1;
    expiresAt = existing.expiresAt;
  }

  localHitCache.set(cacheKey, { count, expiresAt });
  const resetSeconds = Math.max(1, Math.ceil((expiresAt - now) / 1000));

  // If rate limit is breached, log a security violation to Neon AuditLog and block
  if (count > config.maxRequests) {
    // Only write to DB once upon crossing threshold
    if (count === config.maxRequests + 1) {
      prisma.auditLog
        .create({
          data: {
            entityType: "RateLimitViolation",
            entityId: `${config.actionName}_${ip.replace(/[^a-zA-Z0-9_]/g, "_")}`,
            fieldChanged: config.actionName,
            action: "BLOCK",
            actorId: ip,
            actorType: "SYSTEM",
            source: "API",
            ipAddress: ip,
            newValue: `Blocked: Exceeded ${config.maxRequests} reqs in ${config.windowSeconds}s`,
          },
        })
        .catch((e) => console.warn("[RateLimiter] Violation log warning:", e.message));
    }

    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
      totalHits: count,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - count),
    resetSeconds,
    totalHits: count,
  };
}

/**
 * Standard 429 Too Many Requests response builder with Retry-After header
 */
export function buildRateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: "Too many requests. Please wait before submitting again.",
      retryAfterSeconds: result.resetSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": result.resetSeconds.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
      },
    }
  );
}
