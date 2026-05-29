import { NextResponse } from 'next/server';
import { verifyAndPublishAllReps } from '@/lib/regulatory-auto-pass';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Re-check every rep against SRA / Law Society / DSCC and the risk scorer.
 * Reps on a public register or scored low risk are auto-published.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization') || '';
    const xSecret = request.headers.get('x-cron-secret') || '';
    if (auth !== `Bearer ${secret}` && xSecret !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const summary = await verifyAndPublishAllReps('cron:regulatory-verify');

  return NextResponse.json({
    ok: true,
    ...summary,
    appliedCount: summary.publishedRegister + summary.publishedLowRisk,
    refreshedCount: summary.refreshed,
  });
}
