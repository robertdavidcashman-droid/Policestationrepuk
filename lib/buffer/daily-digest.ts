import { getSchedulerTimezone } from './config';
import { localDateInTimezone } from './scheduler-core';
import { getKV } from '@/lib/kv';

const DEDUP_PREFIX = 'buffer-digest:sent:';

/** Scheduler run date to verify at the 04:30 UTC daily report (yesterday in London). */
export function bufferDigestVerifyDate(now = new Date(), timezone?: string): string {
  const tz = timezone ?? getSchedulerTimezone();
  const today = localDateInTimezone(now, tz);
  const [y, m, d] = today.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

export async function wasBufferDigestSent(date: string): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  return Boolean(await kv.get(`${DEDUP_PREFIX}${date}`));
}

export async function markBufferDigestSent(date: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(`${DEDUP_PREFIX}${date}`, new Date().toISOString(), {
    ex: 60 * 60 * 24 * 14,
  });
}
