import { getAllBlogArticles } from '@/lib/blog/registry';
import { CUSTODYNOTE_SITE } from '@/lib/custodynote-promo';
import { POLICESTATIONAGENT_SITE } from '@/lib/policestationagent-promo';
import { SITE_URL } from '@/lib/seo-layer/config';
import type { ContentFeedSource, SchedulablePost } from './content-types';
import { parseRssItems, slugFromUrl } from './rss';

export type FeedFetcher = (url: string) => Promise<string>;

const DEFAULT_FEEDS: ContentFeedSource[] = [
  { id: 'policestationrepuk', type: 'local' },
  { id: 'custodynote', type: 'rss', url: `${CUSTODYNOTE_SITE}/feed` },
  { id: 'policestationagent', type: 'rss', url: `${POLICESTATIONAGENT_SITE}/feed.xml` },
];

export function getContentFeeds(): ContentFeedSource[] {
  const raw = process.env.BUFFER_CONTENT_FEEDS?.trim();
  if (!raw) return DEFAULT_FEEDS;
  try {
    const parsed = JSON.parse(raw) as ContentFeedSource[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    /* fall through */
  }
  return DEFAULT_FEEDS;
}

function localPosts(feedId: string): SchedulablePost[] {
  const base = SITE_URL.replace(/\/$/, '');
  return getAllBlogArticles().map((article) => ({
    feedId,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt.trim(),
    url: `${base}/Blog/${article.slug}`,
  }));
}

async function rssPosts(
  feedId: string,
  url: string,
  fetchFn: FeedFetcher,
): Promise<SchedulablePost[]> {
  const xml = await fetchFn(url);
  return parseRssItems(xml).map((item) => ({
    feedId,
    slug: slugFromUrl(item.link),
    title: item.title,
    excerpt: item.description.replace(/<[^>]+>/g, '').trim().slice(0, 400),
    url: item.link,
  }));
}

export async function loadFeedPosts(
  source: ContentFeedSource,
  fetchFn: FeedFetcher = defaultFetch,
): Promise<SchedulablePost[]> {
  if (source.type === 'local') {
    return localPosts(source.id);
  }
  return rssPosts(source.id, source.url, fetchFn);
}

export async function loadAllFeedPosts(
  fetchFn?: FeedFetcher,
): Promise<Map<string, SchedulablePost[]>> {
  const fn = fetchFn ?? defaultFetch;
  const feeds = getContentFeeds();
  const out = new Map<string, SchedulablePost[]>();
  for (const feed of feeds) {
    out.set(feed.id, await loadFeedPosts(feed, fn));
  }
  return out;
}

async function defaultFetch(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    throw new Error(`Feed fetch failed ${url}: HTTP ${res.status}`);
  }
  return res.text();
}
