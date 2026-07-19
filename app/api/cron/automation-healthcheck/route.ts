import { NextResponse } from 'next/server';
import { runDailyHealthcheck } from '@/lib/automation/healthcheck';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Authoritative daily automation health-check and self-heal.
 * Schedule: 15 7 * * * UTC (after principal Buffer + sibling schedules).
 *
 * Auth: Bearer ${CRON_SECRET}
 * Query: dryRun=1, force=1
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === '1';
  const force = url.searchParams.get('force') === '1';

  try {
    const result = await runDailyHealthcheck({ dryRun, force });
    return NextResponse.json(result, {
      status: result.skipped ? 200 : result.ok ? 200 : 200,
    });
  } catch (err) {
    console.error('[cron:automation-healthcheck]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'healthcheck failed' },
      { status: 500 },
    );
  }
}
