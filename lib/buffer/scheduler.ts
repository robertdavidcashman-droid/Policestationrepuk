import { createScheduledBufferPost } from './client';
import {
  getBufferApiKey,
  getBufferChannels,
  getSchedulerCooldownDays,
  getSchedulerDayWindow,
  getSchedulerEarlyMorningWindow,
  getSchedulerNightWindow,
  getSchedulerTimezone,
  resolveFeedSchedule,
} from './config';
import { getContentFeeds, loadAllFeedPosts } from './feeds';
import {
  appendRecentSlugs,
  buildSchedulablePostTextForService,
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
    imageUrl?: string;
  }>;
}

function formatFeedLoadErrors(
  errors: Array<{ feedId: string; url?: string; message: string }>,
): string {
  return errors.map((e) => `${e.feedId}${e.url ? ` (${e.url})` : ''}: ${e.message}`).join('; ');
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

  const cooldownDays = getSchedulerCooldownDays();
  const channels = getBufferChannels();
  const feeds = getContentFeeds();
  console.info(`[buffer:scheduler] Active feeds: ${feeds.map((f) => f.id).join(', ')}`);
  const feedSchedules = feeds.map((feed) => ({ feed, schedule: resolveFeedSchedule(feed) }));

  for (const { feed, schedule } of feedSchedules) {
    if (schedule.dayPosts + schedule.nightPosts !== schedule.postsPerFeed) {
      return {
        ok: false,
        reason: `Feed "${feed.id}": dayPosts (${schedule.dayPosts}) + nightPosts (${schedule.nightPosts}) must equal postsPerDay (${schedule.postsPerFeed})`,
      };
    }
  }

  const totalPosts = feedSchedules.reduce((sum, { schedule }) => sum + schedule.postsPerFeed, 0);

  const recentEntries = await getRecentSlugEntries();
  const excludeKeys = slugsInCooldown(recentEntries, cooldownDays, now);

  const { posts: feedPosts, errors: feedErrors } = await loadAllFeedPosts();
  if (feedErrors.length > 0) {
    return {
      ok: false,
      reason: `Feed load failed: ${formatFeedLoadErrors(feedErrors)}`,
      date: localDate,
    };
  }

  const rng = mulberry32(hashSeed(`buffer-scheduler:${localDate}`));
  const channelOrder = shuffleChannelsRepeated(channels, totalPosts, rng);

  const toSchedule: Array<{ post: SchedulablePost; dueAt: string; channelIndex: number }> = [];
  let channelIndex = 0;
  const pickedByFeed = new Map<string, SchedulablePost[]>();

  for (const { feed, schedule } of feedSchedules) {
    const pool = feedPosts.get(feed.id) ?? [];
    const feedRng = mulberry32(hashSeed(`buffer-scheduler:${localDate}:${feed.id}`));
    const picked = pickRandomSchedulablePosts(pool, schedule.postsPerFeed, excludeKeys, feedRng);
    pickedByFeed.set(feed.id, picked);

    if (picked.length === 0) {
      return {
        ok: false,
        reason: `Feed "${feed.id}" has no posts available after cooldown exclusions`,
        date: localDate,
      };
    }

    if (picked.length < schedule.postsPerFeed) {
      console.warn(
        `[buffer:scheduler] Feed "${feed.id}" picked ${picked.length}/${schedule.postsPerFeed} posts (pool size ${pool.length})`,
      );
    }

    const dueAts = generateDayNightPostTimes(
      localDate,
      {
        dayCount: schedule.dayPosts,
        nightCount: schedule.nightPosts,
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

  for (const { feed, schedule } of feedSchedules) {
    const picked = pickedByFeed.get(feed.id) ?? [];
    if (picked.length === 0) {
      return {
        ok: false,
        reason: `Feed "${feed.id}" contributed zero posts — aborting before createPost`,
        date: localDate,
      };
    }
    if (picked.length < schedule.postsPerFeed && poolTooSmall(feedPosts.get(feed.id) ?? [], schedule.postsPerFeed)) {
      console.warn(
        `[buffer:scheduler] Feed "${feed.id}" under quota due to small pool (${picked.length}/${schedule.postsPerFeed})`,
      );
    }
  }

  const created: BufferSchedulerResult['posts'] = [];
  const newRecent: RecentSlugEntry[] = [];

  try {
    for (const item of toSchedule) {
      const channel = channelOrder[item.channelIndex % channelOrder.length]!;
      const text = buildSchedulablePostTextForService(item.post, channel.service);

      const post = await createScheduledBufferPost(apiKey, {
        channelId: channel.id,
        channelService: channel.service,
        text,
        dueAt: item.dueAt,
        url: item.post.url,
        imageUrl: item.post.imageUrl,
        imageAlt: item.post.imageAlt,
      });

      created.push({
        postId: post.id,
        slug: item.post.slug,
        feedId: item.post.feedId,
        channelId: channel.id,
        channelService: post.channelService,
        dueAt: post.dueAt,
        title: item.post.title,
        imageUrl: item.post.imageUrl,
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

function poolTooSmall(pool: SchedulablePost[], required: number): boolean {
  return pool.length < required;
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
