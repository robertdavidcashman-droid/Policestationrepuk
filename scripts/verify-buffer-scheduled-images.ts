#!/usr/bin/env npx tsx
/**
 * Verify today's scheduled Buffer posts have blog hero images in Buffer-compatible format.
 * Usage: npm run buffer:verify-scheduled-images
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { listScheduledBufferPosts } from '../lib/buffer/client';
import {
  getBufferApiKey,
  getBufferChannels,
  getBufferOrganizationId,
  getSchedulerTimezone,
} from '../lib/buffer/config';
import { FEED_DEFAULT_IMAGES, loadAllFeedPosts } from '../lib/buffer/feeds';
import {
  BUFFER_MAX_IMAGE_BYTES,
  isBufferCompatibleContentType,
  isGoogleBusinessImageContentType,
  isRasterImagePath,
  probeBufferImageUrl,
  probeGoogleBusinessImageUrl,
} from '../lib/buffer/image-url';
import { isDisallowedGbpAssetUrl } from '../lib/buffer/gbp-preflight';
import { localDateInTimezone, timezoneOffsetForDate } from '../lib/buffer/scheduler-core';
import type { SchedulablePost } from '../lib/buffer/content-types';

function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseFeedFromUrl(url: string): string {
  if (url.includes('policestationrepuk.org')) return 'policestationrepuk';
  if (url.includes('custodynote.com')) return 'custodynote';
  if (url.includes('policestationagent.com')) return 'policestationagent';
  if (url.includes('psrtrain.com')) return 'psrtrain';
  return 'unknown';
}

function slugFromPostText(text: string): string | null {
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  if (!urlMatch) return null;
  try {
    return new URL(urlMatch[0]).pathname.split('/').filter(Boolean).pop() ?? null;
  } catch {
    return null;
  }
}

function findFeedPost(
  posts: Map<string, SchedulablePost[]>,
  feedId: string,
  slug: string,
): SchedulablePost | undefined {
  return (posts.get(feedId) ?? []).find((p) => p.slug === slug);
}

function isFallbackImage(feedId: string, imageUrl: string | undefined): boolean {
  const fallback = FEED_DEFAULT_IMAGES[feedId];
  return !!fallback && !!imageUrl && imageUrl.trim() === fallback;
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env.vercel.production');

  const apiKey = getBufferApiKey();
  if (!apiKey) {
    console.error('BUFFER_API_KEY is not set');
    process.exit(1);
  }

  const timezone = getSchedulerTimezone();
  const localDate = localDateInTimezone(new Date(), timezone);
  const offset = timezoneOffsetForDate(localDate, timezone);
  const start = `${localDate}T00:00:00${offset}`;
  const end = `${localDate}T23:59:59${offset}`;

  const { posts: feedPosts, errors: feedErrors } = await loadAllFeedPosts();
  if (feedErrors.length > 0) {
    console.warn('Feed load warnings:', feedErrors);
  }

  const scheduled = await listScheduledBufferPosts(apiKey, getBufferOrganizationId(), {
    dueAtStart: start,
    dueAtEnd: end,
    channelIds: getBufferChannels().map((c) => c.id),
  });

  const issues: Array<Record<string, unknown>> = [];
  const fallbacks: Array<Record<string, unknown>> = [];
  const checked: Array<Record<string, unknown>> = [];

  for (const item of scheduled) {
    const slug = slugFromPostText(item.text);
    const urlMatch = item.text.match(/https?:\/\/[^\s]+/);
    const articleUrl = urlMatch?.[0] ?? '';
    const feedId = articleUrl ? parseFeedFromUrl(articleUrl) : 'unknown';
    const feedPost = slug && feedId !== 'unknown' ? findFeedPost(feedPosts, feedId, slug) : undefined;
    const imageUrl = feedPost?.imageUrl;

    const row: Record<string, unknown> = {
      postId: item.id,
      dueAt: item.dueAt,
      feedId,
      slug: slug ?? '(unknown)',
      channel: item.channelService,
      bufferHasImage: item.hasImage,
      bufferAssetUrl: item.imageUrl,
      bufferMimeType: item.mimeType,
      feedImageUrl: imageUrl,
      expectedGbpImageUrl: feedPost?.googleBusinessImageUrl,
    };

    const isGoogleBusiness = item.channelService === 'googlebusiness';

    if (!item.hasImage) {
      issues.push({ ...row, issue: 'Buffer post has no image asset attached' });
    }

    if (isGoogleBusiness) {
      if (!item.imageUrl?.trim()) {
        issues.push({ ...row, issue: 'Google Business post missing Buffer asset image URL' });
      } else if (/\.webp(\?|$)/i.test(item.imageUrl)) {
        issues.push({ ...row, issue: 'Google Business Buffer asset URL is WebP (requires JPEG/PNG)' });
      } else if (item.mimeType && /webp/i.test(item.mimeType)) {
        issues.push({ ...row, issue: `Google Business Buffer mimeType is WebP (${item.mimeType})` });
      } else if (isDisallowedGbpAssetUrl(item.imageUrl)) {
        issues.push({ ...row, issue: 'Google Business Buffer asset URL is disallowed (WebP or opengraph-image)' });
      } else {
        const gbpProbe = await probeGoogleBusinessImageUrl(item.imageUrl);
        row.gbpContentType = gbpProbe.contentType;
        row.gbpProbeOk = gbpProbe.ok;
        if (!gbpProbe.ok) {
          issues.push({ ...row, issue: gbpProbe.reason ?? 'Google Business image probe failed' });
        } else if (gbpProbe.contentType && !isGoogleBusinessImageContentType(gbpProbe.contentType)) {
          issues.push({
            ...row,
            issue: `Google Business requires JPEG/PNG (got ${gbpProbe.contentType})`,
          });
        }
      }

      if (feedPost && feedPost.googleBusinessImageUrl && item.imageUrl?.trim()) {
        const expected = feedPost.googleBusinessImageUrl.trim();
        if (item.imageUrl.trim() !== expected) {
          issues.push({
            ...row,
            issue: 'Google Business Buffer asset URL does not match expected resolved GBP URL',
            expectedGbpImageUrl: expected,
          });
        }
      }
    }

    if (!imageUrl?.trim()) {
      if (!isGoogleBusiness) {
        issues.push({ ...row, issue: 'No hydrated imageUrl for this article in feed loader' });
      }
      checked.push(row);
      continue;
    }

    if (!isRasterImagePath(imageUrl)) {
      issues.push({ ...row, issue: 'Image URL is not a raster path (e.g. SVG)' });
    }

    if (isFallbackImage(feedId, imageUrl)) {
      fallbacks.push({
        feedId,
        slug,
        imageUrl,
        note: 'Using feed default fallback (original RSS image failed validation)',
      });
    }

    const probe = await probeBufferImageUrl(imageUrl);
    row.contentType = probe.contentType;
    row.contentLength = probe.contentLength;
    row.mb =
      probe.contentLength != null
        ? Number((probe.contentLength / (1024 * 1024)).toFixed(2))
        : undefined;
    row.probeOk = probe.ok;

    if (!probe.ok) {
      issues.push({ ...row, issue: probe.reason ?? 'image probe failed' });
    } else if (probe.contentType && !isBufferCompatibleContentType(probe.contentType)) {
      issues.push({ ...row, issue: `unsupported content-type ${probe.contentType}` });
    } else if (probe.contentLength != null && probe.contentLength > BUFFER_MAX_IMAGE_BYTES) {
      issues.push({
        ...row,
        issue: `image too large (${row.mb}MB; Buffer limit 5MB)`,
      });
    }

    checked.push(row);
  }

  const summary = {
    ok: issues.length === 0,
    date: localDate,
    timezone,
    scheduledCount: scheduled.length,
    withBufferImage: scheduled.filter((p) => p.hasImage).length,
    withValidProbe: checked.filter((r) => r.probeOk === true || r.gbpProbeOk === true).length,
    googleBusinessPosts: scheduled.filter((p) => p.channelService === 'googlebusiness').length,
    usingFallbackImage: fallbacks.length,
    issueCount: issues.length,
    maxBytes: BUFFER_MAX_IMAGE_BYTES,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'],
  };

  console.log(
    JSON.stringify(
      {
        ...summary,
        fallbacks,
        issues,
        posts: checked,
      },
      null,
      2,
    ),
  );

  if (issues.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
