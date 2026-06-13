import { NextResponse } from 'next/server';
import { submitSitemapToIndexNow } from '@/lib/indexnow-pipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Daily IndexNow sweep — backup if a postbuild submission was missed.
 * Auth: Bearer ${CRON_SECRET} (Vercel Cron) or x-cron-secret in development.
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

  try {
    const result = await submitSitemapToIndexNow({ source: 'build' });
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
