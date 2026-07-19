import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/admin-auth';
import { getRawReps, getRegisteredRepByEmail } from '@/lib/data';
import {
  ADMIN_SESSION_TTL,
  verifyMagicCode,
  createSession,
  getDefaultSessionTtlSeconds,
  getSessionCookieName,
} from '@/lib/auth';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = await rateLimitOk({ ip, scope: 'auth-verify-code', max: 20, windowMs: 15 * 60 * 1000 });
  if (!limit.ok) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  let body: { email?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();

  if (!email || !code) {
    return NextResponse.json({ error: 'Email and code required' }, { status: 400 });
  }

  const reps = getRawReps();
  const rep = reps.find((r) => r.email.toLowerCase() === email);
  const registeredRep = !rep ? await getRegisteredRepByEmail(email) : null;
  const adminLogin = isAdminEmail(email);

  if (!rep && !registeredRep && !adminLogin) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
  }

  const result = await verifyMagicCode(email, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  // Admin magic-code sessions last 1 hour; rep Account sessions keep the longer default.
  const ttlSeconds = adminLogin ? ADMIN_SESSION_TTL : getDefaultSessionTtlSeconds();
  const token = await createSession(email, { ttlSeconds });
  const isProduction = process.env.NODE_ENV === 'production';

  const response = NextResponse.json({
    ok: true,
    sessionTtlSeconds: ttlSeconds,
    admin: adminLogin,
  });
  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: ttlSeconds,
  });

  return response;
}
