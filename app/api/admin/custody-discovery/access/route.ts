import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/admin-auth';
import { peekAccessToken } from '@/lib/custody-discovery/admin-access-token';
import { createSession, getSessionCookieName } from '@/lib/auth';
import { SITE_URL } from '@/lib/seo-layer/config';

export const dynamic = 'force-dynamic';

/**
 * One-click admin login from custody discovery batch email.
 * Sets rep_session cookie and redirects to the review dashboard for that batch.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token')?.trim();
  if (!token) {
    return NextResponse.redirect(`${SITE_URL}/admin/custody-number-review?error=missing_token`);
  }

  const peek = await peekAccessToken(token);
  if (!peek.ok) {
    return NextResponse.redirect(
      `${SITE_URL}/admin/custody-number-review?error=${encodeURIComponent(peek.error)}`,
    );
  }

  if (!isAdminEmail(peek.payload.email)) {
    return NextResponse.redirect(`${SITE_URL}/admin/custody-number-review?error=not_authorised`);
  }

  const sessionToken = await createSession(peek.payload.email);
  const redirectUrl = `${SITE_URL}/admin/custody-number-review?batch=${encodeURIComponent(peek.payload.batchId)}`;
  const isProduction = process.env.NODE_ENV === 'production';

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(getSessionCookieName(), sessionToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
