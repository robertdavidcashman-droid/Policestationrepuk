import { getAllBlogArticles } from '@/lib/blog/registry';
import { CUSTODYNOTE_SITE } from '@/lib/custodynote-promo';
import { POLICESTATIONAGENT_SITE } from '@/lib/policestationagent-promo';
import { POLICESTATIONAGENT_FEED_PROXY } from './rss-fetch';
import { SITE_URL } from '@/lib/seo-layer/config';
import { resolveAbsoluteImageUrl } from './assets';
import type { ContentFeedSource, SchedulablePost } from './content-types';
import { resolveBufferImageUrl, resolveGoogleBusinessImageUrlForPost, googleBusinessFeedFallbackUrl } from './image-url';
import { fetchRssWithFallback } from './rss-fetch';
import { parseRssItems, parseRssChannelImageUrl, slugFromUrl } from './rss';

export type FeedFetcher = (url: string) => Promise<string>;

/** Raster fallbacks when item images are missing or fail Buffer validation (SVG, >5MB, etc.). */
export function buildFeedDefaultImages(siteUrl: string = SITE_URL): Record<string, string> {
  const base = siteUrl.replace(/\/$/, '');
  return {
    custodynote: googleBusinessFeedFallbackUrl('custodynote', siteUrl),
    psrtrain: googleBusinessFeedFallbackUrl('psrtrain', siteUrl),
    policestationagent: googleBusinessFeedFallbackUrl('policestationagent', siteUrl),
    policestationrepuk: `${base}/social-preview.jpg`,
  };
}

export const FEED_DEFAULT_IMAGES: Record<string, string> = buildFeedDefaultImages();

export interface FeedLoadError {
  feedId: string;
  url?: string;
  message: string;
}

export interface LoadAllFeedPostsResult {
  posts: Map<string, SchedulablePost[]>;
  errors: FeedLoadError[];
}

const EXPECTED_FEED_IDS = ['policestationrepuk', 'custodynote', 'policestationagent', 'psrtrain'] as const;

const DEFAULT_FEEDS: ContentFeedSource[] = [
  { id: 'policestationrepuk', type: 'local' },
  { id: 'custodynote', type: 'rss', url: `${CUSTODYNOTE_SITE}/feed` },
  { id: 'policestationagent', type: 'rss', url: POLICESTATIONAGENT_FEED_PROXY },
  {
    id: 'psrtrain',
    type: 'rss',
    url: 'https://psrtrain.com/feed',
    postsPerDay: 4,
    dayPosts: 2,
    nightPosts: 2,
  },
];

function isContentFeedSource(value: unknown): value is ContentFeedSource {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || !v.id.trim()) return false;
  if (v.type === 'local') return true;
  if (v.type === 'rss' && typeof v.url === 'string' && v.url.trim()) return true;
  return false;
}

/** Validate parsed feed config — logs warnings when override drops expected feeds. */
export function validateContentFeeds(feeds: ContentFeedSource[]): ContentFeedSource[] {
  const valid = feeds.filter(isContentFeedSource);
  if (valid.length === 0) return DEFAULT_FEEDS;

  const ids = new Set(valid.map((f) => f.id));
  const missing = EXPECTED_FEED_IDS.filter((id) => !ids.has(id));
  if (missing.length > 0) {
    console.warn(
      `[buffer:feeds] BUFFER_CONTENT_FEEDS is missing expected feed IDs: ${missing.join(', ')}`,
    );
  }

  return valid;
}

export function getContentFeeds(): ContentFeedSource[] {
  const raw = process.env.BUFFER_CONTENT_FEEDS?.trim();
  if (!raw) return DEFAULT_FEEDS;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return validateContentFeeds(parsed as ContentFeedSource[]);
    }
  } catch {
    console.warn('[buffer:feeds] BUFFER_CONTENT_FEEDS is invalid JSON — using defaults');
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
    imageUrl: resolveAbsoluteImageUrl(base, article.image.src),
    imageAlt: article.image.alt,
  }));
}

