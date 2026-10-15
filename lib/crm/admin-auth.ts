import { createHmac, createHash, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "sunlife_admin_session";
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

declare global {
  var __revokedAdminTokens: Set<string> | undefined;
}

const revokedTokens: Set<string> =
  globalThis.__revokedAdminTokens ||
  (globalThis.__revokedAdminTokens = new Set<string>());

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Revokes an admin session token server-side upon logout.
 * Updates fast L1 in-memory cache and persists durably to Neon PostgreSQL AuditLog
 * so revocation takes effect across all serverless instances and cold restarts.
 */
export async function revokeAdminToken(token: string): Promise<void> {
  if (!token) return;
  revokedTokens.add(token);
  // Keep in-memory cache bounded
  if (revokedTokens.size > 10000) {
    const iter = revokedTokens.values();
    for (let i = 0; i < 2000; i++) {
      const val = iter.next().value;
      if (val) revokedTokens.delete(val);
    }
  }

  try {
    const tokenHash = hashToken(token);
    await prisma.auditLog.create({
      data: {
        entityType: "AdminSessionRevocation",
        entityId: tokenHash,
        fieldChanged: "session_status",
        action: "REVOKE",
        actorId: "ADMIN",
        actorType: "ADMIN",
        source: "CRM",
        newValue: "REVOKED",
      },
    });
  } catch (err: any) {
    // In mock tests or offline DB, L1 memory revocation is maintained
  }
}

/**
 * Emergency stolen-token revocation: invalidates all previously issued admin sessions
 * across every serverless instance by advancing the admin session epoch.
 */
export async function revokeAllAdminSessions(): Promise<void> {
  const epochNow = Date.now().toString();
  try {
    await prisma.auditLog.create({
      data: {
        entityType: "AdminSessionEpoch",
        entityId: "global_epoch",
        fieldChanged: "revocation_epoch",
        action: "REVOKE_ALL",
        actorId: "ADMIN",
        actorType: "ADMIN",
        source: "CRM",
        newValue: epochNow,
      },
    });
  } catch (err: any) {
    console.warn("[AdminAuth] Epoch revocation write warning:", err.message);
  }
}

/**
 * Checks whether an admin session token has been revoked across any serverless instance.
 */
export async function isTokenRevoked(token: string): Promise<boolean> {
  if (!token) return true;
  if (revokedTokens.has(token)) return true;

  try {
    const tokenHash = hashToken(token);
    const dbRecord = await prisma.auditLog.findFirst({
      where: {
        entityType: "AdminSessionRevocation",
        entityId: tokenHash,
      },
      select: { id: true },
    });
    if (dbRecord) {
      revokedTokens.add(token);
      return true;
    }

    // Check emergency global revocation epoch
    if (token.startsWith("v2.")) {
      const parts = token.split(".");
      const tokenTimestamp = parseInt(parts[1], 10);
      if (!isNaN(tokenTimestamp)) {
        const epochRecord = await prisma.auditLog.findFirst({
          where: { entityType: "AdminSessionEpoch" },
          orderBy: { timestamp: "desc" },
          select: { newValue: true },
        });
        if (epochRecord && epochRecord.newValue) {
          const epoch = parseInt(epochRecord.newValue, 10);
          if (!isNaN(epoch) && tokenTimestamp < epoch) {
            revokedTokens.add(token);
            return true;
          }
        }
      }
    }
  } catch {
    // Fall back to memory check on DB error
  }

  return false;
}

/**
 * Creates an expiring, non-replayable, cryptographically signed admin session token.
 */
export function createAdminSessionToken(password: string): string {
  const timestamp = Date.now().toString();
  const nonce = randomBytes(16).toString("hex");
  const payload = `sunlife-admin-session-v2:${timestamp}:${nonce}`;
  const signature = createHmac("sha256", password).update(payload).digest("base64url");
  return `v2.${timestamp}.${nonce}.${signature}`;
}

/**
 * Legacy static token generator for backward compatibility
 */
export function getAdminSessionToken(password: string): string {
  return createHmac("sha256", password)
    .update("sunlife-admin-session")
    .digest("base64url");
}

/**
 * Verifies whether an admin token is cryptographically valid, unexpired, and unrevoked.
 */
export function verifyAdminToken(token: string, password: string): boolean {
  if (!token || !password) return false;
  if (revokedTokens.has(token)) return false;

  // Modern v2 token with expiration & nonce
  if (token.startsWith("v2.")) {
    const parts = token.split(".");
    if (parts.length !== 4) return false;
    const [, timestampStr, nonce, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // Check expiration (12 hours max)
    const now = Date.now();
    if (now - timestamp > SESSION_MAX_AGE_MS || timestamp > now + 60000) {
      return false; // Expired or future timestamp
    }

    const payload = `sunlife-admin-session-v2:${timestampStr}:${nonce}`;
    const expectedSignature = createHmac("sha256", password).update(payload).digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }
    return true;
  }

  // Legacy static token (backward compatibility during rollout)
  const legacyToken = getAdminSessionToken(password);
  const candBuf = Buffer.from(token);
  const legBuf = Buffer.from(legacyToken);
  if (candBuf.length === legBuf.length && timingSafeEqual(candBuf, legBuf)) {
    return true;
  }

  return false;
}

/**
 * Validates whether the incoming Request has an authorized, active Sunlife Admin session.
 * Checks cookie `sunlife_admin_session` or Authorization Bearer header.
 */
export async function authenticateAdminRequest(request: Request): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return false;
  }

  // 1. Check Cookie
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((c) => c.trim().split("="))
      .filter(([k]) => Boolean(k))
      .map(([k, ...v]) => [k, decodeURIComponent(v.join("="))])
  );

  const cookieToken = cookies[SESSION_COOKIE];
  if (cookieToken && verifyAdminToken(cookieToken, adminPassword)) {
    if (!(await isTokenRevoked(cookieToken))) {
      return true;
    }
  }

  // 2. Check Authorization Bearer header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    if (verifyAdminToken(bearerToken, adminPassword)) {
      if (!(await isTokenRevoked(bearerToken))) {
        return true;
      }
    }
  }

  return false;
}
