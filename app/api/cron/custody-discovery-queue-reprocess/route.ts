import { NextResponse } from 'next/server';
import { runOpenQueueReprocess } from '@/lib/custody-discovery/queue-reprocessor';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Nightly open-queue pass: re-fetch weak evidence, resolve conflicts, re-run auto-decision.
 *
 * Auth: Bearer ${CRON_SECRET} or x-cron-secret header.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runOpenQueueReprocess();
  return NextResponse.json({ ok: true, mode: 'queue-reprocess', result });
}
