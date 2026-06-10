import type { SchedulablePost } from './content-types';
import {
  googleBusinessFeedFallbackUrl,
  probeGoogleBusinessImageUrl,
  resolveGoogleBusinessImageUrlForPost,
} from './image-url';
import { SITE_URL } from '@/lib/seo-layer/config';

export interface GbpPreflightIssue {
  feedId: string;
  slug: string;
  rawImageUrl?: string;
  gbpImageUrl?: string;
  reason: string;
}

export function isDisallowedGbpAssetUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (/\.webp(\?|$)/i.test(trimmed)) return true;
  if (/opengraph-image/i.test(trimmed)) return true;
  return false;
}

export function isAllowedGbpAssetUrl(url: string, siteUrl: string = SITE_URL): boolean {
  const trimmed = url.trim();
  if (!trimmed || isDisallowedGbpAssetUrl(trimmed)) return false;

  try {
    const parsed = new URL(trimmed);
    const siteHost = new URL(siteUrl.replace(/\/$/, '')).hostname;
    if (parsed.hostname === siteHost) return true;
    if (parsed.pathname.includes('/images/buffer/gbp/')) return true;
    return false;
  } catch {
    return false;
  }
}

export async function collectGoogleBusinessPreflightIssues(
  posts: SchedulablePost[],
  fetchFn: typeof fetch = fetch,
  siteUrl: string = SITE_URL,
): Promise<GbpPreflightIssue[]> {
  const issues: GbpPreflightIssue[] = [];

  for (const post of posts) {
    const rawImageUrl = post.imageUrl?.trim();
    const gbpImageUrl =
      post.googleBusinessImageUrl?.trim() ??
      (await resolveGoogleBusinessImageUrlForPost(post, fetchFn, siteUrl));

    if (!gbpImageUrl) {
      issues.push({
        feedId: post.feedId,
        slug: post.slug,
        rawImageUrl,
        reason: 'no Google Business compatible JPEG/PNG image',
      });
      continue;
    }

    if (!isAllowedGbpAssetUrl(gbpImageUrl, siteUrl)) {
      issues.push({
        feedId: post.feedId,
        slug: post.slug,
        rawImageUrl,
        gbpImageUrl,
        reason: 'GBP image must be self-hosted JPEG/PNG on policestationrepuk.org',
      });
      continue;
    }

    const probe = await probeGoogleBusinessImageUrl(gbpImageUrl, fetchFn);
    if (!probe.ok) {
      issues.push({
        feedId: post.feedId,
        slug: post.slug,
        rawImageUrl,
        gbpImageUrl,
        reason: probe.reason ?? 'Google Business image probe failed',
      });
    }
  }

  return issues;
}

export async function assertGoogleBusinessScheduleReady(
  posts: SchedulablePost[],
  fetchFn: typeof fetch = fetch,
  siteUrl: string = SITE_URL,
): Promise<GbpPreflightIssue[]> {
  return collectGoogleBusinessPreflightIssues(posts, fetchFn, siteUrl);
}

export function expectedGbpFallbackForFeed(feedId: string, siteUrl: string = SITE_URL): string {
  return googleBusinessFeedFallbackUrl(feedId, siteUrl);
}
