import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { createRepukBufferAdapter } from '@/lib/buffer/site-adapter';
import { getSlugEngagementStats, slugClickRate } from '@robertcashman/buffer-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Weekly Buffer CTR refinement — top/bottom slugs by click rate. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adapter = createRepukBufferAdapter();
  const stats = await getSlugEngagementStats(adapter.kv ?? null, adapter.siteId);
  const ranked = [...stats.values()]
    .map((s) => ({ ...s, ctr: slugClickRate(s) }))
    .sort((a, b) => b.ctr - a.ctr);

  return NextResponse.json({
    ok: true,
    siteId: adapter.siteId,
    slugCount: ranked.length,
    top: ranked.slice(0, 5),
    bottom: ranked.slice(-5).reverse(),
  });
}
