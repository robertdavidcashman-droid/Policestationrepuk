import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { sendDailyOutreachDigest } from '@/lib/firm-outreach/outreach/digest-email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

/** Daily digest: ready-to-send queue + today's send receipts to owner email. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get('force') === '1';
  const result = await sendDailyOutreachDigest({ force });
  return NextResponse.json({ ok: result.sent, ...result });
}
