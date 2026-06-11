/**
 * Rebuild prospect status indexes after a saveProspect indexing bug.
 * npx tsx scripts/firm-outreach-reindex.ts
 */
import { getKV } from '@/lib/kv';
import type { FirmProspectStatus } from './types';
import { getProspect, listAllProspectIds } from './storage';

const PROSPECT_STATUS_INDEX = 'firmprospect:status:';

function statusIndexKey(status: FirmProspectStatus): string {
  return `${PROSPECT_STATUS_INDEX}${status}`;
}

const ALL_STATUSES: FirmProspectStatus[] = [
  'discovered',
  'enriching',
  'enriched',
  'ready_to_send',
  'sent',
  'bounced',
  'unsubscribed',
  'joined_whatsapp',
  'excluded',
  'no_email',
];

export async function reindexProspectStatuses(): Promise<{
  scanned: number;
  byStatus: Record<string, number>;
}> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');

  const byStatus: Record<string, number> = {};
  for (const s of ALL_STATUSES) {
    byStatus[s] = 0;
    await kv.set(statusIndexKey(s), []);
  }

  const ids = await listAllProspectIds();
  for (const id of ids) {
    const p = await getProspect(id);
    if (!p) continue;
    const key = statusIndexKey(p.status);
    const current = (await kv.get<string[]>(key)) ?? [];
    if (!current.includes(id)) {
      current.push(id);
      await kv.set(key, current);
    }
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
  }

  return { scanned: ids.length, byStatus };
}
