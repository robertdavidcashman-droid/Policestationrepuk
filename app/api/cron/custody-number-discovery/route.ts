import { NextResponse } from 'next/server';
import { runCustodyDiscoveryCrawler } from '@/lib/custody-discovery/crawler';
import { notifyIfNewFindings } from '@/lib/custody-discovery/notify';
import { seedFindingsFromOfficialJson } from '@/lib/custody-discovery/seed-json';
import { buildCustodySuitesFromStations } from '@/lib/custody-discovery/suites';
import { bootstrapCustodySuites, getAllCustodySuites } from '@/lib/custody-discovery/storage';
import { getAllStations } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Scheduled custody telephone discovery crawler (every 6 hours via vercel.json).
 * Rotates through the full police station directory (~900 stations) via KV
 * cursor — each run scans the next batch, not the same stations every time.
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
  const limit = Number(url.searchParams.get('limit') || process.env.CUSTODY_DISCOVERY_BATCH_LIMIT || 25);

  const stations = await getAllStations();
  const built = buildCustodySuitesFromStations(stations);
  await bootstrapCustodySuites(built);

  const suites = await getAllCustodySuites();
  const seeded = await seedFindingsFromOfficialJson(suites);
  const { stats, newFindingIds: crawledIds } = await runCustodyDiscoveryCrawler(suites, { limit });
  const allNewIds = [...seeded.newFindingIds, ...crawledIds];

  const notification = await notifyIfNewFindings({
    newFindingIds: allNewIds,
    stats,
    seededCreated: seeded.created,
  });

  return NextResponse.json({
    ok: true,
    seeded,
    notification,
    ...stats,
  });
}
