import { NextResponse } from 'next/server';
import { runApprovedRecheckBatch } from '@/lib/custody-discovery/approved-recheck';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Re-verify published custody numbers against their original sources every
 * CUSTODY_RECHECK_DAYS (default 90). Numbers are never deleted automatically:
 * a missing source or changed number downgrades to `unverified` and reopens
 * the source finding for human review.
 *
 * Query: `limit` — approved numbers per run (default CUSTODY_RECHECK_BATCH_LIMIT or 20)
 *
 * Auth: Bearer ${CRON_SECRET} or x-cron-secret header.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get('limit'));
  const stats = await runApprovedRecheckBatch(
    Number.isFinite(limitParam) && limitParam > 0 ? { limit: limitParam } : undefined,
  );

  return NextResponse.json({ ok: true, mode: 'approved-recheck', ...stats });
}
