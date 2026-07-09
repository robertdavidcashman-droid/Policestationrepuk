import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import {
  cronEnrichBatchSize,
  enrichMaxElapsedMs,
} from '@/lib/firm-outreach/constants';
import { runFirmOutreachPipeline } from '@/lib/firm-outreach/run-pipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/** Enrich-only cron tick (no discovery refresh, no sends). */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runFirmOutreachPipeline({
    skipDiscovery: true,
    skipSend: true,
    skipDigest: true,
    skipCleanup: true,
    enrichLimit: cronEnrichBatchSize(),
    enrichMaxElapsedMs: enrichMaxElapsedMs(),
  });

  return NextResponse.json({ ok: true, mode: 'enrich-only', ...result });
}
