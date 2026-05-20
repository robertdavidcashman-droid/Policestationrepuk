import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/admin-auth';
import { getRawReps, getRegisteredRepByEmail } from '@/lib/data';
import { verifyMagicCode, createSession, getSessionCookieName } from '@/lib/auth';

export async function POST(request: Request) {
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
