import { NextResponse } from 'next/server';
import { flushPendingDailyDigest } from '@/lib/custody-discovery/notify';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Lightweight daily digest sender — runs after the main crawl cron so email
 * delivery is not lost when the 300s discovery run times out.
 *
 * Auth: Bearer ${CRON_SECRET} or x-cron-secret header.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notification = await flushPendingDailyDigest(new Date(), { force: true });
  return NextResponse.json({ ok: true, mode: 'digest-only', notification });
}
