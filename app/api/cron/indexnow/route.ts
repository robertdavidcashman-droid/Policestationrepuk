import { NextResponse } from 'next/server';
import { submitSitemapToIndexNow, fetchLiveSitemapUrls } from '@/lib/indexnow-pipeline';
import { submitToBing } from '@/lib/bing-submit';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Daily IndexNow sweep — backup if a postbuild submission was missed.
 * Also submits directly to Bing when BING_WEBMASTER_API_KEY is set.
 * Auth: Bearer ${CRON_SECRET} (Vercel Cron) or x-cron-secret in development.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await submitSitemapToIndexNow({ source: 'live' });
    const bing = await submitToBing(await fetchLiveSitemapUrls().catch(() => []));
    return NextResponse.json({
      ok: true,
      source: result.source,
      status: result.status,
      submitted: result.submitted,
      batches: result.batches,
      keyLocation: result.keyLocation,
      bing,
    });
  } catch (err) {
    console.error('[cron:indexnow]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'IndexNow failed' },
    );
  }
}
