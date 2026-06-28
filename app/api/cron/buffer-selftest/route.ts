import { NextResponse } from 'next/server';
import { runRepukBufferSelfTest } from '@/lib/buffer/engine-run';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Daily self-test — confirm yesterday sent >=5; ingest Buffer click metrics. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runRepukBufferSelfTest();
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (err) {
    console.error('[cron:buffer-selftest]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'selftest failed' },
      { status: 500 },
    );
  }
}
