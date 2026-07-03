import { getKV } from '@/lib/kv';
import { bufferDigestVerifyDate } from './daily-digest';

const DEDUP_PREFIX = 'buffer-cross-site-digest:sent:';

export function crossSiteDigestVerifyDate(now = new Date()): string {
  return bufferDigestVerifyDate(now);
}

export async function wasCrossSiteDigestSent(date: string): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  return Boolean(await kv.get(`${DEDUP_PREFIX}${date}`));
}

export async function markCrossSiteDigestSent(date: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(`${DEDUP_PREFIX}${date}`, new Date().toISOString(), {
    ex: 60 * 60 * 24 * 14,
  });
}
