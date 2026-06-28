import type { BufferKV, RecentSlugEntry, SchedulerRunRecord, SlugEngagementStats } from './types';

const RUN_KEY = (siteId: string, date: string) => `buffer-engine:run:${siteId}:${date}`;
const RECENT_KEY = (siteId: string) => `buffer-engine:recent-slugs:${siteId}`;
const STATS_KEY = (siteId: string) => `buffer-engine:slug-stats:${siteId}`;

export async function getSchedulerRunForDate(
  kv: BufferKV | null | undefined,
  siteId: string,
  date: string,
): Promise<SchedulerRunRecord | null> {
  if (!kv) return null;
  return (await kv.get<SchedulerRunRecord>(RUN_KEY(siteId, date))) ?? null;
}

export async function saveSchedulerRun(
  kv: BufferKV | null | undefined,
  siteId: string,
  record: SchedulerRunRecord,
): Promise<void> {
  if (!kv) return;
  await kv.set(RUN_KEY(siteId, record.date), record, { ex: 60 * 60 * 24 * 45 });
}

export async function deleteSchedulerRunForDate(
  kv: BufferKV | null | undefined,
  siteId: string,
  date: string,
): Promise<void> {
  if (!kv?.del) return;
  await kv.del(RUN_KEY(siteId, date));
}

export async function getRecentSlugEntries(
  kv: BufferKV | null | undefined,
  siteId: string,
): Promise<RecentSlugEntry[]> {
  if (!kv) return [];
  return (await kv.get<RecentSlugEntry[]>(RECENT_KEY(siteId))) ?? [];
}

export async function saveRecentSlugEntries(
  kv: BufferKV | null | undefined,
  siteId: string,
  entries: RecentSlugEntry[],
): Promise<void> {
  if (!kv) return;
  await kv.set(RECENT_KEY(siteId), entries);
}

export async function getSlugEngagementStats(
  kv: BufferKV | null | undefined,
  siteId: string,
): Promise<Map<string, SlugEngagementStats>> {
  if (!kv) return new Map();
  const raw = await kv.get<Record<string, SlugEngagementStats>>(STATS_KEY(siteId));
  if (!raw) return new Map();
  return new Map(Object.entries(raw));
}

export async function saveSlugEngagementStats(
  kv: BufferKV | null | undefined,
  siteId: string,
  stats: Map<string, SlugEngagementStats>,
): Promise<void> {
  if (!kv) return;
  const obj = Object.fromEntries(stats.entries());
  await kv.set(STATS_KEY(siteId), obj);
}

export function mergeSlugStats(
  existing: Map<string, SlugEngagementStats>,
  updates: SlugEngagementStats[],
): Map<string, SlugEngagementStats> {
  const out = new Map(existing);
  for (const u of updates) {
    const prev = out.get(u.slug) ?? {
      slug: u.slug,
      clicks: 0,
      impressions: 0,
      reactions: 0,
      timesPosted: 0,
      lastPostedAt: null,
    };
    out.set(u.slug, {
      slug: u.slug,
      clicks: prev.clicks + u.clicks,
      impressions: prev.impressions + u.impressions,
      reactions: prev.reactions + u.reactions,
      timesPosted: Math.max(prev.timesPosted, u.timesPosted),
      lastPostedAt: u.lastPostedAt ?? prev.lastPostedAt,
    });
  }
  return out;
}
