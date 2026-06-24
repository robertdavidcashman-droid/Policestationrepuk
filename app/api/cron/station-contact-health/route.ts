import { NextResponse } from 'next/server';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { getAllFindings } from '@/lib/custody-discovery/storage';
import { getAllStations } from '@/lib/data';
import { getPendingStationUpdates } from '@/lib/station-overrides';
import { isCronAuthorized } from '@/lib/cron-auth';
import {
  buildStationContactOverview,
  buildStationContactSummary,
} from '@/lib/station-contacts/health';
import type { StationContactSnapshot } from '@/lib/station-contacts/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * Weekly station contact health snapshot (metrics only — never publishes data).
 *
 * Auth: Bearer ${CRON_SECRET} or x-cron-secret header.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const writeReport = url.searchParams.get('write') !== '0';

  const [stations, findings, pending] = await Promise.all([
    getAllStations(),
    getAllFindings(),
    getPendingStationUpdates(),
  ]);

  const openFindingsByStationId: Record<string, number> = {};
  let openFindingsTotal = 0;
  for (const finding of findings) {
    if (finding.status !== 'new' && finding.status !== 'needs_review') continue;
    openFindingsTotal += 1;
    openFindingsByStationId[finding.custodySuiteId] =
      (openFindingsByStationId[finding.custodySuiteId] ?? 0) + 1;
  }

  const ctx = {
    openFindingsByStationId,
    pendingUpdateStationIds: new Set(pending.map((p) => p.stationId)),
  };

  const summaries = stations.map((s) => buildStationContactSummary(s, ctx));
  const overview = buildStationContactOverview(
    summaries,
    openFindingsTotal,
    pending.length,
  );

  const snapshot: StationContactSnapshot = {
    generatedAt: overview.generatedAt,
    overview,
    stations: summaries,
  };

  if (writeReport) {
    const date = overview.generatedAt.slice(0, 10);
    const dir = resolve(process.cwd(), 'data/reports');
    mkdirSync(dir, { recursive: true });
    const path = resolve(dir, `station-contact-health-${date}.json`);
    writeFileSync(path, JSON.stringify(snapshot, null, 2) + '\n');
  }

  return NextResponse.json({
    ok: true,
    wroteReport: writeReport,
    overview,
  });
}
