import { NextResponse } from 'next/server';
import { fetchUpstreamRssXml } from '@/lib/buffer/rss-fetch';
import { POLICESTATIONAGENT_SITE } from '@/lib/policestationagent-promo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * First-party RSS proxy for policestationagent.com — avoids 403 bot blocks when
 * Buffer and verify scripts fetch from Vercel egress IPs.
 */
export async function GET() {
  try {
    const xml = await fetchUpstreamRssXml(`${POLICESTATIONAGENT_SITE}/feed.xml`);
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Feed proxy failed';
    console.error('[feeds/policestationagent]', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
