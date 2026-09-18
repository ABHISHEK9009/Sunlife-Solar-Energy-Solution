import { createHmac, timingSafeEqual } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SESSION_COOKIE = 'sunlife_admin_session';
const STATE_COOKIE = 'sunlife_google_oauth_state';

function sessionToken(password: string) {
  return createHmac('sha256', password)
    .update('sunlife-admin-session')
    .digest('base64url');
}

function callbackUrl(request: NextRequest) {
  const productionUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  const origin =
    process.env.NODE_ENV === 'production' && productionUrl
      ? productionUrl
      : request.nextUrl.origin;
  return `${origin}/api/admin/google/callback`;
}

function loginRedirect(request: NextRequest, error: string) {
  const response = NextResponse.redirect(
    new URL(`/admin/login?error=${error}`, request.url),
  );
  response.cookies.set(STATE_COOKIE, '', {
    httpOnly: true,
    path: '/api/admin/google',
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const savedState = request.cookies.get(STATE_COOKIE)?.value;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (
    !code ||
    !state ||
    !savedState ||
    !clientId ||
    !clientSecret ||
    !adminPassword
  ) {
    return loginRedirect(
      request,
      code ? 'google_unavailable' : 'google_cancelled',
    );
  }

  const suppliedState = Buffer.from(state);
  const expectedState = Buffer.from(savedState);
  if (
    suppliedState.length !== expectedState.length ||
    !timingSafeEqual(suppliedState, expectedState)
  ) {
    return loginRedirect(request, 'google_invalid');
  }

  try {
    const oauthClient = new OAuth2Client(
      clientId,
      clientSecret,
      callbackUrl(request),
    );
    const { tokens } = await oauthClient.getToken(code);
    if (!tokens.id_token) return loginRedirect(request, 'google_invalid');

    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });
    const identity = ticket.getPayload();
    const email = identity?.email?.trim().toLowerCase();
    if (!email || !identity?.email_verified)
      return loginRedirect(request, 'google_invalid');

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const isAdministrator = Boolean(adminEmail && email === adminEmail);
    const employee = isAdministrator
      ? null
      : await prisma.teamMember.findFirst({
          where: {
            email: { equals: email, mode: 'insensitive' },
            emailVerifiedAt: { not: null },
            employeeAccessEnabled: true,
          },
          select: { id: true },
        });

    if (!isAdministrator && !employee)
      return loginRedirect(request, 'google_unauthorized');

    const response = NextResponse.redirect(
      new URL('/admin/dashboard', request.url),
    );
    response.cookies.set(SESSION_COOKIE, sessionToken(adminPassword), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12,
    });
    response.cookies.set(STATE_COOKIE, '', {
      httpOnly: true,
      path: '/api/admin/google',
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error('Google sign-in failed:', error);
    return loginRedirect(request, 'google_failed');
  }
}
