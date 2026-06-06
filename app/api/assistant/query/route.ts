import { NextResponse } from 'next/server';
import { queryAssistantWithLlm } from '@/lib/assistant/match';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';

const MAX_MESSAGE_LENGTH = 500;
const ASSISTANT_RATE_MAX = 20;
const ASSISTANT_RATE_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (body._hp) {
      return NextResponse.json({ ok: true, matches: [], suggestedLinks: [], refused: false });
    }

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    if (ip !== 'unknown') {
      const { ok } = await rateLimitOk({
        ip,
        scope: 'assistant',
        max: ASSISTANT_RATE_MAX,
        windowMs: ASSISTANT_RATE_WINDOW_MS,
      });
      if (!ok) {
        return NextResponse.json(
          {
            error: 'Too many questions asked recently. Please wait a few minutes and try again.',
          },
          { status: 429 }
        );
      }
    }

    const result = await queryAssistantWithLlm(message);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Unable to process your question' }, { status: 500 });
  }
}
