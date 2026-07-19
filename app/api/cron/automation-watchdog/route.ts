import { NextResponse } from 'next/server';
import { runAutomationWatchdog } from '@/lib/automation/watchdog';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * Lightweight hourly watchdog — overdue critical jobs, stuck locks, auth failures.
 * Schedule: 20 * * * * UTC
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === '1';

  try {
    const result = await runAutomationWatchdog({ dryRun });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cron:automation-watchdog]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'watchdog failed' },
      { status: 500 },
    );
  }
}
