import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "sunlife_admin_session";

async function sessionToken(password: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("sunlife-admin-session"));
  const bytes = new Uint8Array(signature);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  const encoded = btoa(binary);
  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow login page and OAuth callbacks
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/v1/admin/documents/drive-auth/callback")
  ) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  }

  const password = process.env.ADMIN_PASSWORD;
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const validSession = password && session && session === (await sessionToken(password));

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
