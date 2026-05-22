/**
 * Mint and email a 6-digit one-time code so the applicant can confirm they
 * own the email address they're registering with.
 *
 * The Cloudflare Turnstile gate that used to live here was removed; abuse
 * mitigation now relies on the silent honeypot, the per-IP rate limit (5
 * sends per 15 minutes), and the fact that the code only authorises the
 * downstream `/api/register/gate` call which itself rate-limits. Removing
 * Turnstile fixed the recurring "I entered the email code but the form
 * never opened" bug for legitimate applicants whose browsers / extensions
 * silently dropped the widget script.
 *
 * Stable error codes (returned as `body.code`):
 *   INVALID_JSON
 *   HONEYPOT_TRIGGERED
 *   INVALID_EMAIL
 *   RATE_LIMITED
 *   EMAIL_VERIFICATION_DISABLED — REQUIRE_ENQUIRY_EMAIL_VERIFICATION not set;
 *     client may still proceed (the gate route won't insist on a code).
 *   EMAIL_CODE_STORE_UNAVAILABLE — KV is down so the code cannot be persisted.
 *   EMAIL_CODE_SEND_FAILED — Resend rejected the email.
 *   EMAIL_CODE_SENT — happy path.
 */

import { NextResponse } from 'next/server';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';
import {
  enquiryEmailVerificationEnabled,
  issueEnquiryEmailCode,
} from '@/lib/enquiry-email-verify';
import { sendEnquiryEmailCode } from '@/lib/email';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeLog(event: string, payload: Record<string, unknown> = {}): void {
  console.info('[register-send-code]', JSON.stringify({ event, ...payload }));
}

export async function POST(request: Request) {
  let raw: { email?: unknown; _hp?: unknown };
  try {
    raw = (await request.json()) as typeof raw;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: 'INVALID_JSON',
        error: 'The request was malformed. Please refresh the page and try again.',
      },
      { status: 400 },
    );
  }

  if (raw._hp) {
    safeLog('honeypot_triggered');
    // Pretend success so the bot doesn't learn anything useful.
    return NextResponse.json({ ok: true, sent: true, code: 'EMAIL_CODE_SENT' });
  }

  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      {
        ok: false,
        code: 'INVALID_EMAIL',
        error: 'Please enter a valid email address before requesting a verification code.',
      },
      { status: 400 },
    );
  }

  const ip = getClientIp(request);
  const rl = await rateLimitOk({ ip, scope: 'enquiry-code', max: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: 'RATE_LIMITED',
        error: 'Too many requests. Please wait a few minutes before requesting another code.',
      },
      { status: 429 },
    );
  }

  if (!enquiryEmailVerificationEnabled()) {
    // No-op success — the gate route won't require a code, but we still
    // signal it to the client so the UI can show a friendly message.
    safeLog('email_send_skipped_disabled', { email });
    return NextResponse.json({
      ok: true,
      sent: false,
      code: 'EMAIL_VERIFICATION_DISABLED',
      message:
        'Email verification is not required in this environment. You can continue to the eligibility check.',
    });
  }

  safeLog('email_send_requested', { email });
  const code = await issueEnquiryEmailCode(email);
  if (!code) {
    safeLog('email_code_store_unavailable', { email });
    return NextResponse.json(
      {
        ok: false,
        code: 'EMAIL_CODE_STORE_UNAVAILABLE',
        error:
          'Email verification is temporarily unavailable. Please try again in a few minutes.',
      },
      { status: 503 },
    );
  }
  const sent = await sendEnquiryEmailCode(email, code).catch((err) => {
    console.warn('[register-send-code] email send failed:', err);
    return false;
  });
  if (!sent) {
    safeLog('email_send_failed', { email });
    return NextResponse.json(
      {
        ok: false,
        code: 'EMAIL_CODE_SEND_FAILED',
        error:
          'We could not send the verification code to that address. Please check the email and try again, or contact us if the problem persists.',
      },
      { status: 502 },
    );
  }
  safeLog('email_send_success', { email });
  return NextResponse.json({ ok: true, sent: true, code: 'EMAIL_CODE_SENT' });
}
