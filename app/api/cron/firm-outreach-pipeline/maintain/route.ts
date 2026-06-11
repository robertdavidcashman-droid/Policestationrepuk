import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { enrichBatchSize } from '@/lib/firm-outreach/constants';
import { runFirmOutreachPipeline } from '@/lib/firm-outreach/run-pipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/** Nightly: LAA refresh (if stale) + DSCC + discovery + enrich — no sends. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runFirmOutreachPipeline({
    skipSend: true,
    enrichLimit: enrichBatchSize(),
  });

  return NextResponse.json({ ok: true, mode: 'maintain', ...result });
}
