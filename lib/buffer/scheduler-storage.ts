import { getKV } from '@/lib/kv';
import type { RecentSlugEntry } from './scheduler-core';

/** Must match createRepukBufferAdapter().siteId and @robertcashman/buffer-engine storage keys. */
export const BUFFER_SCHEDULER_SITE_ID = 'policestationrepuk';

const RUN_KEY = (date: string) => `buffer-engine:run:${BUFFER_SCHEDULER_SITE_ID}:${date}`;
const RECENT_SLUGS_KEY = `buffer-engine:recent-slugs:${BUFFER_SCHEDULER_SITE_ID}`;

export interface SchedulerRunRecord {
  date: string;
  scheduledAt: string;
  postIds: string[];
  slugs: string[];
  feedIds?: string[];
  channels: string[];
  dueAts: string[];
}

export async function getSchedulerRunForDate(date: string): Promise<SchedulerRunRecord | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<SchedulerRunRecord>(RUN_KEY(date))) ?? null;
}

export async function saveSchedulerRun(record: SchedulerRunRecord): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(RUN_KEY(record.date), record, { ex: 60 * 60 * 24 * 45 });
}

export async function deleteSchedulerRunForDate(date: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.del(RUN_KEY(date));
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
