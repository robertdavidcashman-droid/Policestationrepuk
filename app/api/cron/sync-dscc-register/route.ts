import { NextResponse } from 'next/server';
import { refreshDsccRegisterCache } from '@/lib/dscc-register-lookup';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Nightly sync of the DSCC accredited-representative register into KV.
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

  const started = Date.now();
  const cache = await refreshDsccRegisterCache();

  return NextResponse.json({
    ok: Boolean(cache),
    count: cache?.count ?? 0,
    syncedAt: cache?.syncedAt ?? null,
    elapsedMs: Date.now() - started,
  });
}
