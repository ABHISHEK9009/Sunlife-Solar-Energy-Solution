import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  createAdminSessionToken,
  verifyAdminToken,
  revokeAdminToken,
  isTokenRevoked,
} from "@/lib/crm/admin-auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json().catch(() => ({}));
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@sunlifesolar.in").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const inputEmail = email.trim().toLowerCase();
  const emailMatches = inputEmail === adminEmail;

  const supplied = Buffer.from(password);
  const expected = Buffer.from(adminPassword);
  const passwordMatches =
    supplied.length === expected.length && timingSafeEqual(supplied, expected);

  if (!emailMatches || !passwordMatches) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = createAdminSessionToken(adminPassword);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return response;
}

export async function GET(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (!adminPassword || !session || !verifyAdminToken(session, adminPassword) || (await isTokenRevoked(session))) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true });
}

export async function DELETE(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (session) {
    await revokeAdminToken(session);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
