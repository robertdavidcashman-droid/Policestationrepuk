import { NextResponse } from 'next/server';
import { runCustodyDiscoveryCrawler } from '@/lib/custody-discovery/crawler';
import { flushPendingDailyDigest, notifyIfNewFindings } from '@/lib/custody-discovery/notify';
import { seedFindingsFromOfficialJson } from '@/lib/custody-discovery/seed-json';
import { buildCustodySuitesFromStations } from '@/lib/custody-discovery/suites';
import { bootstrapCustodySuites } from '@/lib/custody-discovery/storage';
import { getAllStations } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Scheduled custody telephone discovery crawler (every 6 hours via vercel.json).
 * Rotates through the full police station directory (~900 stations) via KV
 * cursor — each run scans the next batch, not the same stations every time.
 *
 * Query params:
 * - `limit` — suites per run (default CUSTODY_DISCOVERY_BATCH_LIMIT or 25)
 * - `forceDigest=1` — send today's queued digest even before 18:00 London
 * - `digestOnly=1` — skip the crawl and only attempt the digest send (implies forceDigest)
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
  const forceDigest =
    digestOnly || url.searchParams.get('forceDigest') === '1';

  if (digestOnly) {
    const notification = await flushPendingDailyDigest(new Date(), { force: true });
    return NextResponse.json({ ok: true, mode: 'digest-only', notification });
  }

  const limit = Number(url.searchParams.get('limit') || process.env.CUSTODY_DISCOVERY_BATCH_LIMIT || 25);

  const stations = await getAllStations();
  const suites = buildCustodySuitesFromStations(stations);
  await bootstrapCustodySuites(suites);
  const seeded = await seedFindingsFromOfficialJson(suites);
  const { stats, newFindingIds: crawledIds } = await runCustodyDiscoveryCrawler(suites, { limit });
  const allNewIds = [...seeded.newFindingIds, ...crawledIds];

  const notification = await notifyIfNewFindings({
    newFindingIds: allNewIds,
    stats,
    seededCreated: seeded.created,
    forceDigest,
  });

  return NextResponse.json({
    ok: true,
    seeded,
    notification,
    forceDigest,
    ...stats,
  });
}
