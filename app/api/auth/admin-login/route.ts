import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Password admin login is permanently disabled.
 * Admins must use magic-code sign-in via /api/auth/send-code + /api/auth/verify-code
 * (same flow as the AdminLoginForm on /admin).
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Admin password sign-in is disabled. Use the magic code emailed from /admin.',
      useMagicCode: true,
    },
    { status: 410 },
  );
}
