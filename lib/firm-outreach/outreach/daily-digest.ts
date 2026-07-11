import { claimKey } from '@/lib/kv-atomic';
import { getKV } from '@/lib/kv';

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

const DEDUP_PREFIX = 'firmoutreach:digest:sent:';
export const NOTIFY_TIMEZONE =
  process.env.FIRM_OUTREACH_DIGEST_TIMEZONE?.trim() || 'Europe/London';

export function outreachDigestDedupKey(campaignId: string, date: string): string {
  return `${DEDUP_PREFIX}${campaignId}:${date}`;
}

export function outreachDigestDate(now = new Date()): string {
  return localDateInTimezone(now, NOTIFY_TIMEZONE);
}

export async function wasOutreachDigestSent(
  date: string,
  campaignId: string,
): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  return Boolean(await kv.get(outreachDigestDedupKey(campaignId, date)));
}

/** Atomic claim — only one outreach digest per campaign/date. */
export async function claimOutreachDigest(date: string, campaignId: string): Promise<boolean> {
  return claimKey(outreachDigestDedupKey(campaignId, date), 60 * 60 * 24 * 14);
}

export async function markOutreachDigestSent(date: string, campaignId: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(outreachDigestDedupKey(campaignId, date), new Date().toISOString(), {
    ex: 60 * 60 * 24 * 14,
  });
}
