import { createScheduledBufferPost } from './client';
import { assertGoogleBusinessScheduleReady } from './gbp-preflight';
import {
  getBufferApiKey,
  getBufferChannels,
  getSchedulerCooldownDays,
  getSchedulerDayWindow,
  getSchedulerEarlyMorningWindow,
  getSchedulerNightWindow,
  getSchedulerTimezone,
  resolveFeedSchedule,
  type BufferChannelService,
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
  effectiveCooldownDays,
  slugsInCooldownForFeed,
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
  gbpIssues?: Array<{
    feedId: string;
    slug: string;
    rawImageUrl?: string;
    gbpImageUrl?: string;
    reason: string;
  }>;
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
  options?: { respectCurrentTime?: boolean; extraExcludeKeys?: Set<string>; force?: boolean },
): Promise<BufferSchedulerResult> {
  const apiKey = getBufferApiKey();
  if (!apiKey) {
    return { ok: false, reason: 'BUFFER_API_KEY is not configured' };
  }

  const timezone = getSchedulerTimezone();
  const localDate = localDateInTimezone(now, timezone);
  const existingRun = options?.force ? null : await getSchedulerRunForDate(localDate);
  if (existingRun) {
    console.warn(`[buffer:scheduler] Already scheduled for ${localDate} — skipping (use force to re-run)`);
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

  const recentEntries = await getRecentSlugEntries();

  const { posts: feedPosts, errors: feedErrors } = await loadAllFeedPosts();
  if (feedErrors.length > 0) {
    console.warn(`[buffer:scheduler] Feed load issues: ${formatFeedLoadErrors(feedErrors)}`);
  }

  const activeFeedSchedules = feedSchedules.filter(
    ({ feed }) => (feedPosts.get(feed.id) ?? []).length > 0,
  );
  if (activeFeedSchedules.length === 0) {
    return {
      ok: false,
      reason: `All feeds failed to load: ${formatFeedLoadErrors(feedErrors)}`,
      date: localDate,
    };
  }
  if (activeFeedSchedules.length < feedSchedules.length) {
    const skipped = feedSchedules
      .filter(({ feed }) => (feedPosts.get(feed.id) ?? []).length === 0)
      .map(({ feed }) => feed.id);
    console.warn(
      `[buffer:scheduler] Skipping feeds with no posts this run: ${skipped.join(', ')}`,
    );
  }

  const activeTotalPosts = activeFeedSchedules.reduce(
    (sum, { schedule }) => sum + schedule.postsPerFeed,
    0,
  );
  const rng = mulberry32(hashSeed(`buffer-scheduler:${localDate}`));
  const channelOrder = shuffleChannelsRepeated(channels, activeTotalPosts, rng);

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

  for (const { feed, schedule } of activeFeedSchedules) {
    const pool = feedPosts.get(feed.id) ?? [];
    const feedRng = mulberry32(hashSeed(`buffer-scheduler:${localDate}:${feed.id}`));
    const feedCooldown = effectiveCooldownDays(pool.length, schedule.postsPerFeed, cooldownDays);
    const feedExcludeKeys = slugsInCooldownForFeed(recentEntries, feed.id, feedCooldown, now);
    if (options?.extraExcludeKeys) {
      for (const key of options.extraExcludeKeys) {
        if (key.startsWith(`${feed.id}:`)) feedExcludeKeys.add(key);
      }
    }
    const picked = pickRandomSchedulablePosts(pool, schedule.postsPerFeed, feedExcludeKeys, feedRng);
    pickedByFeed.set(feed.id, picked);

    if (picked.length === 0) {
      if (pool.length > 0) {
        console.warn(
          `[buffer:scheduler] Feed "${feed.id}" has no posts after cooldown (pool ${pool.length}, cooldown ${feedCooldown}d) — skipping`,
        );
        continue;
      }
      console.warn(`[buffer:scheduler] Feed "${feed.id}" has empty pool — skipping`);
      continue;
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

  if (toSchedule.length === 0) {
    return {
      ok: false,
      reason: 'No posts could be scheduled — all active feeds skipped (cooldown or empty pools)',
      date: localDate,
    };
  }

  for (const { feed, schedule } of activeFeedSchedules) {
    const picked = pickedByFeed.get(feed.id) ?? [];
    if (picked.length === 0) {
      continue;
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
  const scheduleFailures: Array<{
    feedId: string;
    slug: string;
    channelService: string;
    error: string;
  }> = [];

  const gbpPosts = toSchedule
    .filter((item) => channelOrder[item.channelIndex % channelOrder.length]!.service === 'googlebusiness')
    .map((item) => item.post);
  const gbpIssues = await assertGoogleBusinessScheduleReady(gbpPosts);
  if (gbpIssues.length > 0) {
    console.error('[buffer:scheduler] GBP preflight failed:', JSON.stringify(gbpIssues));
    return {
      ok: false,
      reason: 'GBP preflight failed',
      gbpIssues,
      date: localDate,
    };
  }

  for (const item of toSchedule) {
    const channel = channelOrder[item.channelIndex % channelOrder.length]!;
    let post = item.post;
    let createdPost: Awaited<ReturnType<typeof createScheduledBufferPost>> | null = null;

    try {
      for (let attempt = 0; attempt < 12; attempt++) {
        const text = buildSchedulablePostTextForService(post, channel.service);
        let imageUrlForPost = imageUrlForChannel(post, channel.service);
        let triedWithoutImage = imageUrlForPost === undefined;

        const tryCreate = async (imageUrl?: string) =>
          createScheduledBufferPostWithRetry(apiKey, {
            channelId: channel.id,
            channelService: channel.service,
            text,
            dueAt: item.dueAt,
            url: post.url,
            imageUrl,
            imageAlt: post.imageAlt,
            feedId: post.feedId,
          });

        try {
          createdPost = await tryCreate(imageUrlForPost);
          break;
        } catch (err) {
          const message = err instanceof Error ? err.message : '';
          const duplicate =
            /posted that one recently|already got this one scheduled|not able to post the same thing twice/i.test(
              message,
            );
          const imageRejected = isBufferMediaError(message);

          if (
            imageRejected &&
            channel.service === 'twitter' &&
            imageUrlForPost &&
            !triedWithoutImage
          ) {
            imageUrlForPost = undefined;
            triedWithoutImage = true;
            try {
              createdPost = await tryCreate(undefined);
              break;
            } catch (retryErr) {
              const retryMsg = retryErr instanceof Error ? retryErr.message : '';
              if (!isBufferMediaError(retryMsg) && !duplicate) {
                throw retryErr;
              }
            }
          }

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

      if (channel.service === 'googlebusiness') {
        console.info(
          `[buffer:scheduler] GBP ${post.feedId}/${post.slug}: raw=${post.imageUrl ?? 'none'} resolved=${createdPost.imageUrl ?? post.googleBusinessImageUrl ?? 'none'}`,
        );
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
        imageUrl: createdPost.imageUrl ?? post.imageUrl,
      });

      newRecent.push({
        slug: post.slug,
        feedId: post.feedId,
        scheduledAt: now.toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Buffer schedule failed';
      scheduleFailures.push({
        feedId: post.feedId,
        slug: post.slug,
        channelService: channel.service,
        error: message,
      });
      console.warn(
        `[buffer:scheduler] Skipped ${post.feedId}/${post.slug} on ${channel.service}: ${message}`,
      );
    }
  }

  if (created.length === 0) {
    const detail =
      scheduleFailures.length > 0
        ? scheduleFailures.map((f) => `${f.feedId}/${f.slug}@${f.channelService}`).join('; ')
        : 'no posts scheduled';
    return {
      ok: false,
      reason: `No posts could be scheduled — ${detail}`,
      date: localDate,
    };
  }

  if (scheduleFailures.length > 0) {
    console.warn(
      `[buffer:scheduler] Partial schedule: ${created.length} ok, ${scheduleFailures.length} failed`,
    );
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

function isBufferMediaError(message: string): boolean {
  return /file size limit|unsupported content-type|image exceeds|image validation failed|image too large|non-raster image path|requires a blog image url|google business requires|no google business compatible|magic-byte check failed|gbp preflight failed|cannot contain phone numbers|issue with the attached media|connection timing out|file being too large|attached media or link/i.test(
    message,
  );
}

/** Twitter/X: link-preview only for cross-site RSS — external images often fail Buffer publish. */
function imageUrlForChannel(
  post: SchedulablePost,
  service: BufferChannelService,
): string | undefined {
  if (service === 'googlebusiness') {
    return post.googleBusinessImageUrl ?? post.imageUrl;
  }
  if (service === 'twitter' && post.feedId !== 'policestationrepuk') {
    return undefined;
  }
  return post.imageUrl;
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
