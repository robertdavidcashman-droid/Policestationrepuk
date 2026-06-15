import { listScheduledBufferPosts } from './client';
import {
  getBufferApiKey,
  getBufferChannels,
  getBufferOrganizationId,
  getSchedulerTimezone,
} from './config';
import { FEED_DEFAULT_IMAGES, loadAllFeedPosts } from './feeds';
import { containsGoogleBusinessPhoneNumber } from './google-business-text';
import { isDisallowedGbpAssetUrl } from './gbp-preflight';
import {
  BUFFER_MAX_IMAGE_BYTES,
  isBufferCompatibleContentType,
  isGoogleBusinessImageContentType,
  isRasterImagePath,
  probeBufferImageUrl,
  probeGoogleBusinessImageUrl,
} from './image-url';
import { localDateInTimezone, timezoneOffsetForDate } from './scheduler-core';
import type { SchedulablePost } from './content-types';

export interface VerifyScheduledImagesOptions {
  /** When true, only validate Google Business posts; non-GBP issues become warnings. */
  googleBusinessOnly?: boolean;
}

export interface VerifyScheduledImagesResult {
  ok: boolean;
  date: string;
  timezone: string;
  mode: 'all' | 'google-business';
  scheduledCount: number;
  googleBusinessPosts: number;
  issueCount: number;
  warningCount: number;
  issues: Array<Record<string, unknown>>;
  warnings: Array<Record<string, unknown>>;
  fallbacks: Array<Record<string, unknown>>;
  posts: Array<Record<string, unknown>>;
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

export async function verifyScheduledBufferImages(
  options: VerifyScheduledImagesOptions = {},
): Promise<VerifyScheduledImagesResult> {
  const googleBusinessOnly =
    options.googleBusinessOnly ?? process.env.BUFFER_VERIFY_GBP_ONLY === '1';

  const apiKey = getBufferApiKey();
  if (!apiKey) {
    throw new Error('BUFFER_API_KEY is not set');
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

  const channels = getBufferChannels();
  const gbpChannel = channels.find((c) => c.service === 'googlebusiness');
  const channelIds = googleBusinessOnly
    ? gbpChannel
      ? [gbpChannel.id]
      : []
    : channels.map((c) => c.id);

  const scheduled = await listScheduledBufferPosts(apiKey, getBufferOrganizationId(), {
    dueAtStart: start,
    dueAtEnd: end,
    channelIds,
  });

  const issues: Array<Record<string, unknown>> = [];
  const warnings: Array<Record<string, unknown>> = [];
  const fallbacks: Array<Record<string, unknown>> = [];
  const checked: Array<Record<string, unknown>> = [];

  const pushIssue = (row: Record<string, unknown>, issue: string, fatal: boolean) => {
    const entry = { ...row, issue };
    if (fatal) issues.push(entry);
    else warnings.push(entry);
  };

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
      pushIssue(
        row,
        'Buffer post has no image asset attached',
        isGoogleBusiness || !googleBusinessOnly,
      );
    }

    if (isGoogleBusiness) {
      if (containsGoogleBusinessPhoneNumber(item.text)) {
        pushIssue(row, 'Google Business post text contains a phone number (use CTA link only)', true);
      }

      if (!item.imageUrl?.trim()) {
        pushIssue(row, 'Google Business post missing Buffer asset image URL', true);
      } else if (/\.webp(\?|$)/i.test(item.imageUrl)) {
        pushIssue(row, 'Google Business Buffer asset URL is WebP (requires JPEG/PNG)', true);
      } else if (item.mimeType && /webp/i.test(item.mimeType)) {
        pushIssue(row, `Google Business Buffer mimeType is WebP (${item.mimeType})`, true);
      } else if (isDisallowedGbpAssetUrl(item.imageUrl)) {
        pushIssue(
          row,
          'Google Business Buffer asset URL is disallowed (WebP or opengraph-image)',
          true,
        );
      } else {
        const gbpProbe = await probeGoogleBusinessImageUrl(item.imageUrl);
        row.gbpContentType = gbpProbe.contentType;
        row.gbpProbeOk = gbpProbe.ok;
        if (!gbpProbe.ok) {
          pushIssue(row, gbpProbe.reason ?? 'Google Business image probe failed', true);
        } else if (gbpProbe.contentType && !isGoogleBusinessImageContentType(gbpProbe.contentType)) {
          pushIssue(
            row,
            `Google Business requires JPEG/PNG (got ${gbpProbe.contentType})`,
            true,
          );
        }
      }

      if (feedPost && feedPost.googleBusinessImageUrl && item.imageUrl?.trim()) {
        const expected = feedPost.googleBusinessImageUrl.trim();
        if (item.imageUrl.trim() !== expected) {
          pushIssue(
            {
              ...row,
              expectedGbpImageUrl: expected,
            },
            'Google Business Buffer asset URL does not match expected resolved GBP URL',
            true,
          );
        }
      }
    }

    if (googleBusinessOnly) {
      checked.push(row);
      continue;
    }

    if (!imageUrl?.trim()) {
      if (!isGoogleBusiness) {
        pushIssue(row, 'No hydrated imageUrl for this article in feed loader', false);
      }
      checked.push(row);
      continue;
    }

    if (!isRasterImagePath(imageUrl)) {
      pushIssue(row, 'Image URL is not a raster path (e.g. SVG)', false);
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
      pushIssue(row, probe.reason ?? 'image probe failed', false);
    } else if (probe.contentType && !isBufferCompatibleContentType(probe.contentType)) {
      pushIssue(row, `unsupported content-type ${probe.contentType}`, false);
    } else if (probe.contentLength != null && probe.contentLength > BUFFER_MAX_IMAGE_BYTES) {
      pushIssue(row, `image too large (${row.mb}MB; Buffer limit 5MB)`, false);
    }

    checked.push(row);
  }

  const fatalIssues = googleBusinessOnly
    ? issues
    : [...issues, ...warnings.filter((w) => w.channel === 'googlebusiness')];

  return {
    ok: fatalIssues.length === 0,
    date: localDate,
    timezone,
    mode: googleBusinessOnly ? 'google-business' : 'all',
    scheduledCount: scheduled.length,
    googleBusinessPosts: scheduled.filter((p) => p.channelService === 'googlebusiness').length,
    issueCount: issues.length,
    warningCount: warnings.length,
    issues,
    warnings,
    fallbacks,
    posts: checked,
  };
}
