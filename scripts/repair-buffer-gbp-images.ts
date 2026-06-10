#!/usr/bin/env npx tsx
/**
 * Repair scheduled Google Business posts with invalid image assets.
 * Usage: npm run buffer:repair-gbp [--days N]
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createScheduledBufferPost,
  deleteBufferPost,
  listScheduledBufferPosts,
} from '../lib/buffer/client';
import {
  getBufferApiKey,
  getBufferChannels,
  getBufferOrganizationId,
  getSchedulerTimezone,
} from '../lib/buffer/config';
import { loadAllFeedPosts } from '../lib/buffer/feeds';
import { isDisallowedGbpAssetUrl } from '../lib/buffer/gbp-preflight';
import { probeGoogleBusinessImageUrl } from '../lib/buffer/image-url';
import {
  buildSchedulablePostTextForService,
  localDateInTimezone,
  timezoneOffsetForDate,
} from '../lib/buffer/scheduler-core';

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

function sleep(ms: number): Promise<void> {
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
      console.warn(`[buffer:repair-gbp] Rate limited on ${label}, retry ${attempt + 1}/7…`);
    }
  }
  throw lastError;
}

async function needsRepair(item: {
  channelService: string;
  imageUrl?: string;
  mimeType?: string | null;
}): Promise<{ bad: boolean; reason?: string }> {
  if (item.channelService !== 'googlebusiness') return { bad: false };
  if (!item.imageUrl?.trim()) return { bad: true, reason: 'missing asset URL' };
  if (/\.webp(\?|$)/i.test(item.imageUrl)) return { bad: true, reason: 'WebP asset URL' };
  if (item.mimeType && /webp/i.test(item.mimeType)) return { bad: true, reason: `WebP mimeType (${item.mimeType})` };
  if (isDisallowedGbpAssetUrl(item.imageUrl)) return { bad: true, reason: 'disallowed asset URL' };
  const probe = await probeGoogleBusinessImageUrl(item.imageUrl);
  if (!probe.ok) return { bad: true, reason: probe.reason ?? 'probe failed' };
  return { bad: false };
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env.vercel.production');

  const apiKey = getBufferApiKey();
  if (!apiKey) {
    console.error('BUFFER_API_KEY is not set');
    process.exit(1);
  }

  const daysArg = process.argv.find((a) => a.startsWith('--days='));
  const days = daysArg ? Math.max(1, parseInt(daysArg.split('=')[1] ?? '1', 10)) : 1;
  const timezone = getSchedulerTimezone();
  const gbpChannel = getBufferChannels().find((c) => c.service === 'googlebusiness');
  if (!gbpChannel) {
    console.error('No googlebusiness channel configured');
    process.exit(1);
  }

  const { posts: feedPosts } = await loadAllFeedPosts();
  const orgId = getBufferOrganizationId();
  const repaired: Array<Record<string, unknown>> = [];
  const skipped: Array<Record<string, unknown>> = [];

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
          channelIds: [gbpChannel.id],
        }),
      'listScheduledBufferPosts',
    );

    for (const item of scheduled) {
      const check = await needsRepair(item);
      if (!check.bad) {
        skipped.push({ postId: item.id, dueAt: item.dueAt, reason: 'ok' });
        continue;
      }

      const slug = slugFromPostText(item.text);
      const urlMatch = item.text.match(/https?:\/\/[^\s]+/);
      const articleUrl = urlMatch?.[0] ?? '';
      const feedId = articleUrl ? parseFeedFromUrl(articleUrl) : 'unknown';
      const feedPost =
        slug && feedId !== 'unknown'
          ? (feedPosts.get(feedId) ?? []).find((p) => p.slug === slug)
          : undefined;

      if (!feedPost?.googleBusinessImageUrl || !item.dueAt) {
        console.warn(`[buffer:repair-gbp] Cannot repair ${item.id}: missing feed post or dueAt`);
        continue;
      }

      await withRateLimitRetry(() => deleteBufferPost(apiKey, item.id), `deletePost ${item.id}`);

      const created = await withRateLimitRetry(
        () =>
          createScheduledBufferPost(apiKey, {
            channelId: gbpChannel.id,
            channelService: 'googlebusiness',
            text: item.text,
            dueAt: item.dueAt!,
            url: articleUrl,
            imageUrl: feedPost.googleBusinessImageUrl,
            imageAlt: feedPost.imageAlt,
            feedId: feedPost.feedId,
          }),
        `createPost ${item.id}`,
      );

      repaired.push({
        oldPostId: item.id,
        newPostId: created.id,
        feedId,
        slug,
        oldAssetUrl: item.imageUrl,
        newAssetUrl: created.imageUrl,
        dueAt: item.dueAt,
        repairReason: check.reason,
      });
    }
  }

  console.log(JSON.stringify({ ok: true, repaired: repaired.length, skipped: skipped.length, repaired, skipped }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