async function rssPosts(
  feedId: string,
  url: string,
  fetchFn: FeedFetcher,
): Promise<SchedulablePost[]> {
  const xml = await fetchFn(url);
  const channelImage = parseRssChannelImageUrl(xml, url);
  const defaultImage = FEED_DEFAULT_IMAGES[feedId];
  return parseRssItems(xml).map((item) => ({
    feedId,
    slug: slugFromUrl(item.link),
    title: item.title,
    excerpt: item.description.replace(/<[^>]+>/g, '').trim().slice(0, 400),
    url: item.link,
    imageUrl: item.imageUrl ?? channelImage ?? defaultImage,
    imageAlt: item.title,
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

/** Ensure each post imageUrl is reachable, raster, and ≤ Buffer 5MB limit. */
export async function hydratePostImagesForBuffer(
  posts: SchedulablePost[],
  feedId: string,
  httpFetch: typeof fetch = fetch,
): Promise<SchedulablePost[]> {
  const fallback = FEED_DEFAULT_IMAGES[feedId];
  const out: SchedulablePost[] = [];

  for (const post of posts) {
    const resolved = await resolveBufferImageUrl(
      [post.imageUrl, fallback],
      httpFetch,
    );
    out.push(resolved ? { ...post, imageUrl: resolved } : { ...post, imageUrl: undefined });
  }

  return out;
}

/** Resolve self-hosted JPEG/PNG URL for Google Business per post. */
export async function hydrateGoogleBusinessImages(
  posts: SchedulablePost[],
  httpFetch: typeof fetch = fetch,
): Promise<SchedulablePost[]> {
  const out: SchedulablePost[] = [];
  for (const post of posts) {
    const gbpUrl = await resolveGoogleBusinessImageUrlForPost(post, httpFetch);
    out.push(gbpUrl ? { ...post, googleBusinessImageUrl: gbpUrl } : { ...post, googleBusinessImageUrl: undefined });
  }
  return out;
}

export async function loadAllFeedPosts(
  fetchFn?: FeedFetcher,
  options?: { imageFetch?: typeof fetch },
): Promise<LoadAllFeedPostsResult> {
  const fn = fetchFn ?? defaultFetch;
  const imageFetch = options?.imageFetch ?? fetch;
  const feeds = getContentFeeds();
  const posts = new Map<string, SchedulablePost[]>();
  const errors: FeedLoadError[] = [];

  for (const feed of feeds) {
    try {
      const loaded = await loadFeedPosts(feed, fn);
      const hydrated = await hydratePostImagesForBuffer(loaded, feed.id, imageFetch);
      const withGbp = await hydrateGoogleBusinessImages(hydrated, imageFetch);
      posts.set(feed.id, withGbp);
      if (withGbp.length === 0) {
        errors.push({
          feedId: feed.id,
          url: feed.type === 'rss' ? feed.url : undefined,
          message: 'Feed returned zero posts',
        });
      }
      const missingImages = withGbp.filter((p) => !p.imageUrl).length;
      if (missingImages > 0) {
        errors.push({
          feedId: feed.id,
          url: feed.type === 'rss' ? feed.url : undefined,
          message: `${missingImages} post(s) have no Buffer-compatible image after validation`,
        });
      }
      const missingGbp = withGbp.filter((p) => !p.googleBusinessImageUrl).length;
      if (missingGbp > 0) {
        errors.push({
          feedId: feed.id,
          url: feed.type === 'rss' ? feed.url : undefined,
          message: `${missingGbp} post(s) have no Google Business compatible image after validation`,
        });
      }
    } catch (err) {
      errors.push({
        feedId: feed.id,
        url: feed.type === 'rss' ? feed.url : undefined,
        message: err instanceof Error ? err.message : 'Feed load failed',
      });
      posts.set(feed.id, []);
    }
  }

  return { posts, errors };
}

async function defaultFetch(url: string): Promise<string> {
  return fetchRssWithFallback(url);
}
