import { NextResponse } from 'next/server';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';
import {
  enquiryEmailVerificationEnabled,
  issueEnquiryEmailCode,
} from '@/lib/enquiry-email-verify';
import { sendEnquiryEmailCode } from '@/lib/email';
import { verifyTurnstile } from '@/lib/turnstile';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mints a 15-minute one-time code and emails it to the applicant. Only used
 * when `REQUIRE_ENQUIRY_EMAIL_VERIFICATION=1` is set; otherwise the route
 * still works but the enquiry handler will not require the code.
 */
export async function POST(request: Request) {
  let raw: { email?: unknown; _hp?: unknown; turnstileToken?: unknown };
  try {
    raw = (await request.json()) as typeof raw;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (raw._hp) {
    return NextResponse.json({ ok: true, sent: true });
  }

  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
  }

  const ip = getClientIp(request);
  const rl = await rateLimitOk({ ip, scope: 'enquiry-code', max: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes before requesting another code.' },
      { status: 429 },
    );
  }

  const ts = await verifyTurnstile(
    typeof raw.turnstileToken === 'string' ? raw.turnstileToken : null,
    ip,
  );
  if (!ts.ok && ts.reason !== 'disabled') {
    return NextResponse.json(
      { error: 'Bot-protection check failed. Please refresh and try again.' },
      { status: 400 },
    );
  }

  if (!enquiryEmailVerificationEnabled()) {
    // No-op success — keep the client simple and let the main enquiry route
    // do the work. The client can still display "code sent" UI in case the
    // feature is enabled later.
    return NextResponse.json({ ok: true, sent: false, reason: 'disabled' });
  }

  const code = await issueEnquiryEmailCode(email);
  if (!code) {
    return NextResponse.json(
      { error: 'Email verification is temporarily unavailable. Please try again shortly.' },
      { status: 503 },
    );
  }
  await sendEnquiryEmailCode(email, code).catch((err) =>
    console.warn('[enquiry-send-code] email send failed:', err),
  );
  return NextResponse.json({ ok: true, sent: true });
}
