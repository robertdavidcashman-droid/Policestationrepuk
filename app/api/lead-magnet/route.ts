import { NextResponse } from 'next/server';
import { sendLeadMagnetNotification } from '@/lib/email';
import {
  getClientIp,
  rateLimitOk,
  validateContactTiming,
} from '@/lib/contact-guards';
import { saveSubmission } from '@/lib/submissions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, source, leadMagnet, _hp, _startedAt } = body;

    if (JSON.stringify(body).length > 25000) {
      return NextResponse.json({ error: 'Request too large' }, { status: 400 });
    }

    if (_hp) {
      return NextResponse.json({ ok: true, id: 'noop' });
    }

    const timing = validateContactTiming(_startedAt);
    if (!timing.ok) {
      return NextResponse.json({ error: timing.error }, { status: timing.status });
    }

    const ip = getClientIp(request);
    if (ip !== 'unknown') {
      const limited = await rateLimitOk({ ip, scope: 'lead-magnet' });
      if (!limited.ok) {
        return NextResponse.json({ error: 'Too many requests. Please wait a few minutes.' }, { status: 429 });
      }
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 320) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const [id] = await Promise.all([
      saveSubmission('lead-magnet', { email, source, leadMagnet }),
      sendLeadMagnetNotification({ email, source, leadMagnet }),
    ]);

    return NextResponse.json({ ok: true, id, message: 'Thank you — check your inbox.' });
  } catch (err) {
    console.error('[lead-magnet]', err);
    return NextResponse.json({ error: 'Unable to process your request right now.' }, { status: 500 });
  }
}
