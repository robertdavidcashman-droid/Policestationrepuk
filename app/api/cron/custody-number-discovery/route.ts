import { NextResponse } from 'next/server';
import { runCustodyDiscoveryCrawler } from '@/lib/custody-discovery/crawler';
import { seedFindingsFromOfficialJson } from '@/lib/custody-discovery/seed-json';
import { buildCustodySuitesFromStations } from '@/lib/custody-discovery/suites';
import { bootstrapCustodySuites } from '@/lib/custody-discovery/storage';
import { getAllStations } from '@/lib/data';
import { isCronAuthorized } from '@/lib/cron-auth';
import { saveCronRunLog } from '@/lib/cron-run-log';
import { claimKey } from '@/lib/kv-atomic';
import { validateCustodyEnv } from '@/lib/pipeline-env';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

const RUN_LOCK_TTL_SECONDS = 270;
const DEFAULT_MAX_ELAPSED_MS = 240_000;

function batchLimit(): number {
  return Math.max(1, Number(process.env.CUSTODY_DISCOVERY_BATCH_LIMIT ?? 10));
}

function maxElapsedMs(): number {
  return Math.max(30_000, Number(process.env.CUSTODY_DISCOVERY_MAX_ELAPSED_MS ?? DEFAULT_MAX_ELAPSED_MS));
}

/**
 * Scheduled custody telephone discovery crawler (every 6 hours via vercel.json).
 *
 * Default mode is bounded crawl work only. Use dedicated routes for AI review
 * and digest delivery:
 * - `aiReviewOnly=1` — AI-review backlog only
 * - `digestOnly=1` — send queued digest only
 *
 * Query params:
 * - `limit` — suites per run (default CUSTODY_DISCOVERY_BATCH_LIMIT or 10)
 *
 * Auth: Bearer ${CRON_SECRET} or x-cron-secret header.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const digestOnly = url.searchParams.get('digestOnly') === '1';
  const aiReviewOnly = url.searchParams.get('aiReviewOnly') === '1';

  if (digestOnly || aiReviewOnly) {
    return NextResponse.json(
      {
        ok: false,
        error: 'use_dedicated_route',
        hint: digestOnly
          ? 'Use /api/cron/custody-discovery-digest for digest-only runs'
          : 'Use /api/cron/custody-discovery-ai-review for AI-review-only runs',
      },
      { status: 400 },
    );
  }

  const envCheck = validateCustodyEnv();
  if (!envCheck.ok) {
    return NextResponse.json(
      { ok: false, error: 'custody_env_invalid', errors: envCheck.errors },
      { status: 500 },
    );
  }

  const lockClaimed = await claimKey('custody:discovery:run', RUN_LOCK_TTL_SECONDS);
  if (!lockClaimed) {
    return NextResponse.json(
      { ok: false, error: 'overlap', reason: 'Another discovery run is in progress' },
      { status: 409 },
    );
  }

  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const limit = Number(url.searchParams.get('limit') || batchLimit());

  try {
    const stations = await getAllStations();
    const suites = buildCustodySuitesFromStations(stations);
    await bootstrapCustodySuites(suites);
    const seeded = await seedFindingsFromOfficialJson(suites);
    const { stats, newFindingIds: crawledIds } = await runCustodyDiscoveryCrawler(suites, {
      limit,
      maxElapsedMs: maxElapsedMs(),
    });

    const outcome = stats.partial ? 'partial' : 'success';
    await saveCronRunLog({
      jobName: 'custody-number-discovery',
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - t0,
      outcome,
      counts: {
        suitesScanned: stats.suitesScanned,
        findingsCreated: stats.findingsCreated,
        findingsUpdated: stats.findingsUpdated,
      },
    });

    return NextResponse.json({
      ok: true,
      mode: 'crawl-only',
      seeded,
      newFindingIds: [...seeded.newFindingIds, ...crawledIds],
      partial: Boolean(stats.partial),
      ...stats,
    });
  } catch (err) {
    console.error('[cron:custody-number-discovery]', err);
    await saveCronRunLog({
      jobName: 'custody-number-discovery',
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - t0,
      outcome: 'failed',
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'discovery failed' },
      { status: 500 },
    );
  }
}
