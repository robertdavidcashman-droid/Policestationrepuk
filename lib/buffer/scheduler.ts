import { createScheduledBufferPost } from './client';
import {
  getBufferApiKey,
  getBufferChannels,
  getSchedulerCooldownDays,
  getSchedulerDayPosts,
  getSchedulerDayWindow,
  getSchedulerEarlyMorningWindow,
  getSchedulerNightPosts,
  getSchedulerNightWindow,
  getSchedulerPostsPerFeed,
  getSchedulerTimezone,
} from './config';
import { getContentFeeds, loadAllFeedPosts } from './feeds';
import {
  appendRecentSlugs,
  buildSchedulablePostText,
  generateDayNightPostTimes,
  hashSeed,
  localDateInTimezone,
  mulberry32,
  pickRandomSchedulablePosts,
  slugsInCooldown,
  type RecentSlugEntry,
} from './scheduler-core';
import type { SchedulablePost } from './content-types';
import {
  getRecentSlugEntries,
  getSchedulerRunForDate,
  saveRecentSlugEntries,
  saveSchedulerRun,
  type SchedulerRunRecord,
} from './scheduler-storage';

export interface BufferSchedulerResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  date?: string;
  posts?: Array<{
    postId: string;
    slug: string;
    feedId: string;
    channelId: string;
    channelService: string;
    dueAt: string | null;
    title: string;
  }>;
}

export async function runBufferBlogScheduler(now = new Date()): Promise<BufferSchedulerResult> {
  const apiKey = getBufferApiKey();
  if (!apiKey) {
    return { ok: false, reason: 'BUFFER_API_KEY is not configured' };
  }

  const timezone = getSchedulerTimezone();
  const localDate = localDateInTimezone(now, timezone);
  const existingRun = await getSchedulerRunForDate(localDate);
  if (existingRun) {
    return {
      ok: true,
      skipped: true,
      reason: 'Already scheduled for this date',
      date: localDate,
      posts: existingRun.slugs.map((slug, i) => ({
        postId: existingRun.postIds[i] ?? '',
        slug,
        feedId: existingRun.feedIds?.[i] ?? 'policestationrepuk',
        channelId: existingRun.channels[i] ?? '',
        channelService: '',
        dueAt: existingRun.dueAts[i] ?? null,
        title: slug,
      })),
    };
  }

  const postsPerFeed = getSchedulerPostsPerFeed();
  const dayPosts = getSchedulerDayPosts();
  const nightPosts = getSchedulerNightPosts();
  if (dayPosts + nightPosts !== postsPerFeed) {
    return {
      ok: false,
      reason: `BUFFER_SCHEDULER_DAY_POSTS (${dayPosts}) + BUFFER_SCHEDULER_NIGHT_POSTS (${nightPosts}) must equal BUFFER_SCHEDULER_POSTS_PER_FEED (${postsPerFeed})`,
    };
  }

  const cooldownDays = getSchedulerCooldownDays();
  const channels = getBufferChannels();
  const feeds = getContentFeeds();

  const recentEntries = await getRecentSlugEntries();
  const excludeKeys = slugsInCooldown(recentEntries, cooldownDays, now);

  const feedPosts = await loadAllFeedPosts();
  const rng = mulberry32(hashSeed(`buffer-scheduler:${localDate}`));
  const channelOrder = shuffleChannelsRepeated(channels, feeds.length * postsPerFeed, rng);

  const toSchedule: Array<{ post: SchedulablePost; dueAt: string; channelIndex: number }> = [];
  let channelIndex = 0;

  for (const feed of feeds) {
    const pool = feedPosts.get(feed.id) ?? [];
    const feedRng = mulberry32(hashSeed(`buffer-scheduler:${localDate}:${feed.id}`));
    const picked = pickRandomSchedulablePosts(pool, postsPerFeed, excludeKeys, feedRng);
    const dueAts = generateDayNightPostTimes(
      localDate,
      {
        dayCount: dayPosts,
        nightCount: nightPosts,
        dayWindow: getSchedulerDayWindow(),
        nightWindow: getSchedulerNightWindow(),
        earlyMorningWindow: getSchedulerEarlyMorningWindow(),
      },
      feedRng,
      timezone,
    );

    for (let i = 0; i < picked.length; i++) {
      toSchedule.push({
        post: picked[i]!,
        dueAt: dueAts[i]!,
        channelIndex: channelIndex++,
      });
    }
  }

  const created: BufferSchedulerResult['posts'] = [];
  const newRecent: RecentSlugEntry[] = [];

  try {
    for (const item of toSchedule) {
      const channel = channelOrder[item.channelIndex % channelOrder.length]!;
      const text = buildSchedulablePostText(item.post);

      const post = await createScheduledBufferPost(apiKey, {
        channelId: channel.id,
        channelService: channel.service,
        text,
        dueAt: item.dueAt,
        url: item.post.url,
      });

      created.push({
        postId: post.id,
        slug: item.post.slug,
        feedId: item.post.feedId,
        channelId: channel.id,
        channelService: post.channelService,
        dueAt: post.dueAt,
        title: item.post.title,
      });

      newRecent.push({
        slug: item.post.slug,
        feedId: item.post.feedId,
        scheduledAt: now.toISOString(),
      });
    }
  } catch (err) {
    const partial = created.map((p) => ({
      slug: p.slug,
      feedId: p.feedId,
      channelService: p.channelService,
      dueAt: p.dueAt,
    }));
    const message = err instanceof Error ? err.message : 'Buffer scheduler failed';
    const wrapped = new Error(message) as Error & { partialPosts?: typeof partial };
    wrapped.partialPosts = partial;
    throw wrapped;
  }

  const record: SchedulerRunRecord = {
    date: localDate,
    scheduledAt: now.toISOString(),
    postIds: created.map((p) => p.postId),
    slugs: created.map((p) => p.slug),
    feedIds: created.map((p) => p.feedId),
    channels: created.map((p) => p.channelId),
    dueAts: created.map((p) => p.dueAt ?? ''),
  };

  await saveSchedulerRun(record);
  await saveRecentSlugEntries(appendRecentSlugs(recentEntries, newRecent, 500));

  return {
    ok: true,
    date: localDate,
    posts: created,
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
