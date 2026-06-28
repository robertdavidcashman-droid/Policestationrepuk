import { NextResponse } from 'next/server';
import { verifyRepukBufferSchedule } from '@/lib/buffer/engine-run';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Daily verify — confirm >=5 posts scheduled today; gap-fill if under quota. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await verifyRepukBufferSchedule({ gapFill: true });
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (err) {
    console.error('[cron:buffer-verify]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'verify failed' },
      { status: 500 },
    );
  }
}
