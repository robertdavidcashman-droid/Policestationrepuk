import { getKV } from '@/lib/kv';
import type { RecentSlugEntry } from './scheduler-core';

const RUN_KEY_PREFIX = 'buffer-scheduler:run:';
const RECENT_SLUGS_KEY = 'buffer-scheduler:recent-slugs';

export interface SchedulerRunRecord {
  date: string;
  scheduledAt: string;
  postIds: string[];
  slugs: string[];
  channels: string[];
  dueAts: string[];
}

export async function getSchedulerRunForDate(date: string): Promise<SchedulerRunRecord | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<SchedulerRunRecord>(`${RUN_KEY_PREFIX}${date}`)) ?? null;
}

export async function saveSchedulerRun(record: SchedulerRunRecord): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(`${RUN_KEY_PREFIX}${record.date}`, record, { ex: 60 * 60 * 24 * 45 });
}

export async function getRecentSlugEntries(): Promise<RecentSlugEntry[]> {
  const kv = getKV();
  if (!kv) return [];
  return (await kv.get<RecentSlugEntry[]>(RECENT_SLUGS_KEY)) ?? [];
}

export async function saveRecentSlugEntries(entries: RecentSlugEntry[]): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(RECENT_SLUGS_KEY, entries);
}
