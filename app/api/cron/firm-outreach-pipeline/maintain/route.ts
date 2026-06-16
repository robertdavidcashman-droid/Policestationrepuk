import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { requeueNoEmailProspects } from '@/lib/firm-outreach/enrichment/requeue-no-email';
import { runFirmOutreachPipeline } from '@/lib/firm-outreach/run-pipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

function isSundayUtc(): boolean {
  return new Date().getUTCDay() === 0;
}

/** Nightly: LAA refresh (if stale) + DSCC + discovery — no sends. Sunday: requeue no_email for retry. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requeue = isSundayUtc() ? await requeueNoEmailProspects() : { requeued: 0 };

  const result = await runFirmOutreachPipeline({
    skipSend: true,
    skipDigest: true,
    skipEnrich: true,
    forceLaaRefresh: false,
  });

  return NextResponse.json({ ok: true, mode: 'maintain', requeue, ...result });
}
