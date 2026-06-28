import type { SchedulablePost } from './types';
import {
  googleBusinessFeedFallbackUrl,
  probeGoogleBusinessImageUrl,
  resolveGoogleBusinessImageUrlForPost,
} from './image-url';

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

export function isAllowedGbpAssetUrl(url: string, siteUrl: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || isDisallowedGbpAssetUrl(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    const siteHost = new URL(siteUrl.replace(/\/$/, '')).hostname;
    if (parsed.hostname === siteHost) return true;
    if (parsed.pathname.includes('/images/buffer/')) return true;
    return false;
  } catch {
    return false;
  }
}

export async function collectGoogleBusinessPreflightIssues(
  posts: SchedulablePost[],
  siteUrl: string,
  fetchFn: typeof fetch = fetch,
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
        reason: `GBP image must be self-hosted JPEG/PNG on ${new URL(siteUrl).hostname}`,
      });
      continue;
    }

    const probe = await probeGoogleBusinessImageUrl(gbpImageUrl, fetchFn, siteUrl);
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

export function expectedGbpFallbackForFeed(feedId: string, siteUrl: string): string {
  return googleBusinessFeedFallbackUrl(feedId, siteUrl);
}
