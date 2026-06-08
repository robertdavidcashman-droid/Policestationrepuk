#!/usr/bin/env npx tsx
/**
 * Schedule posts for feeds under today's per-feed quota, after a given local hour.
 * Usage: npm run buffer:schedule-gaps -- --after-hour 22
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createScheduledBufferPost, listScheduledBufferPosts } from '../lib/buffer/client';
import {
  getBufferApiKey,
  getBufferChannels,
  getBufferOrganizationId,
  getSchedulerCooldownDays,
  getSchedulerTimezone,
  resolveFeedSchedule,
} from '../lib/buffer/config';
import { getContentFeeds, loadAllFeedPosts } from '../lib/buffer/feeds';
import {
  appendRecentSlugs,
  buildSchedulablePostTextForService,
  generateRandomPostTimes,
  hashSeed,
  localDateInTimezone,
  mulberry32,
  pickRandomSchedulablePosts,
  postCooldownKey,
  slugsInCooldown,
  timezoneOffsetForDate,
  type RecentSlugEntry,
} from '../lib/buffer/scheduler-core';
import {
  getRecentSlugEntries,
  getSchedulerRunForDate,
  saveRecentSlugEntries,
  saveSchedulerRun,
  type SchedulerRunRecord,
} from '../lib/buffer/scheduler-storage';
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

function shuffleChannelsRepeated<T>(items: T[], count: number, random: () => number): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]!];
  }
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    out.push(shuffled[i % shuffled.length]!);
  }
  return out;
}

function afterHourArg(): number {
  const idx = process.argv.indexOf('--after-hour');
  if (idx >= 0 && process.argv[idx + 1]) {
    const n = Number(process.argv[idx + 1]);
    if (Number.isFinite(n) && n >= 0 && n <= 23) return n;
  }
  return 22;
}

async function createWithAlternates(
  apiKey: string,
  pool: SchedulablePost[],
  post: SchedulablePost,
  usedKeys: Set<string>,
  channel: { id: string; service: 'twitter' | 'linkedin' | 'googlebusiness' },
  dueAt: string,
): Promise<{ post: SchedulablePost; created: Awaited<ReturnType<typeof createScheduledBufferPost>> } | null> {
  const candidates = [
    post,
    ...pool.filter(
      (candidate) =>
        candidate.slug !== post.slug &&
        !usedKeys.has(postCooldownKey(candidate.feedId, candidate.slug)),
    ),
  ];

  for (const current of candidates) {
    const text = buildSchedulablePostTextForService(current, channel.service);
    try {
      const created = await createScheduledBufferPost(apiKey, {
        channelId: channel.id,
        channelService: channel.service,
        text,
        dueAt,
        url: current.url,
        imageUrl: current.imageUrl,
        imageAlt: current.imageAlt,
      });
      return { post: current, created };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      const retryable =
        /posted that one recently/i.test(message) ||
        /file size limit|unsupported content-type|image exceeds|image validation failed|image too large|non-raster image path|requires a blog image url/i.test(
          message,
        );
      if (!retryable) throw err;
      usedKeys.add(postCooldownKey(current.feedId, current.slug));
    }
  }

  return null;
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env.vercel.production');

  const afterHour = afterHourArg();
  const apiKey = getBufferApiKey();
  if (!apiKey) {
    console.error('BUFFER_API_KEY is not set');
    process.exit(1);
  }

  const now = new Date();
  const timezone = getSchedulerTimezone();
  const localDate = localDateInTimezone(now, timezone);
  const offset = timezoneOffsetForDate(localDate, timezone);
  const start = `${localDate}T00:00:00${offset}`;
  const end = `${localDate}T23:59:59${offset}`;
  const organizationId = getBufferOrganizationId();
  const channels = getBufferChannels();
  const feeds = getContentFeeds();

  const scheduled = await listScheduledBufferPosts(apiKey, organizationId, {
    dueAtStart: start,
    dueAtEnd: end,
    channelIds: channels.map((c) => c.id),
  });

  const countsByFeed = new Map<string, number>();
  const scheduledKeys = new Set<string>();
  for (const item of scheduled) {
    const slug = slugFromPostText(item.text);
    const urlMatch = item.text.match(/https?:\/\/[^\s]+/);
    const feedId = urlMatch ? parseFeedFromUrl(urlMatch[0]) : 'unknown';
    if (feedId !== 'unknown') {
      countsByFeed.set(feedId, (countsByFeed.get(feedId) ?? 0) + 1);
      if (slug) scheduledKeys.add(postCooldownKey(feedId, slug));
    }
  }

  const gaps: Array<{ feedId: string; need: number; target: number }> = [];
  for (const feed of feeds) {
    const target = resolveFeedSchedule(feed).postsPerFeed;
    const have = countsByFeed.get(feed.id) ?? 0;
    if (have < target) {
      gaps.push({ feedId: feed.id, need: target - have, target });
    }
  }

  if (gaps.length === 0) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          skipped: true,
          date: localDate,
          message: 'All feeds already meet today’s per-feed quota.',
          feedCounts: Object.fromEntries(countsByFeed),
        },
        null,
        2,
      ),
    );
    return;
  }

  const totalNeed = gaps.reduce((sum, g) => sum + g.need, 0);
  const cooldownDays = getSchedulerCooldownDays();
  const recentEntries = await getRecentSlugEntries();
  const excludeKeys = slugsInCooldown(recentEntries, cooldownDays, now);
  for (const key of scheduledKeys) excludeKeys.add(key);

  const { posts: feedPosts, errors: feedErrors } = await loadAllFeedPosts();
  if (feedErrors.length > 0) {
    console.error('Feed load errors:', feedErrors);
    process.exit(1);
  }

  const window = {
    startHour: afterHour,
    endHour: 23,
    minGapMinutes: Math.max(15, Math.floor((60 * (23 - afterHour)) / Math.max(totalNeed, 1))),
  };

  const rng = mulberry32(hashSeed(`buffer-gaps:${localDate}:${afterHour}:${now.toISOString()}`));
  const channelOrder = shuffleChannelsRepeated(channels, totalNeed, rng);
  const dueTimes = generateRandomPostTimes(localDate, totalNeed, window, rng, timezone);

  const created: Array<{
    postId: string;
    slug: string;
    feedId: string;
    channelId: string;
    channelService: string;
    dueAt: string | null;
    title: string;
  }> = [];
  const newRecent: RecentSlugEntry[] = [];
  const usedKeys = new Set(excludeKeys);
  let timeIndex = 0;
  let channelIndex = 0;

  for (const gap of gaps) {
    const pool = feedPosts.get(gap.feedId) ?? [];
    const feedRng = mulberry32(hashSeed(`buffer-gaps:${localDate}:${gap.feedId}`));
    const picked = pickRandomSchedulablePosts(pool, gap.need, usedKeys, feedRng);

    if (picked.length < gap.need) {
      console.warn(
        `[buffer:gaps] Feed "${gap.feedId}" needs ${gap.need} but only ${picked.length} eligible post(s) available.`,
      );
    }

    for (const post of picked) {
      const channel = channelOrder[channelIndex++]!;
      const dueAt = dueTimes[timeIndex++]!;
      const result = await createWithAlternates(
        apiKey,
        pool,
        post,
        usedKeys,
        channel,
        dueAt,
      );

      if (!result) {
        console.warn(
          `[buffer:gaps] Skipped ${gap.feedId}/${post.slug} — no Buffer-compatible alternate (${channel.service}).`,
        );
        continue;
      }

      const { post: scheduledPost, created: createdPost } = result;

      usedKeys.add(postCooldownKey(scheduledPost.feedId, scheduledPost.slug));
      created.push({
        postId: createdPost.id,
        slug: scheduledPost.slug,
        feedId: scheduledPost.feedId,
        channelId: channel.id,
        channelService: createdPost.channelService,
        dueAt: createdPost.dueAt,
        title: scheduledPost.title,
      });
      newRecent.push({
        slug: scheduledPost.slug,
        feedId: scheduledPost.feedId,
        scheduledAt: now.toISOString(),
      });

      await new Promise((r) => setTimeout(r, 800));
    }
  }

  if (created.length === 0) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          date: localDate,
          afterHour,
          gaps,
          message: 'No gap posts could be scheduled (Buffer duplicate or empty pool).',
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  const existingRun = await getSchedulerRunForDate(localDate);
  const mergedFromBuffer: SchedulerRunRecord = {
    date: localDate,
    scheduledAt: now.toISOString(),
    postIds: scheduled.map((p) => p.id),
    slugs: scheduled.map((p) => slugFromPostText(p.text) ?? ''),
    feedIds: scheduled.map((p) => {
      const urlMatch = p.text.match(/https?:\/\/[^\s]+/);
      return urlMatch ? parseFeedFromUrl(urlMatch[0]) : 'unknown';
    }),
    channels: scheduled.map((p) => p.channelId),
    dueAts: scheduled.map((p) => p.dueAt ?? ''),
  };

  const base = existingRun ?? mergedFromBuffer;
  const merged: SchedulerRunRecord = {
    date: localDate,
    scheduledAt: now.toISOString(),
    postIds: [...base.postIds, ...created.map((p) => p.postId)],
    slugs: [...base.slugs, ...created.map((p) => p.slug)],
    feedIds: [...(base.feedIds ?? []), ...created.map((p) => p.feedId)],
    channels: [...base.channels, ...created.map((p) => p.channelId)],
    dueAts: [...base.dueAts, ...created.map((p) => p.dueAt ?? '')],
  };

  await saveSchedulerRun(merged);
  await saveRecentSlugEntries(appendRecentSlugs(recentEntries, newRecent, 500));

  const feedCounts: Record<string, number> = {};
  for (const feedId of merged.feedIds ?? []) {
    feedCounts[feedId] = (feedCounts[feedId] ?? 0) + 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        date: localDate,
        afterHour,
        gaps,
        newPosts: created.length,
        feedCounts,
        posts: created,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
