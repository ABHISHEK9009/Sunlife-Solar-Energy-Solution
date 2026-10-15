import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "sunlife_admin_session";
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

async function verifySessionToken(token: string, password: string): Promise<boolean> {
  if (!token || !password) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sign = async (payloadStr: string) => {
      const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(payloadStr)
      );
      const bytes = new Uint8Array(signature);
      let binary = "";
      for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
      const encoded = btoa(binary);
      return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    };

    // Modern v2 token with expiration & nonce
    if (token.startsWith("v2.")) {
      const parts = token.split(".");
      if (parts.length !== 4) return false;
      const [, timestampStr, nonce, signature] = parts;
      const timestamp = parseInt(timestampStr, 10);
      if (isNaN(timestamp)) return false;

      // 12 hours expiry
      const now = Date.now();
      if (now - timestamp > SESSION_MAX_AGE_MS || timestamp > now + 60000) {
        return false;
      }

      const expectedSig = await sign(`sunlife-admin-session-v2:${timestampStr}:${nonce}`);
      return signature === expectedSig;
    }

    // Legacy static token compatibility during rollout
    const expectedLegacy = await sign("sunlife-admin-session");
    return token === expectedLegacy;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow login page and external OAuth callbacks only
  const isPublicAuthRoute =
    pathname === "/admin/login" ||
    pathname === "/api/v1/admin/documents/drive-auth/callback" ||
    pathname === "/api/auth/callback/google";

  if (isPublicAuthRoute) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  }

  const password = process.env.ADMIN_PASSWORD;
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const validSession = password && session && (await verifySessionToken(session, password));

  if (!validSession) {
    // Return 401 JSON for API requests
    if (pathname.startsWith("/api/v1/admin")) {
      return NextResponse.json(
        { error: "Unauthorized admin access. Please sign in to the CRM dashboard." },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/admin/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = { matcher: ["/admin/:path*", "/api/v1/admin/:path*"] };
