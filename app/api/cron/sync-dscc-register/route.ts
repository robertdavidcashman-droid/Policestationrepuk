import { NextResponse } from 'next/server';
import { refreshDsccRegisterCache } from '@/lib/dscc-register-lookup';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Nightly sync of the DSCC accredited-representative register into KV.
 * Auth: Bearer ${CRON_SECRET} or x-cron-secret header.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const started = Date.now();
  const cache = await refreshDsccRegisterCache();

  return NextResponse.json({
    ok: Boolean(cache),
    count: cache?.count ?? 0,
    syncedAt: cache?.syncedAt ?? null,
    elapsedMs: Date.now() - started,
  });
}
