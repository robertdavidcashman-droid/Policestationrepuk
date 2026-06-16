import { NextResponse } from 'next/server';
import { verifyAndPublishAllReps } from '@/lib/regulatory-auto-pass';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Re-check every rep against SRA / Law Society / DSCC and the risk scorer.
 * Reps on a public register or scored low risk are auto-published.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const summary = await verifyAndPublishAllReps('cron:regulatory-verify');

  return NextResponse.json({
    ok: true,
    ...summary,
    appliedCount: summary.publishedRegister + summary.publishedLowRisk,
    refreshedCount: summary.refreshed,
  });
}
