import { NextResponse } from 'next/server';
import { submitSitemapToIndexNow } from '@/lib/indexnow-pipeline';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Daily IndexNow sweep — backup if a postbuild submission was missed.
 * Auth: Bearer ${CRON_SECRET} (Vercel Cron) or x-cron-secret in development.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await submitSitemapToIndexNow({ source: 'live' });
    return NextResponse.json({
      ok: true,
      source: result.source,
      status: result.status,
      submitted: result.submitted,
      batches: result.batches,
      keyLocation: result.keyLocation,
    });
  } catch (err) {
    console.error('[cron:indexnow]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'IndexNow failed' },
    );
  }
}
