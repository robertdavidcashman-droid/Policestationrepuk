import { INDEXNOW_KEY_LOCATION, submitIndexNow, type IndexNowResult } from '@/lib/indexnow';
import { SITE_URL } from '@/lib/seo-layer/config';
import { getSitemapUrlList } from '@/lib/sitemap-build';

const LIVE_SITEMAP_BASE = (process.env.SITE_URL || SITE_URL).replace(/\/$/, '');

function parseSitemapXml(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1].trim());
}

/** Fetch URLs from the live `/sitemap.xml` (used by manual CLI runs). */
export async function fetchLiveSitemapUrls(siteUrl = LIVE_SITEMAP_BASE): Promise<string[]> {
  const res = await fetch(`${siteUrl}/sitemap.xml`, {
    headers: { 'user-agent': 'PoliceStationRepUK-indexnow/1.0' },
  });
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  const locs = parseSitemapXml(xml);
  if (/<sitemapindex/i.test(xml)) {
    const nested: string[] = [];
    for (const child of locs.slice(0, 20)) {
      const r = await fetch(child, { headers: { 'user-agent': 'PoliceStationRepUK-indexnow/1.0' } });
      if (r.ok) nested.push(...parseSitemapXml(await r.text()));
    }
    return nested.length ? nested : locs;
  }
  return locs;
}

export type IndexNowPipelineResult = IndexNowResult & {
  source: 'build' | 'live';
  keyLocation: string;
};

/** Submit sitemap URLs to IndexNow from build-time data or the live site. */
export async function submitSitemapToIndexNow(options?: {
  source?: 'build' | 'live';
  siteUrl?: string;
}): Promise<IndexNowPipelineResult> {
  const source = options?.source ?? 'build';
  const urls =
    source === 'live'
      ? await fetchLiveSitemapUrls(options?.siteUrl)
      : await getSitemapUrlList();

  if (urls.length === 0) {
    throw new Error('IndexNow: no URLs to submit');
  }

  const result = await submitIndexNow(urls);
  return { ...result, source, keyLocation: INDEXNOW_KEY_LOCATION };
}
