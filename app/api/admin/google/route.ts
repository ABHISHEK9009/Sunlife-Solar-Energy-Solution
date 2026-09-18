import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const STATE_COOKIE = 'sunlife_google_oauth_state';

function callbackUrl(request: NextRequest) {
  const productionUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  const origin =
    process.env.NODE_ENV === 'production' && productionUrl
      ? productionUrl
      : request.nextUrl.origin;
  return `${origin}/api/admin/google/callback`;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL('/admin/login?error=google_unavailable', request.url),
    );
  }

  const state = randomBytes(32).toString('base64url');
  const authorizationUrl = new URL(
    'https://accounts.google.com/o/oauth2/v2/auth',
  );
  authorizationUrl.searchParams.set('client_id', clientId);
  authorizationUrl.searchParams.set('redirect_uri', callbackUrl(request));
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('scope', 'openid email profile');
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('prompt', 'select_account');

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/admin/google',
    maxAge: 10 * 60,
  });
  return response;
}
