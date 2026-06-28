import type { BufferKV, RecentSlugEntry, SchedulerRunRecord, SlugEngagementStats } from './types';
export declare function getSchedulerRunForDate(kv: BufferKV | null | undefined, siteId: string, date: string): Promise<SchedulerRunRecord | null>;
export declare function saveSchedulerRun(kv: BufferKV | null | undefined, siteId: string, record: SchedulerRunRecord): Promise<void>;
export declare function deleteSchedulerRunForDate(kv: BufferKV | null | undefined, siteId: string, date: string): Promise<void>;
export declare function getRecentSlugEntries(kv: BufferKV | null | undefined, siteId: string): Promise<RecentSlugEntry[]>;
export declare function saveRecentSlugEntries(kv: BufferKV | null | undefined, siteId: string, entries: RecentSlugEntry[]): Promise<void>;
export declare function getSlugEngagementStats(kv: BufferKV | null | undefined, siteId: string): Promise<Map<string, SlugEngagementStats>>;
export declare function saveSlugEngagementStats(kv: BufferKV | null | undefined, siteId: string, stats: Map<string, SlugEngagementStats>): Promise<void>;
export declare function mergeSlugStats(existing: Map<string, SlugEngagementStats>, updates: SlugEngagementStats[]): Map<string, SlugEngagementStats>;
//# sourceMappingURL=storage.d.ts.map