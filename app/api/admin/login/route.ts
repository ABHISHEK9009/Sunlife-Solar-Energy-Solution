import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "sunlife_admin_session";

function sessionToken(password: string) {
  return createHmac("sha256", password)
    .update("sunlife-admin-session")
    .digest("base64url");
}

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword || typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const emailMatches = email.trim().toLowerCase() === adminEmail;
  const supplied = Buffer.from(password);
  const expected = Buffer.from(adminPassword);
  const passwordMatches = supplied.length === expected.length && timingSafeEqual(supplied, expected);

  if (!emailMatches || !passwordMatches) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, sessionToken(adminPassword), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
