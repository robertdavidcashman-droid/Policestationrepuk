import { NextResponse } from 'next/server';
import { runCustodyDiscoveryCrawler } from '@/lib/custody-discovery/crawler';
import { runAiReviewBatch, runAiReviewForNewFindings } from '@/lib/custody-discovery/ai-review-backlog';
import { flushPendingDailyDigest, notifyIfNewFindings } from '@/lib/custody-discovery/notify';
import { seedFindingsFromOfficialJson } from '@/lib/custody-discovery/seed-json';
import { buildCustodySuitesFromStations } from '@/lib/custody-discovery/suites';
import { bootstrapCustodySuites } from '@/lib/custody-discovery/storage';
import { getAllStations } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

function aiBatchLimit(): number {
  return Math.max(1, Number(process.env.CUSTODY_AI_BATCH_LIMIT ?? 50));
}

/**
 * Scheduled custody telephone discovery crawler (every 6 hours via vercel.json).
 *
 * Query params:
 * - `limit` — suites per run (default CUSTODY_DISCOVERY_BATCH_LIMIT or 25)
 * - `forceDigest=1` — send today's queued digest even before 18:00 London
 * - `digestOnly=1` — skip crawl; only send digest (implies forceDigest)
 * - `aiReviewOnly=1` — skip crawl; only AI-review existing backlog
 *
 * Auth: Bearer ${CRON_SECRET} or x-cron-secret header.
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

  const url = new URL(request.url);
  const digestOnly = url.searchParams.get('digestOnly') === '1';
  const aiReviewOnly = url.searchParams.get('aiReviewOnly') === '1';
  const forceDigest =
    digestOnly || url.searchParams.get('forceDigest') === '1';

  if (digestOnly) {
    const notification = await flushPendingDailyDigest(new Date(), { force: true });
    return NextResponse.json({ ok: true, mode: 'digest-only', notification });
  }

  if (aiReviewOnly) {
    const aiReview = await runAiReviewBatch({ limit: aiBatchLimit() });
    return NextResponse.json({ ok: true, mode: 'ai-review-only', aiReview });
  }

  const limit = Number(url.searchParams.get('limit') || process.env.CUSTODY_DISCOVERY_BATCH_LIMIT || 25);

  const stations = await getAllStations();
  const suites = buildCustodySuitesFromStations(stations);
  await bootstrapCustodySuites(suites);
  const seeded = await seedFindingsFromOfficialJson(suites);
  const { stats, newFindingIds: crawledIds } = await runCustodyDiscoveryCrawler(suites, { limit });
  const allNewIds = [...seeded.newFindingIds, ...crawledIds];

  const aiReview = await runAiReviewForNewFindings(allNewIds, aiBatchLimit());

  const notification = await notifyIfNewFindings({
    newFindingIds: allNewIds,
    stats,
    seededCreated: seeded.created,
    forceDigest,
  });

  return NextResponse.json({
    ok: true,
    seeded,
    aiReview,
    notification,
    forceDigest,
    ...stats,
  });
}
