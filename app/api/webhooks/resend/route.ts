import { NextResponse } from 'next/server';
import {
  addSuppression,
  applySendWebhookEvent,
  getProspectByEmail,
  saveProspect,
} from '@/lib/firm-outreach/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ResendWebhookEvent {
  type?: string;
  created_at?: string;
  data?: {
    to?: string | string[];
    email_id?: string;
  };
}

function emailsFromEvent(data: ResendWebhookEvent['data']): string[] {
  const toRaw = data?.to;
  if (Array.isArray(toRaw)) return toRaw.map((e) => e.toLowerCase());
  if (toRaw) return [toRaw.toLowerCase()];
  return [];
}

export async function POST(request: Request) {
  let body: ResendWebhookEvent;
  try {
    body = (await request.json()) as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const type = body.type ?? '';
  const at = body.created_at ?? new Date().toISOString();
  const emails = emailsFromEvent(body.data);
  const resendMessageId = body.data?.email_id;

  if (
    type === 'email.sent' ||
    type === 'email.delivered' ||
    type === 'email.opened' ||
    type === 'email.clicked' ||
    type === 'email.bounced' ||
    type === 'email.complained'
  ) {
    for (const email of emails.length ? emails : ['']) {
      await applySendWebhookEvent({
        resendMessageId,
        email: email || undefined,
        eventType: type,
        at,
      });
    }
  }

  if (type === 'email.bounced' || type === 'email.complained') {
    const reason = type === 'email.complained' ? 'complaint' : 'bounce';
    for (const email of emails) {
      await addSuppression(email, reason);
      const prospect = await getProspectByEmail(email);
      if (prospect) {
        const prev = prospect.status;
        prospect.status = reason === 'complaint' ? 'unsubscribed' : 'bounced';
        prospect.updatedAt = new Date().toISOString();
        await saveProspect(prospect, prev);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
