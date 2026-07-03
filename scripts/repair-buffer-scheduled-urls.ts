#!/usr/bin/env npx tsx
/**
 * Repair scheduled Buffer posts with invalid article or image URLs.
 * Rebuilds from the feed catalog (correct link + validated image).
 *
 * Usage:
 *   npx tsx scripts/repair-buffer-scheduled-urls.ts
 *   npx tsx scripts/repair-buffer-scheduled-urls.ts --days=7 --apply
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createScheduledBufferPost,
  deleteBufferPost,
  listScheduledBufferPosts,
} from '../lib/buffer/client';
import {
  extractArticleUrlFromText,
  parseFeedFromArticleUrl,
  slugFromPostText,
} from '../lib/buffer/article-url';
import {
  getBufferApiKey,
  getBufferChannels,
  getBufferOrganizationId,
  getSchedulerTimezone,
  type BufferChannelService,
} from '../lib/buffer/config';
import { loadAllFeedPosts } from '../lib/buffer/feeds';
import { isDisallowedGbpAssetUrl } from '../lib/buffer/gbp-preflight';
import { probeBufferImageUrl, probeGoogleBusinessImageUrl } from '../lib/buffer/image-url';
import {
  buildSchedulablePostTextForService,
  localDateInTimezone,
  timezoneOffsetForDate,
} from '../lib/buffer/scheduler-core';
import { stripTrailingUrlPunctuation } from '../lib/buffer/article-url';
import type { BufferScheduledPostSummary } from '../lib/buffer/client';
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRateLimitRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      if (attempt > 0) await sleep(5000 * attempt);
      return await fn();
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : '';
      if (!/too many requests/i.test(message) || attempt >= 7) throw err;
      console.warn(`[buffer:repair-urls] Rate limited on ${label}, retry ${attempt + 1}/7…`);
    }
  }
  throw lastError;
}

async function probeArticleUrl(url: string): Promise<boolean> {
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(12_000),
    });
    if (res.ok || res.status === 405) return true;
    const getRes = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(12_000),
      headers: { Range: 'bytes=0-0' },
    });
    return getRes.ok;
  } catch {
    return false;
  }
}

function canonicalArticlePath(url: string): string {
  try {
    const u = new URL(stripTrailingUrlPunctuation(url));
    return `${u.origin}${u.pathname}`.toLowerCase();
  } catch {
    return '';
  }
}

async function needsRepair(
  item: {
    channelService: string;
    text: string;
    imageUrl?: string;
    mimeType?: string | null;
  },
  feedPost: { url: string; imageUrl?: string; googleBusinessImageUrl?: string } | undefined,
): Promise<{ bad: boolean; reason?: string }> {
  const extracted = extractArticleUrlFromText(item.text);
  const service = item.channelService as BufferChannelService;

  if (!feedPost) {
    return { bad: true, reason: 'unknown_feed_or_slug' };
  }

  if (!extracted) {
    return { bad: true, reason: 'missing_article_url_in_text' };
  }

  if (!(await probeArticleUrl(extracted))) {
    return { bad: true, reason: 'article_url_unreachable' };
  }

  if (canonicalArticlePath(extracted) !== canonicalArticlePath(feedPost.url)) {
    return { bad: true, reason: 'text_url_mismatch' };
  }

  const expectedImage =
    service === 'googlebusiness' ? feedPost.googleBusinessImageUrl : feedPost.imageUrl;

  if (!expectedImage) {
    return { bad: true, reason: 'missing_feed_image' };
  }

  if (service === 'googlebusiness') {
    if (!item.imageUrl?.trim()) return { bad: true, reason: 'missing_gbp_asset' };
    if (/\.webp(\?|$)/i.test(item.imageUrl)) return { bad: true, reason: 'gbp_webp_asset' };
    if (item.mimeType && /webp/i.test(item.mimeType)) {
      return { bad: true, reason: `gbp_webp_mime (${item.mimeType})` };
    }
    if (isDisallowedGbpAssetUrl(item.imageUrl)) {
      return { bad: true, reason: 'disallowed_gbp_asset' };
    }
    if (item.imageUrl !== expectedImage) {
      return { bad: true, reason: 'gbp_image_mismatch' };
    }
    const probe = await probeGoogleBusinessImageUrl(item.imageUrl);
    if (!probe.ok) return { bad: true, reason: probe.reason ?? 'gbp_image_probe_failed' };
    return { bad: false };
  }

  if (!item.imageUrl?.trim()) return { bad: true, reason: 'missing_image_asset' };
  if (item.imageUrl !== expectedImage) {
    const probe = await probeBufferImageUrl(item.imageUrl);
    if (!probe.ok) return { bad: true, reason: probe.reason ?? 'image_probe_failed' };
  }

  return { bad: false };
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env.vercel.production');

  const apply = process.argv.includes('--apply');
  const daysArg = process.argv.find((a) => a.startsWith('--days='));
  const days = daysArg ? Math.max(1, parseInt(daysArg.split('=')[1] ?? '7', 10)) : 7;

  const apiKey = getBufferApiKey();
  if (!apiKey) {
    console.error('BUFFER_API_KEY is not set');
    process.exit(1);
  }

  const timezone = getSchedulerTimezone();
  const orgId = getBufferOrganizationId();
  const channels = getBufferChannels();
  const channelById = new Map(channels.map((c) => [c.id, c]));
  const { posts: feedPosts } = await loadAllFeedPosts();

  const candidates: Array<{
    row: Record<string, unknown>;
    item: BufferScheduledPostSummary;
    feedPost: SchedulablePost;
  }> = [];
  const ok: Array<Record<string, unknown>> = [];

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const base = new Date();
    base.setDate(base.getDate() + dayOffset);
    const localDate = localDateInTimezone(base, timezone);
    const offset = timezoneOffsetForDate(localDate, timezone);
    const start = `${localDate}T00:00:00${offset}`;
    const end = `${localDate}T23:59:59${offset}`;

    const scheduled = await withRateLimitRetry(
      () =>
        listScheduledBufferPosts(apiKey, orgId, {
          dueAtStart: start,
          dueAtEnd: end,
          channelIds: channels.map((c) => c.id),
        }),
      `listScheduled ${localDate}`,
    );

    for (const item of scheduled) {
      const slug = slugFromPostText(item.text);
      const extracted = extractArticleUrlFromText(item.text);
      const feedId = extracted ? parseFeedFromArticleUrl(extracted) : 'unknown';
      const feedPost =
        slug && feedId !== 'unknown'
          ? (feedPosts.get(feedId) ?? []).find((p) => p.slug === slug)
          : undefined;

      const check = await needsRepair(item, feedPost);
      const row = {
        postId: item.id,
        dueAt: item.dueAt,
        channel: item.channelService,
        feedId,
        slug: slug ?? '(unknown)',
        extractedUrl: extracted,
        feedUrl: feedPost?.url,
        imageUrl: item.imageUrl,
        reason: check.reason,
      };

      if (check.bad) {
        if (feedPost) candidates.push({ row, item, feedPost });
        else row.repairBlocked = 'no_feed_post';
      }
      else ok.push({ postId: item.id, dueAt: item.dueAt });
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: candidates.length === 0,
        apply,
        days,
        candidateCount: candidates.length,
        okCount: ok.length,
        candidates: candidates.map((c) => c.row),
      },
      null,
      2,
    ),
  );

  if (!apply || candidates.length === 0) {
    process.exit(candidates.length === 0 ? 0 : 1);
  }

  const repaired: Array<Record<string, unknown>> = [];

  for (const { row, item, feedPost } of candidates) {
    const postId = String(row.postId);
    if (!item.dueAt) continue;

    const channel = channelById.get(item.channelId);
    if (!channel) continue;

    const service = channel.service as BufferChannelService;
    const imageUrl =
      service === 'googlebusiness' ? feedPost.googleBusinessImageUrl : feedPost.imageUrl;
    if (!imageUrl) continue;

    const text = buildSchedulablePostTextForService(feedPost, service);

    await withRateLimitRetry(() => deleteBufferPost(apiKey, postId), `delete ${postId}`);
    await sleep(800);

    const created = await withRateLimitRetry(
      () =>
        createScheduledBufferPost(apiKey, {
          channelId: channel.id,
          channelService: service,
          text,
          dueAt: item.dueAt!,
          url: feedPost.url,
          imageUrl,
          imageAlt: feedPost.imageAlt,
          feedId: feedPost.feedId,
        }),
      `create ${postId}`,
    );

    repaired.push({
      oldPostId: postId,
      newPostId: created.id,
      feedId: feedPost.feedId,
      slug: feedPost.slug,
      channel: service,
      reason: row.reason,
      url: feedPost.url,
      imageUrl: created.imageUrl ?? imageUrl,
    });

    await sleep(1500);
  }

  console.log(JSON.stringify({ repairedCount: repaired.length, repaired }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
