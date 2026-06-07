import { getAllBlogArticles } from '@/lib/blog/registry';
import { SITE_URL } from '@/lib/seo-layer/config';
import { createScheduledBufferPost } from './client';
import {
  getBufferApiKey,
  getBufferChannels,
  getSchedulerCooldownDays,
  getSchedulerPostsPerDay,
  getSchedulerTimeWindow,
  getSchedulerTimezone,
} from './config';
import {
  appendRecentSlugs,
  buildPostText,
  generateRandomPostTimes,
  hashSeed,
  localDateInTimezone,
  mulberry32,
  pickRandomBlogPosts,
  shuffleChannels,
  slugsInCooldown,
  type RecentSlugEntry,
} from './scheduler-core';
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
        channelId: existingRun.channels[i] ?? '',
        channelService: '',
        dueAt: existingRun.dueAts[i] ?? null,
        title: slug,
      })),
    };
  }

  const postsPerDay = getSchedulerPostsPerDay();
  const cooldownDays = getSchedulerCooldownDays();
  const timeWindow = getSchedulerTimeWindow();
  const channels = getBufferChannels();

  const recentEntries = await getRecentSlugEntries();
  const excludeSlugs = slugsInCooldown(recentEntries, cooldownDays, now);

  const rng = mulberry32(hashSeed(`buffer-scheduler:${localDate}`));
  const articles = pickRandomBlogPosts(getAllBlogArticles(), postsPerDay, excludeSlugs, rng);
  const dueAts = generateRandomPostTimes(localDate, articles.length, timeWindow, rng, timezone);
  const channelOrder = shuffleChannels(channels, rng).slice(0, articles.length);

  const created: BufferSchedulerResult['posts'] = [];
  const newRecent: RecentSlugEntry[] = [];

  try {
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i]!;
      const channel = channelOrder[i]!;
      const dueAt = dueAts[i]!;
      const url = `${SITE_URL.replace(/\/$/, '')}/Blog/${article.slug}`;
      const text = buildPostText(article, SITE_URL);

      const post = await createScheduledBufferPost(apiKey, {
        channelId: channel.id,
        channelService: channel.service,
        text,
        dueAt,
        url,
      });

      created.push({
        postId: post.id,
        slug: article.slug,
        channelId: channel.id,
        channelService: post.channelService,
        dueAt: post.dueAt,
        title: article.title,
      });

      newRecent.push({ slug: article.slug, scheduledAt: now.toISOString() });
    }
  } catch (err) {
    const partial = created.map((p) => ({
      slug: p.slug,
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
    channels: created.map((p) => p.channelId),
    dueAts: created.map((p) => p.dueAt ?? ''),
  };

  await saveSchedulerRun(record);
  await saveRecentSlugEntries(appendRecentSlugs(recentEntries, newRecent));

  return {
    ok: true,
    date: localDate,
    posts: created,
  };
}
