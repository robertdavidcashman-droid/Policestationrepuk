import { localDateInTimezone } from '@/lib/buffer/scheduler-core';
import { getKV } from '@/lib/kv';
import type { CrawlerRunStats } from './types';

const BUCKET_PREFIX = 'custodydiscovery:daily-notify:';
const NOTIFY_TIMEZONE = process.env.CUSTODY_DISCOVERY_NOTIFY_TIMEZONE?.trim() || 'Europe/London';
const SEND_AFTER_HOUR = Number(process.env.CUSTODY_DISCOVERY_NOTIFY_SEND_HOUR ?? 18);

export interface DailyNotifyBucket {
  date: string;
  findingIds: string[];
  suitesScanned: number;
  conflictsFlagged: number;
  elapsedMs: number;
  notifiedAt?: string;
}

function bucketKey(date: string): string {
  return `${BUCKET_PREFIX}${date}`;
}

export function dailyNotifyDate(now = new Date()): string {
  return localDateInTimezone(now, NOTIFY_TIMEZONE);
}

export function shouldSendDailyDigest(now = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: NOTIFY_TIMEZONE,
      hour: 'numeric',
      hour12: false,
    }).format(now),
  );
  return hour >= SEND_AFTER_HOUR;
}

export async function getDailyNotifyBucket(date: string): Promise<DailyNotifyBucket | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<DailyNotifyBucket>(bucketKey(date))) ?? null;
}

export async function addToDailyNotifyBucket(
  date: string,
  findingIds: string[],
  stats: Pick<CrawlerRunStats, 'suitesScanned' | 'conflictsFlagged' | 'elapsedMs'>,
): Promise<DailyNotifyBucket> {
  const kv = getKV();
  if (!kv) {
    return {
      date,
      findingIds: [...new Set(findingIds)],
      suitesScanned: stats.suitesScanned,
      conflictsFlagged: stats.conflictsFlagged,
      elapsedMs: stats.elapsedMs,
    };
  }

  const existing = (await kv.get<DailyNotifyBucket>(bucketKey(date))) ?? {
    date,
    findingIds: [],
    suitesScanned: 0,
    conflictsFlagged: 0,
    elapsedMs: 0,
  };

  const merged: DailyNotifyBucket = {
    ...existing,
    findingIds: [...new Set([...existing.findingIds, ...findingIds])],
    suitesScanned: existing.suitesScanned + stats.suitesScanned,
    conflictsFlagged: existing.conflictsFlagged + stats.conflictsFlagged,
    elapsedMs: existing.elapsedMs + stats.elapsedMs,
  };

  await kv.set(bucketKey(date), merged, { ex: 60 * 60 * 24 * 14 });
  return merged;
}

export async function markDailyNotifySent(date: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  const bucket = await getDailyNotifyBucket(date);
  if (!bucket) return;
  await kv.set(
    bucketKey(date),
    { ...bucket, notifiedAt: new Date().toISOString() },
    { ex: 60 * 60 * 24 * 14 },
  );
}
