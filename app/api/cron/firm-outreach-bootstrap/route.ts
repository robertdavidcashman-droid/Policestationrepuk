import { NextResponse } from 'next/server';
import { isOutreachBootstrapAuthorized } from '@/lib/cron-auth';
import { bootstrapOutreach } from '@/lib/firm-outreach/bootstrap-outreach';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/** Operator kick: requalify junk ready rows and/or run enrich batches. */
export async function GET(request: Request) {
  if (!isOutreachBootstrapAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);

  if (url.searchParams.get('requalifyOnly') === '1') {
    const { requalifyAllProspects } = await import('@/lib/firm-outreach/requalify-prospects');
    const { countProspectsByStatus } = await import('@/lib/firm-outreach/storage');
    const countsBefore = await countProspectsByStatus();
    const requalify = await requalifyAllProspects({
      verifyWebsites: false,
      readyOnly: true,
      mxCheckLimit: 50,
      maxElapsedMs: 240_000,
    });
    const countsAfter = await countProspectsByStatus();
    return NextResponse.json({
      ok: true,
      mode: 'requalifyOnly',
      requalify,
      countsBefore,
      countsAfter,
    });
  }

  const unpauseOnly = url.searchParams.get('unpause') === '1';
  const reindex = url.searchParams.get('reindex') === '1';
  const reindexOnly = url.searchParams.get('reindexOnly') === '1';
  const batches = Number(url.searchParams.get('batches') || 2) || 2;
  const limit = Number(url.searchParams.get('limit') || 60) || 60;

  const result = await bootstrapOutreach({
    batches,
    limit,
    totalMaxElapsedMs: 240_000,
    maxElapsedMs: 110_000,
    unpauseOnly,
    reindex,
    reindexOnly,
  });
  return NextResponse.json({ ok: true, mode: 'bootstrap', ...result });
}
