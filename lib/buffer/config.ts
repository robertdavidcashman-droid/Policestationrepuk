export type BufferChannelService = 'twitter' | 'linkedin' | 'googlebusiness';

export interface BufferChannelConfig {
  id: string;
  service: BufferChannelService;
}

/** Defaults for robertcashman's Buffer workspace — override via env in other accounts. */
const DEFAULT_ORG_ID = '69d26bdf0f822245c9a723c4';

const DEFAULT_CHANNELS: BufferChannelConfig[] = [
  { id: '69d26c3d031bfa423cd0c6b3', service: 'twitter' },
  { id: '69d26c06031bfa423cd0c50d', service: 'linkedin' },
  { id: '69d26c8b031bfa423cd0c8b7', service: 'googlebusiness' },
];

export function getBufferApiKey(): string | null {
  const key = process.env.BUFFER_API_KEY?.trim();
  return key || null;
}

export function getBufferOrganizationId(): string {
  return process.env.BUFFER_ORGANIZATION_ID?.trim() || DEFAULT_ORG_ID;
}

export function getBufferChannels(): BufferChannelConfig[] {
  const twitter = process.env.BUFFER_CHANNEL_TWITTER_ID?.trim();
  const linkedin = process.env.BUFFER_CHANNEL_LINKEDIN_ID?.trim();
  const google = process.env.BUFFER_CHANNEL_GOOGLEBUSINESS_ID?.trim();
  if (twitter && linkedin && google) {
    return [
      { id: twitter, service: 'twitter' },
      { id: linkedin, service: 'linkedin' },
      { id: google, service: 'googlebusiness' },
    ];
  }
  return DEFAULT_CHANNELS;
}

/** Minimum posts scheduled per content feed each day (enforced in clampPostsPerFeed). */
export const MIN_SCHEDULER_POSTS_PER_FEED = 4;

export function getSchedulerMinPostsPerFeed(): number {
  return MIN_SCHEDULER_POSTS_PER_FEED;
}

/** Posts scheduled per content feed each day (default 5: 3 day + 2 night, minimum 4). */
export function getSchedulerPostsPerFeed(): number {
  const legacy = process.env.BUFFER_SCHEDULER_POSTS_PER_DAY?.trim();
  const raw = process.env.BUFFER_SCHEDULER_POSTS_PER_FEED ?? legacy ?? '5';
  const n = Number(raw);
  return clampPostsPerFeed(Number.isFinite(n) && n > 0 ? n : 5);
}

/** @deprecated Use getSchedulerPostsPerFeed — kept for older env vars. */
export function getSchedulerPostsPerDay(): number {
  return getSchedulerPostsPerFeed();
}

export function getSchedulerDayPosts(): number {
  const n = Number(process.env.BUFFER_SCHEDULER_DAY_POSTS ?? '3');
  return Number.isFinite(n) && n >= 0 ? Math.min(Math.floor(n), 10) : 3;
}

export function getSchedulerNightPosts(): number {
  const n = Number(process.env.BUFFER_SCHEDULER_NIGHT_POSTS ?? '2');
  return Number.isFinite(n) && n >= 0 ? Math.min(Math.floor(n), 10) : 2;
}

export function getSchedulerCooldownDays(): number {
  const n = Number(process.env.BUFFER_SCHEDULER_COOLDOWN_DAYS ?? '14');
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 90) : 14;
}

export function getSchedulerTimezone(): string {
  return process.env.BUFFER_SCHEDULER_TIMEZONE?.trim() || 'Europe/London';
}

export interface SchedulerTimeWindow {
  startHour: number;
  endHour: number;
  minGapMinutes: number;
}

export function getSchedulerTimeWindow(): SchedulerTimeWindow {
  return getSchedulerDayWindow();
}

export function getSchedulerDayWindow(): SchedulerTimeWindow {
  const startHour = Number(process.env.BUFFER_SCHEDULER_DAY_START_HOUR ?? process.env.BUFFER_SCHEDULER_START_HOUR ?? '8');
  const endHour = Number(process.env.BUFFER_SCHEDULER_DAY_END_HOUR ?? process.env.BUFFER_SCHEDULER_END_HOUR ?? '21');
  const minGapMinutes = Number(process.env.BUFFER_SCHEDULER_MIN_GAP_MINUTES ?? '90');
  return {
    startHour: Number.isFinite(startHour) ? startHour : 8,
    endHour: Number.isFinite(endHour) ? endHour : 21,
    minGapMinutes: Number.isFinite(minGapMinutes) ? minGapMinutes : 90,
  };
}

export function getSchedulerNightWindow(): SchedulerTimeWindow {
  const startHour = Number(process.env.BUFFER_SCHEDULER_NIGHT_START_HOUR ?? '21');
  const endHour = Number(process.env.BUFFER_SCHEDULER_NIGHT_END_HOUR ?? '23');
  const minGapMinutes = Number(process.env.BUFFER_SCHEDULER_NIGHT_MIN_GAP_MINUTES ?? '60');
  return {
    startHour: Number.isFinite(startHour) ? startHour : 21,
    endHour: Number.isFinite(endHour) ? endHour : 23,
    minGapMinutes: Number.isFinite(minGapMinutes) ? minGapMinutes : 60,
  };
}

export function getSchedulerEarlyMorningWindow(): SchedulerTimeWindow {
  const startHour = Number(process.env.BUFFER_SCHEDULER_EARLY_START_HOUR ?? '0');
  const endHour = Number(process.env.BUFFER_SCHEDULER_EARLY_END_HOUR ?? '7');
  const minGapMinutes = Number(process.env.BUFFER_SCHEDULER_NIGHT_MIN_GAP_MINUTES ?? '60');
  return {
    startHour: Number.isFinite(startHour) ? startHour : 0,
    endHour: Number.isFinite(endHour) ? endHour : 7,
    minGapMinutes: Number.isFinite(minGapMinutes) ? minGapMinutes : 60,
  };
}

export interface FeedSchedule {
  postsPerFeed: number;
  dayPosts: number;
  nightPosts: number;
}

function clampPostsPerFeed(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 5;
  return Math.max(
    MIN_SCHEDULER_POSTS_PER_FEED,
    Math.min(Math.floor(n), 15),
  );
}

/** Per-feed schedule — scales default day/night ratio when only postsPerDay is set. */
export function resolveFeedSchedule(feed: {
  postsPerDay?: number;
  dayPosts?: number;
  nightPosts?: number;
}): FeedSchedule {
  const defaultPosts = getSchedulerPostsPerFeed();
  const defaultDay = getSchedulerDayPosts();
  const defaultNight = getSchedulerNightPosts();
  const postsPerFeed = clampPostsPerFeed(feed.postsPerDay ?? defaultPosts);

  if (feed.dayPosts != null && feed.nightPosts != null) {
    return {
      postsPerFeed,
      dayPosts: feed.dayPosts,
      nightPosts: feed.nightPosts,
    };
  }

  const totalDefault = defaultDay + defaultNight;
  const dayPosts =
    totalDefault > 0
      ? Math.round((postsPerFeed * defaultDay) / totalDefault)
      : postsPerFeed;
  const nightPosts = postsPerFeed - dayPosts;

  return { postsPerFeed, dayPosts, nightPosts };
}
