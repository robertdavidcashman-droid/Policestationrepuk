import { NextResponse } from 'next/server';
import { sendContactNotification } from '@/lib/email';
import {
  getClientIp,
  messageLooksSpammy,
  rateLimitOk,
  validateContactTiming,
} from '@/lib/contact-guards';
import { saveSubmission } from '@/lib/submissions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message, _hp, _startedAt } = body;

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
      const limited = await rateLimitOk({ ip, scope: 'contact' });
      if (!limited.ok) {
        return NextResponse.json(
          {
            error:
              'Too many messages sent from this connection recently. Please wait a few minutes or email us directly.',
          },
          { status: 429 },
        );
      }
    }

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, message' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (name.length > 200 || email.length > 320 || message.length > 10000 || (subject && subject.length > 500)) {
      return NextResponse.json(
        { error: 'Field exceeds maximum length' },
        { status: 400 }
      );
    }

    if (messageLooksSpammy(String(message))) {
      return NextResponse.json(
        {
          error:
            'Your message could not be sent automatically. If you need to share many links, please email us directly using the address above.',
        },
        { status: 400 }
      );
    }

    const [submissionId] = await Promise.all([
      saveSubmission('contact', { name, email, subject, message }),
      sendContactNotification({ name, email, subject, message }),
    ]);

    return NextResponse.json({
      ok: true,
      id: submissionId,
      message: 'Thank you — your enquiry has been received.',
    });
  } catch (err) {
    console.error('[contact]', err);
    return NextResponse.json({ error: 'Unable to process your enquiry right now.' }, { status: 500 });
  }
}
