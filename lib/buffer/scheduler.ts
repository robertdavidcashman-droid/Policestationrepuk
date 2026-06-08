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
  postCooldownKey,
  slugsInCooldown,
  ensurePostTimeCount,
  addDaysToLocalDate,
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

export async function runBufferBlogScheduler(
  now = new Date(),
  options?: { respectCurrentTime?: boolean; extraExcludeKeys?: Set<string> },
): Promise<BufferSchedulerResult> {
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
  if (options?.extraExcludeKeys) {
    for (const key of options.extraExcludeKeys) {
      excludeKeys.add(key);
    }
  }

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

  let dayWindow = getSchedulerDayWindow();
  let nightWindow = getSchedulerNightWindow();
  if (options?.respectCurrentTime) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
    const nowSlotHour = minute > 0 ? hour + 1 : hour;
    dayWindow = {
      ...dayWindow,
      startHour: Math.min(Math.max(dayWindow.startHour, nowSlotHour), dayWindow.endHour),
      minGapMinutes: Math.min(dayWindow.minGapMinutes, 45),
    };
    nightWindow = {
      ...nightWindow,
      startHour: Math.min(Math.max(nightWindow.startHour, nowSlotHour), nightWindow.endHour),
      minGapMinutes: Math.min(nightWindow.minGapMinutes, 45),
    };
  }

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

    for (const post of picked) {
      if (!post.imageUrl?.trim()) {
        return {
          ok: false,
          reason: `Feed "${feed.id}" post "${post.slug}" has no raster imageUrl`,
          date: localDate,
        };
      }
    }

    let dueAts = generateDayNightPostTimes(
      localDate,
      {
        dayCount: schedule.dayPosts,
        nightCount: schedule.nightPosts,
        dayWindow,
        nightWindow,
        earlyMorningWindow: getSchedulerEarlyMorningWindow(),
      },
      feedRng,
      timezone,
    );

    if (dueAts.length < picked.length) {
      const earlyWindow = getSchedulerEarlyMorningWindow();
      dueAts = ensurePostTimeCount(
        localDate,
        dueAts,
        picked.length,
        [
          nightWindow,
          { ...earlyWindow, date: addDaysToLocalDate(localDate, 1) },
        ],
        feedRng,
        timezone,
      );
    }

    if (dueAts.length < picked.length) {
      return {
        ok: false,
        reason: `Feed "${feed.id}": could not allocate ${picked.length} schedule times (got ${dueAts.length})`,
        date: localDate,
      };
    }

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
  const usedPostKeys = new Set<string>();

  try {
    for (const item of toSchedule) {
      const channel = channelOrder[item.channelIndex % channelOrder.length]!;
      let post = item.post;
      let createdPost: Awaited<ReturnType<typeof createScheduledBufferPost>> | null = null;

      for (let attempt = 0; attempt < 12; attempt++) {
        const text = buildSchedulablePostTextForService(post, channel.service);
        try {
          createdPost = await createScheduledBufferPostWithRetry(apiKey, {
            channelId: channel.id,
            channelService: channel.service,
            text,
            dueAt: item.dueAt,
            url: post.url,
            imageUrl: post.imageUrl,
            imageAlt: post.imageAlt,
          });
          break;
        } catch (err) {
          const message = err instanceof Error ? err.message : '';
          const duplicate = /posted that one recently/i.test(message);
          const imageRejected = /file size limit|unsupported content-type|image exceeds/i.test(message);
          if ((!duplicate && !imageRejected) || attempt >= 11) {
            throw err;
          }
          usedPostKeys.add(postCooldownKey(post.feedId, post.slug));
          const pool = feedPosts.get(post.feedId) ?? [];
          const alternate = pool.find(
            (candidate) => !usedPostKeys.has(postCooldownKey(candidate.feedId, candidate.slug)),
          );
          if (!alternate) throw err;
          post = alternate;
        }
      }

      if (!createdPost) {
        throw new Error('Failed to schedule post after alternate attempts');
      }

      usedPostKeys.add(postCooldownKey(post.feedId, post.slug));

      created.push({
        postId: createdPost.id,
        slug: post.slug,
        feedId: post.feedId,
        channelId: channel.id,
        channelService: createdPost.channelService,
        dueAt: createdPost.dueAt,
        title: post.title,
        imageUrl: post.imageUrl,
      });

      newRecent.push({
        slug: post.slug,
        feedId: post.feedId,
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

async function createScheduledBufferPostWithRetry(
  apiKey: string,
  input: Parameters<typeof createScheduledBufferPost>[1],
  maxAttempts = 8,
): Promise<Awaited<ReturnType<typeof createScheduledBufferPost>>> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 5000 * attempt));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      return await createScheduledBufferPost(apiKey, input);
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : '';
      const retryable = /too many requests/i.test(message);
      if (!retryable || attempt === maxAttempts - 1) {
        throw err;
      }
    }
  }
  throw lastError;
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
