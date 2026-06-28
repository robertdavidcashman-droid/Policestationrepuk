import type { BufferChannelConfig, SiteBufferEnvConfig } from './types';

export const MIN_POSTS_PER_DAY = 5;

function clean(raw: string | undefined): string {
  return (raw ?? '').replace(/\r/g, '').trim().replace(/^["']|["']$/g, '').trim();
}

export function getSiteBufferEnvConfig(): SiteBufferEnvConfig {
  const postsPerDay = clampPostsPerDay(Number(process.env.BUFFER_SCHEDULER_POSTS_PER_FEED ?? process.env.BUFFER_SCHEDULER_POSTS_PER_DAY ?? '5'));
  const dayPosts = clampCount(Number(process.env.BUFFER_SCHEDULER_DAY_POSTS ?? '3'), 10);
  const nightPosts = clampCount(Number(process.env.BUFFER_SCHEDULER_NIGHT_POSTS ?? '2'), 10);
  const total = dayPosts + nightPosts;
  const normalizedDay = total === postsPerDay ? dayPosts : Math.round((postsPerDay * 3) / 5);
  const normalizedNight = postsPerDay - normalizedDay;

  return {
    apiKey: clean(process.env.BUFFER_ACCESS_TOKEN) || clean(process.env.BUFFER_API_KEY) || null,
    organizationId: clean(process.env.BUFFER_ORGANIZATION_ID) || '69d26bdf0f822245c9a723c4',
    channels: getBufferChannelsFromEnv(),
    postsPerDay,
    dayPosts: total === postsPerDay ? dayPosts : normalizedDay,
    nightPosts: total === postsPerDay ? nightPosts : normalizedNight,
    cooldownDays: clampCount(Number(process.env.BUFFER_SCHEDULER_COOLDOWN_DAYS ?? '14'), 90, 1),
    timezone: clean(process.env.BUFFER_SCHEDULER_TIMEZONE) || 'Europe/London',
    dedupWindowDays: clampCount(Number(process.env.BUFFER_DEDUP_WINDOW_DAYS ?? '30'), 90, 1),
    explorationRate: clampFloat(Number(process.env.BUFFER_EXPLORATION_RATE ?? '0.25'), 0.05, 0.5),
  };
}

function clampPostsPerDay(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return MIN_POSTS_PER_DAY;
  return Math.max(MIN_POSTS_PER_DAY, Math.min(Math.floor(n), 15));
}

function clampCount(n: number, max: number, min = 0): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(Math.floor(n), min), max);
}

function clampFloat(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

export function getBufferChannelsFromEnv(): BufferChannelConfig[] {
  const channels: BufferChannelConfig[] = [];
  const linkedin = clean(process.env.BUFFER_CHANNEL_LINKEDIN_ID);
  const twitter = clean(process.env.BUFFER_CHANNEL_TWITTER_ID);
  const google = clean(process.env.BUFFER_CHANNEL_GOOGLEBUSINESS_ID);
  const facebook = clean(process.env.BUFFER_CHANNEL_FACEBOOK_ID);
  if (twitter) channels.push({ id: twitter, service: 'twitter' });
  if (linkedin) channels.push({ id: linkedin, service: 'linkedin' });
  if (google) channels.push({ id: google, service: 'googlebusiness' });
  if (facebook) channels.push({ id: facebook, service: 'facebook' });
  return channels;
}

export function resolveFeedSchedule(config: SiteBufferEnvConfig): {
  postsPerFeed: number;
  dayPosts: number;
  nightPosts: number;
} {
  return {
    postsPerFeed: config.postsPerDay,
    dayPosts: config.dayPosts,
    nightPosts: config.nightPosts,
  };
}

export interface SchedulerTimeWindow {
  startHour: number;
  endHour: number;
  minGapMinutes: number;
}

export function getSchedulerDayWindow(): SchedulerTimeWindow {
  return {
    startHour: Number(process.env.BUFFER_SCHEDULER_DAY_START_HOUR ?? process.env.BUFFER_SCHEDULER_START_HOUR ?? '8'),
    endHour: Number(process.env.BUFFER_SCHEDULER_DAY_END_HOUR ?? process.env.BUFFER_SCHEDULER_END_HOUR ?? '21'),
    minGapMinutes: Number(process.env.BUFFER_SCHEDULER_MIN_GAP_MINUTES ?? '90'),
  };
}

export function getSchedulerNightWindow(): SchedulerTimeWindow {
  return {
    startHour: Number(process.env.BUFFER_SCHEDULER_NIGHT_START_HOUR ?? '21'),
    endHour: Number(process.env.BUFFER_SCHEDULER_NIGHT_END_HOUR ?? '23'),
    minGapMinutes: Number(process.env.BUFFER_SCHEDULER_NIGHT_MIN_GAP_MINUTES ?? '60'),
  };
}

export function getSchedulerEarlyMorningWindow(): SchedulerTimeWindow {
  return {
    startHour: Number(process.env.BUFFER_SCHEDULER_EARLY_START_HOUR ?? '0'),
    endHour: Number(process.env.BUFFER_SCHEDULER_EARLY_END_HOUR ?? '7'),
    minGapMinutes: Number(process.env.BUFFER_SCHEDULER_NIGHT_MIN_GAP_MINUTES ?? '60'),
  };
}
