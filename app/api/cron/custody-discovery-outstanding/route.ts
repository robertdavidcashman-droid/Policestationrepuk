import { NextResponse } from 'next/server';
import { sendDailyOutstandingDigest } from '@/lib/custody-discovery/outstanding-digest';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Daily outstanding custody review digest — full backlog needing approve/reject.
 * Runs after the new-findings digest so you get both today's discoveries and
 * everything still waiting for a decision.
 *
 * Query: `force=1` to resend even if already sent today.
 *
 * Auth: Bearer ${CRON_SECRET} or x-cron-secret header.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get('force') === '1';
  const result = await sendDailyOutstandingDigest({ force });

  return NextResponse.json({ ok: true, mode: 'outstanding-digest', ...result });
}
