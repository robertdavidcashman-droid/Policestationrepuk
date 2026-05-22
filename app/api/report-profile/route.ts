import { NextResponse } from 'next/server';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';
import { saveProfileReport } from '@/lib/rep-verification';
import { sendContactNotification } from '@/lib/email';
import { verifyTurnstile } from '@/lib/turnstile';

export const dynamic = 'force-dynamic';

interface Body {
  targetEmail?: unknown;
  targetSlug?: unknown;
  reporterName?: unknown;
  reporterEmail?: unknown;
  reason?: unknown;
  details?: unknown;
  turnstileToken?: unknown;
  _hp?: unknown;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_REASON = 200;
const MAX_DETAILS = 4000;

function s(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (body._hp) return NextResponse.json({ ok: true });

  const ip = getClientIp(request);
  const rl = await rateLimitOk({ ip, scope: 'profile-report', max: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes and try again.' },
      { status: 429 },
    );
  }
  const ts = await verifyTurnstile(
    typeof body.turnstileToken === 'string' ? body.turnstileToken : null,
    ip,
  );
  if (!ts.ok) {
    return NextResponse.json(
      { error: ts.message, code: ts.code },
      { status: ts.code === 'TURNSTILE_NETWORK_ERROR' ? 503 : 400 },
    );
  }

  const targetSlug = s(body.targetSlug, 200);
  const targetEmail = s(body.targetEmail, 320).toLowerCase();
  const reporterName = s(body.reporterName, 200);
  const reporterEmail = s(body.reporterEmail, 320).toLowerCase();
  const reason = s(body.reason, MAX_REASON);
  const details = s(body.details, MAX_DETAILS);

  if (!targetSlug && !targetEmail) {
    return NextResponse.json({ error: 'Missing profile reference.' }, { status: 400 });
  }
  if (!reporterName || !reporterEmail) {
    return NextResponse.json({ error: 'Reporter name and email are required.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(reporterEmail)) {
    return NextResponse.json({ error: 'Invalid reporter email.' }, { status: 400 });
  }
  if (!reason || !details) {
    return NextResponse.json({ error: 'Reason and details are required.' }, { status: 400 });
  }

  const id = await saveProfileReport({
    targetEmail,
    targetSlug,
    reporterName,
    reporterEmail,
    reason,
    details,
    ipAddress: ip,
    userAgent: (request.headers.get('user-agent') || '').slice(0, 500),
    createdAt: new Date().toISOString(),
    status: 'new',
  });

  sendContactNotification({
    name: `Profile report — ${reporterName}`,
    email: reporterEmail,
    subject: `[Profile report] ${reason} — ${targetSlug || targetEmail}`,
    message: [
      `Reporter: ${reporterName} <${reporterEmail}>`,
      `Target slug: ${targetSlug || '—'}`,
      `Target email: ${targetEmail || '—'}`,
      `Reason: ${reason}`,
      `IP: ${ip}`,
      ``,
      details,
      ``,
      `Report ID: ${id}`,
    ].join('\n'),
  }).catch((err) => console.warn('[report-profile] notify failed:', err));

  return NextResponse.json({ ok: true, id });
}
