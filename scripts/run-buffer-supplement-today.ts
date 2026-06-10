#!/usr/bin/env npx tsx
/**
 * Schedule posts today for feeds not yet covered in today's KV run.
 * Usage: npm run buffer:supplement-today
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createScheduledBufferPost } from '../lib/buffer/client';
import { assertGoogleBusinessScheduleReady } from '../lib/buffer/gbp-preflight';
import {
  getBufferApiKey,
  getBufferChannels,
  getSchedulerCooldownDays,
  getSchedulerDayWindow,
  getSchedulerNightWindow,
  getSchedulerTimezone,
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
  slugsInCooldown,
  type RecentSlugEntry,
} from '../lib/buffer/scheduler-core';
import {
  getRecentSlugEntries,
  getSchedulerRunForDate,
  saveRecentSlugEntries,
  saveSchedulerRun,
  type SchedulerRunRecord,
} from '../lib/buffer/scheduler-storage';

const POSTS_PER_FEED = 3;
const DAY_POSTS = 2;
const NIGHT_POSTS = 1;

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

function londonHourMinute(now: Date, timezone: string): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  return {
    hour: Number(parts.find((p) => p.type === 'hour')?.value ?? '0'),
    minute: Number(parts.find((p) => p.type === 'minute')?.value ?? '0'),
  };
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

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env.vercel.production');

  const apiKey = getBufferApiKey();
  if (!apiKey) {
    console.error('BUFFER_API_KEY is not set');
    process.exit(1);
  }

  const now = new Date();
  const timezone = getSchedulerTimezone();
  const localDate = localDateInTimezone(now, timezone);
  const existingRun = await getSchedulerRunForDate(localDate);

  const countsByFeed = new Map<string, number>();
  if (existingRun) {
    existingRun.slugs.forEach((slug, i) => {
      const feedId = existingRun.feedIds?.[i] ?? 'policestationrepuk';
      countsByFeed.set(feedId, (countsByFeed.get(feedId) ?? 0) + 1);
    });
  }

  const feeds = getContentFeeds();
  const missingFeeds = feeds.filter((feed) => (countsByFeed.get(feed.id) ?? 0) < POSTS_PER_FEED);

  if (missingFeeds.length === 0) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          skipped: true,
          date: localDate,
          message: `All feeds already have at least ${POSTS_PER_FEED} posts scheduled for today.`,
          feedCounts: Object.fromEntries(countsByFeed),
        },
        null,
        2,
      ),
    );
    return;
  }

  const { hour, minute } = londonHourMinute(now, timezone);
  const nowSlotHour = minute > 0 ? hour + 1 : hour;
  const dayWindow = getSchedulerDayWindow();
  const nightWindow = getSchedulerNightWindow();

  const adjustedDayWindow = {
    startHour: Math.min(Math.max(dayWindow.startHour, nowSlotHour), dayWindow.endHour),
    endHour: dayWindow.endHour,
    minGapMinutes: Math.min(dayWindow.minGapMinutes, 45),
  };

  const cooldownDays = getSchedulerCooldownDays();
  const channels = getBufferChannels();
  const recentEntries = await getRecentSlugEntries();
  const excludeKeys = slugsInCooldown(recentEntries, cooldownDays, now);
  const feedPosts = await loadAllFeedPosts();
  const postsMap = feedPosts.posts;
  if (feedPosts.errors.length > 0) {
    console.error('Feed load errors:', feedPosts.errors);
    process.exit(1);
  }

  const totalNew = missingFeeds.length * POSTS_PER_FEED;
  const rng = mulberry32(hashSeed(`buffer-supplement:${localDate}:${now.toISOString()}`));
  const channelOrder = shuffleChannelsRepeated(channels, totalNew, rng);

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
  let channelIndex = 0;

  for (const feed of missingFeeds) {
    const need = POSTS_PER_FEED - (countsByFeed.get(feed.id) ?? 0);
    if (need <= 0) continue;

    const pool = postsMap.get(feed.id) ?? [];
    const feedRng = mulberry32(hashSeed(`buffer-supplement:${localDate}:${feed.id}`));
    const picked = pickRandomSchedulablePosts(pool, need, excludeKeys, feedRng);

    const dayCount = Math.min(DAY_POSTS, need);
    const nightCount = need - dayCount;

    const dayTimes =
      dayCount > 0 && adjustedDayWindow.startHour < adjustedDayWindow.endHour
        ? generateRandomPostTimes(localDate, dayCount, adjustedDayWindow, feedRng, timezone)
        : [];

    const nightTimes =
      nightCount > 0
        ? generateRandomPostTimes(localDate, nightCount, nightWindow, feedRng, timezone)
        : [];

    const dueAts = [...dayTimes, ...nightTimes].sort();

    for (let i = 0; i < picked.length; i++) {
      const channel = channelOrder[channelIndex++]!;
      const post = picked[i]!;
      const text = buildSchedulablePostTextForService(post, channel.service);
      const dueAt = dueAts[i]!;

      if (channel.service === 'googlebusiness') {
        const gbpIssues = await assertGoogleBusinessScheduleReady([post]);
        if (gbpIssues.length > 0) {
          console.error('[buffer:supplement-today] GBP preflight failed:', gbpIssues);
          throw new Error('GBP preflight failed');
        }
      }

      const imageUrlForChannel =
        channel.service === 'googlebusiness'
          ? (post.googleBusinessImageUrl ?? post.imageUrl)
          : post.imageUrl;

      const createdPost = await createScheduledBufferPost(apiKey, {
        channelId: channel.id,
        channelService: channel.service,
        text,
        dueAt,
        url: post.url,
        imageUrl: imageUrlForChannel,
        imageAlt: post.imageAlt,
        feedId: post.feedId,
      });

      created.push({
        postId: createdPost.id,
        slug: post.slug,
        feedId: post.feedId,
        channelId: channel.id,
        channelService: createdPost.channelService,
        dueAt: createdPost.dueAt,
        title: post.title,
      });

      newRecent.push({
        slug: post.slug,
        feedId: post.feedId,
        scheduledAt: now.toISOString(),
      });

      excludeKeys.add(`${post.feedId}:${post.slug}`);
    }
  }

  const existingFeedIds = existingRun
    ? existingRun.slugs.map((_, i) => existingRun.feedIds?.[i] ?? 'policestationrepuk')
    : [];

  const merged: SchedulerRunRecord = existingRun
    ? {
        date: localDate,
        scheduledAt: now.toISOString(),
        postIds: [...existingRun.postIds, ...created.map((p) => p.postId)],
        slugs: [...existingRun.slugs, ...created.map((p) => p.slug)],
        feedIds: [...existingFeedIds, ...created.map((p) => p.feedId)],
        channels: [...existingRun.channels, ...created.map((p) => p.channelId)],
        dueAts: [...existingRun.dueAts, ...created.map((p) => p.dueAt ?? '')],
      }
    : {
        date: localDate,
        scheduledAt: now.toISOString(),
        postIds: created.map((p) => p.postId),
        slugs: created.map((p) => p.slug),
        feedIds: created.map((p) => p.feedId),
        channels: created.map((p) => p.channelId),
        dueAts: created.map((p) => p.dueAt ?? ''),
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
        supplementedFeeds: missingFeeds.map((f) => f.id),
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
