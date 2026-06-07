import type { BlogArticle } from '@/lib/blog/types';
import type { BufferChannelService } from './config';
import type { SchedulablePost } from './content-types';

export type RandomFn = () => number;

export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic PRNG — same seed yields same sequence (stable if cron retries before lock). */
export function mulberry32(seed: number): RandomFn {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function blogPostUrl(siteUrl: string, slug: string): string {
  const base = siteUrl.replace(/\/$/, '');
  return `${base}/Blog/${slug}`;
}

export function buildPostText(article: BlogArticle, siteUrl: string): string {
  const url = blogPostUrl(siteUrl, article.slug);
  const excerpt = article.excerpt.trim();
  if (excerpt) {
    return `${article.title}\n\n${excerpt}\n\n${url}`;
  }
  return `${article.title}\n\n${url}`;
}

export function buildSchedulablePostText(post: SchedulablePost): string {
  const excerpt = post.excerpt.trim();
  if (excerpt) {
    return `${post.title}\n\n${excerpt}\n\n${post.url}`;
  }
  return `${post.title}\n\n${post.url}`;
}

const TWITTER_MAX_CHARS = 280;

/** Twitter/X posts must stay within 280 characters — title + URL only when needed. */
export function buildSchedulablePostTextForService(
  post: SchedulablePost,
  service: BufferChannelService,
): string {
  const full = buildSchedulablePostText(post);
  if (service !== 'twitter' || full.length <= TWITTER_MAX_CHARS) {
    return full;
  }

  const suffix = `\n\n${post.url}`;
  const budget = TWITTER_MAX_CHARS - suffix.length;
  if (budget <= 0) {
    return post.url.slice(0, TWITTER_MAX_CHARS);
  }

  const title = post.title.trim();
  if (title.length <= budget) {
    return `${title}${suffix}`;
  }

  const trimmedTitle = title.slice(0, Math.max(1, budget - 1)).trimEnd();
  return `${trimmedTitle}…${suffix}`;
}

export function postCooldownKey(feedId: string, slug: string): string {
  return `${feedId}:${slug}`;
}

export function pickRandomBlogPosts(
  articles: BlogArticle[],
  count: number,
  excludeSlugs: Set<string>,
  random: RandomFn,
): BlogArticle[] {
  const pool = articles.filter((a) => !excludeSlugs.has(a.slug));
  if (pool.length === 0) {
    throw new Error('No blog articles available after applying cooldown exclusions');
  }

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const take = Math.min(count, shuffled.length);
  return shuffled.slice(0, take);
}

export function pickRandomSchedulablePosts(
  posts: SchedulablePost[],
  count: number,
  excludeKeys: Set<string>,
  random: RandomFn,
): SchedulablePost[] {
  const pool = posts.filter((p) => !excludeKeys.has(postCooldownKey(p.feedId, p.slug)));
  if (pool.length === 0) {
    throw new Error('No posts available after applying cooldown exclusions');
  }

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function formatOffsetIso(localDate: string, hour: number, minute: number, offset: string): string {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${localDate}T${hh}:${mm}:00${offset}`;
}

/** London/BST offset for scheduling — Europe/London only for now. */
export function londonOffsetForDate(localDate: string): string {
  const [y, m, d] = localDate.split('-').map(Number);
  const month = m - 1;
  const lastSunday = (year: number, mon: number) => {
    const last = new Date(Date.UTC(year, mon + 1, 0));
    return last.getUTCDate() - last.getUTCDay();
  };
  const bstStartDay = lastSunday(y, 2) + 1; // last Sunday in March
  const bstEndDay = lastSunday(y, 9); // last Sunday in October
  const isBst =
    (month > 2 && month < 9) ||
    (month === 2 && d >= bstStartDay) ||
    (month === 9 && d < bstEndDay);
  return isBst ? '+01:00' : '+00:00';
}

export function timezoneOffsetForDate(localDate: string, timeZone: string): string {
  if (timeZone === 'Europe/London') {
    return londonOffsetForDate(localDate);
  }
  return '+00:00';
}

export function generateRandomPostTimes(
  localDate: string,
  count: number,
  window: { startHour: number; endHour: number; minGapMinutes: number },
  random: RandomFn,
  timeZone = 'Europe/London',
): string[] {
  if (count <= 0) return [];

  const offset = timezoneOffsetForDate(localDate, timeZone);
  const startMinutes = window.startHour * 60;
  const endMinutes = window.endHour * 60;
  const span = endMinutes - startMinutes;

  if (span <= 0) {
    throw new Error('Invalid scheduler time window');
  }

  const slots: number[] = [];
  const maxAttempts = 200;

  for (let attempt = 0; attempt < maxAttempts && slots.length < count; attempt++) {
    const candidate = startMinutes + Math.floor(random() * span);
    const rounded = Math.round(candidate / 5) * 5;
    if (rounded < startMinutes || rounded > endMinutes) continue;
    if (slots.every((s) => Math.abs(s - rounded) >= window.minGapMinutes)) {
      slots.push(rounded);
    }
  }

  while (slots.length < count) {
    const evenlySpaced =
      startMinutes +
      Math.floor((slots.length * span) / Math.max(count, 1)) +
      Math.floor(random() * 15);
    const rounded = Math.min(endMinutes, Math.max(startMinutes, Math.round(evenlySpaced / 5) * 5));
    if (slots.every((s) => Math.abs(s - rounded) >= Math.min(window.minGapMinutes, 45))) {
      slots.push(rounded);
    } else if (slots.length === 0) {
      slots.push(rounded);
    } else {
      break;
    }
  }

  slots.sort((a, b) => a - b);

  return slots.map((mins) => {
    const hour = Math.floor(mins / 60);
    const minute = mins % 60;
    return formatOffsetIso(localDate, hour, minute, offset);
  });
}

export function addDaysToLocalDate(localDate: string, days: number): string {
  const [y, m, d] = localDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Schedule day + night slots: e.g. 3 between 08:00–21:00 and 2 in the evening
 * (21:00–23:59). If two night slots are needed, the second uses early morning
 * (00:00–07:00) on the following calendar day.
 */
export function generateDayNightPostTimes(
  localDate: string,
  options: {
    dayCount: number;
    nightCount: number;
    dayWindow: { startHour: number; endHour: number; minGapMinutes: number };
    nightWindow: { startHour: number; endHour: number; minGapMinutes: number };
    earlyMorningWindow: { startHour: number; endHour: number; minGapMinutes: number };
  },
  random: RandomFn,
  timeZone = 'Europe/London',
): string[] {
  const dayWindowValid = options.dayWindow.startHour < options.dayWindow.endHour;
  const dayTimes =
    options.dayCount > 0 && dayWindowValid
      ? generateRandomPostTimes(localDate, options.dayCount, options.dayWindow, random, timeZone)
      : [];

  const nightTimes: string[] = [];
  const nightWindowValid = options.nightWindow.startHour < options.nightWindow.endHour;
  const extraDaySlots = dayWindowValid ? 0 : options.dayCount;
  const totalNightSlots = options.nightCount + extraDaySlots;

  if (totalNightSlots <= 0) {
    return [...dayTimes].sort();
  }

  const eveningCount = totalNightSlots >= 2 ? Math.min(1, totalNightSlots) : totalNightSlots;
  const earlyCount = totalNightSlots - eveningCount;

  if (eveningCount > 0 && nightWindowValid) {
    nightTimes.push(
      ...generateRandomPostTimes(localDate, eveningCount, options.nightWindow, random, timeZone),
    );
  }

  const earlyMorningValid = options.earlyMorningWindow.startHour < options.earlyMorningWindow.endHour;
  const needEarly = earlyCount + (eveningCount > 0 && !nightWindowValid ? eveningCount : 0);
  if (needEarly > 0 && earlyMorningValid) {
    const nextDate = addDaysToLocalDate(localDate, 1);
    nightTimes.push(
      ...generateRandomPostTimes(
        nextDate,
        needEarly,
        options.earlyMorningWindow,
        random,
        timeZone,
      ),
    );
  }

  return [...dayTimes, ...nightTimes].sort();
}

/** Ensure exactly `count` schedule times, topping up from fallback windows when day slots are tight. */
export function ensurePostTimeCount(
  localDate: string,
  initial: string[],
  count: number,
  fallbackWindows: Array<{
    date?: string;
    startHour: number;
    endHour: number;
    minGapMinutes: number;
  }>,
  random: RandomFn,
  timeZone = 'Europe/London',
): string[] {
  const out = [...initial];
  for (const window of fallbackWindows) {
    if (out.length >= count) break;
    const need = count - out.length;
    try {
      const extra = generateRandomPostTimes(window.date ?? localDate, need, window, random, timeZone);
      for (const slot of extra) {
        if (out.length >= count) break;
        if (!out.includes(slot)) out.push(slot);
      }
    } catch {
      /* skip invalid window */
    }
  }
  return out.sort().slice(0, count);
}

export function localDateInTimezone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const d = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${d}`;
}

export function shuffleChannels<T>(items: T[], random: RandomFn): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface RecentSlugEntry {
  slug: string;
  feedId?: string;
  scheduledAt: string;
}

export function slugsInCooldown(
  entries: RecentSlugEntry[],
  cooldownDays: number,
  now = new Date(),
): Set<string> {
  const cutoff = now.getTime() - cooldownDays * 24 * 60 * 60 * 1000;
  const excluded = new Set<string>();
  for (const entry of entries) {
    if (new Date(entry.scheduledAt).getTime() >= cutoff) {
      const feedId = entry.feedId ?? 'policestationrepuk';
      excluded.add(postCooldownKey(feedId, entry.slug));
    }
  }
  return excluded;
}

export function appendRecentSlugs(
  entries: RecentSlugEntry[],
  added: RecentSlugEntry[],
  maxEntries = 120,
): RecentSlugEntry[] {
  return [...added, ...entries].slice(0, maxEntries);
}
