import { localDateInTimezone } from '@/lib/buffer/scheduler-core';
import { getKV } from '@/lib/kv';

const SENT_PREFIX = 'custodydiscovery:outstanding-digest:sent:';
const NOTIFY_TIMEZONE = process.env.CUSTODY_DISCOVERY_NOTIFY_TIMEZONE?.trim() || 'Europe/London';

function sentKey(date: string): string {
  return `${SENT_PREFIX}${date}`;
}

export function outstandingDigestDate(now = new Date()): string {
  return localDateInTimezone(now, NOTIFY_TIMEZONE);
}

export async function wasOutstandingDigestSent(date: string): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  return Boolean(await kv.get(sentKey(date)));
}

export async function markOutstandingDigestSent(date: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(sentKey(date), new Date().toISOString(), { ex: 60 * 60 * 24 * 14 });
}
