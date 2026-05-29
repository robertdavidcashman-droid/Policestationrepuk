import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/admin-auth';
import { verifyAdminPassword, isAdminPasswordConfigured } from '@/lib/admin-password';
import { createSession, getSessionCookieName } from '@/lib/auth';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      { error: 'Admin password login is not configured on this server.' },
      { status: 503 },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const ip = getClientIp(request);
  const limit = await rateLimitOk({ ip, scope: 'admin-password-login', max: 10 });
  if (!limit.ok) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  if (!isAdminEmail(email) || !verifyAdminPassword(password)) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const token = await createSession(email);
  const isProduction = process.env.NODE_ENV === 'production';

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
