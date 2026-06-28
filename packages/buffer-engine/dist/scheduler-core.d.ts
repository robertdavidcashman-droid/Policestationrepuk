import type { BufferChannelService } from './types';
import type { SchedulablePost } from './types';
export type RandomFn = () => number;
export declare function hashSeed(input: string): number;
/** Deterministic PRNG — same seed yields same sequence (stable if cron retries before lock). */
export declare function mulberry32(seed: number): RandomFn;
export declare function withBufferSocialUtm(url: string, feedId: string, service: BufferChannelService): string;
export declare function buildSchedulablePostText(post: SchedulablePost, options?: {
    feedId?: string;
    service?: BufferChannelService;
}): string;
/** Twitter/X posts must stay within 280 characters — title + URL only when needed. */
export declare function buildSchedulablePostTextForService(post: SchedulablePost, service: BufferChannelService): string;
export declare function postCooldownKey(feedId: string, slug: string): string;
/** London/BST offset for scheduling — Europe/London only for now. */
export declare function londonOffsetForDate(localDate: string): string;
export declare function timezoneOffsetForDate(localDate: string, timeZone: string): string;
export declare function generateRandomPostTimes(localDate: string, count: number, window: {
    startHour: number;
    endHour: number;
    minGapMinutes: number;
}, random: RandomFn, timeZone?: string): string[];
export declare function addDaysToLocalDate(localDate: string, days: number): string;
/**
 * Schedule day + night slots: e.g. 3 between 08:00–21:00 and 2 in the evening
 * (21:00–23:59). If two night slots are needed, the second uses early morning
 * (00:00–07:00) on the following calendar day.
 */
export declare function generateDayNightPostTimes(localDate: string, options: {
    dayCount: number;
    nightCount: number;
    dayWindow: {
        startHour: number;
        endHour: number;
        minGapMinutes: number;
    };
    nightWindow: {
        startHour: number;
        endHour: number;
        minGapMinutes: number;
    };
    earlyMorningWindow: {
        startHour: number;
        endHour: number;
        minGapMinutes: number;
    };
}, random: RandomFn, timeZone?: string): string[];
/** Ensure exactly `count` schedule times, topping up from fallback windows when day slots are tight. */
export declare function ensurePostTimeCount(localDate: string, initial: string[], count: number, fallbackWindows: Array<{
    date?: string;
    startHour: number;
    endHour: number;
    minGapMinutes: number;
}>, random: RandomFn, timeZone?: string): string[];
export declare function localDateInTimezone(date: Date, timeZone: string): string;
export declare function shuffleChannels<T>(items: T[], random: RandomFn): T[];
import type { RecentSlugEntry } from './types';
export type { RecentSlugEntry };
export declare function slugsInCooldown(entries: RecentSlugEntry[], cooldownDays: number, now?: Date): Set<string>;
/** Per-feed cooldown capped by pool size so small RSS feeds can rotate without exhausting slugs. */
export declare function effectiveCooldownDays(poolSize: number, postsPerFeed: number, globalCooldown: number): number;
export declare function slugsInCooldownForFeed(entries: RecentSlugEntry[], feedId: string, cooldownDays: number, now?: Date): Set<string>;
export declare function appendRecentSlugs(entries: RecentSlugEntry[], added: RecentSlugEntry[], maxEntries?: number): RecentSlugEntry[];
//# sourceMappingURL=scheduler-core.d.ts.map