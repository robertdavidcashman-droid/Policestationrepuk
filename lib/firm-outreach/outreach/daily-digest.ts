import { localDateInTimezone } from '@/lib/buffer/scheduler-core';
import { getKV } from '@/lib/kv';

const DEDUP_PREFIX = 'firmoutreach:digest:sent:';
const NOTIFY_TIMEZONE =
  process.env.FIRM_OUTREACH_DIGEST_TIMEZONE?.trim() || 'Europe/London';

export function outreachDigestDate(now = new Date()): string {
  return localDateInTimezone(now, NOTIFY_TIMEZONE);
}

export async function wasOutreachDigestSent(date: string): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  return Boolean(await kv.get(`${DEDUP_PREFIX}${date}`));
}

export async function markOutreachDigestSent(date: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(`${DEDUP_PREFIX}${date}`, new Date().toISOString(), {
    ex: 60 * 60 * 24 * 14,
  });
}
