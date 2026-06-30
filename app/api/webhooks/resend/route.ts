import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  addSuppression,
  applySendWebhookEvent,
  getProspect,
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

function verifyResendWebhook(request: Request, rawBody: string): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }

  const id = request.headers.get('svix-id');
  const timestamp = request.headers.get('svix-timestamp');
  const signature = request.headers.get('svix-signature');
  if (!id || !timestamp || !signature) return false;

  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return false;

  try {
    const resend = new Resend(key);
    resend.webhooks.verify({
      payload: rawBody,
      headers: { id, timestamp, signature },
      webhookSecret: secret,
    });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifyResendWebhook(request, rawBody)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  let body: ResendWebhookEvent;
  try {
    body = JSON.parse(rawBody) as ResendWebhookEvent;
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
    const reason = type === 'email.complained' ? 'complaint' : 'bounce';
    for (const email of emails.length ? emails : ['']) {
      const send = await applySendWebhookEvent({
        resendMessageId,
        email: email || undefined,
        eventType: type,
        at,
      });
      if (send && (type === 'email.bounced' || type === 'email.complained')) {
        await addSuppression(send.email, reason);
        const prospect = await getProspect(send.prospectId);
        if (prospect) {
          const prev = prospect.status;
          prospect.status = reason === 'complaint' ? 'unsubscribed' : 'bounced';
          prospect.updatedAt = new Date().toISOString();
          await saveProspect(prospect, prev);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
