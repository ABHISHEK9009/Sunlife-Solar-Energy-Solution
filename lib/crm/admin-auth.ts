import { createHmac, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "sunlife_admin_session";

export function getAdminSessionToken(password: string): string {
  return createHmac("sha256", password)
    .update("sunlife-admin-session")
    .digest("base64url");
}

/**
 * Validates whether the incoming Request has an authorized Sunlife Admin session.
 * Checks cookie `sunlife_admin_session` or Authorization Bearer header.
 */
export async function authenticateAdminRequest(request: Request): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return false;
  }

  const expectedToken = getAdminSessionToken(adminPassword);
  const expectedBuffer = Buffer.from(expectedToken);

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
  if (cookieToken) {
    const candidateBuffer = Buffer.from(cookieToken);
    if (
      candidateBuffer.length === expectedBuffer.length &&
      timingSafeEqual(candidateBuffer, expectedBuffer)
    ) {
      return true;
    }
  }

  // 2. Check Authorization Bearer header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    const candidateBuffer = Buffer.from(bearerToken);
    if (
      candidateBuffer.length === expectedBuffer.length &&
      timingSafeEqual(candidateBuffer, expectedBuffer)
    ) {
      return true;
    }
  }

  return false;
}
