import { NextResponse } from 'next/server';
import { isOutreachBootstrapAuthorized } from '@/lib/cron-auth';
import { runOutreachSendProbes } from '@/lib/firm-outreach/outreach/probe-send';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Pre-flight Resend probes for RepUK + PSA campaigns/sites.
 * Sends one operator-only test email per campaign (unless dryRun=1).
 */
export async function GET(request: Request) {
  if (!isOutreachBootstrapAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === '1';
  const to = url.searchParams.get('to')?.trim() || undefined;

  const result = await runOutreachSendProbes({ dryRun, to });
  return NextResponse.json(
    { mode: dryRun ? 'probe-dry-run' : 'probe', ...result },
    { status: result.ok || dryRun ? 200 : 503 },
  );
}
