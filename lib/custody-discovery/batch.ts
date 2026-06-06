import crypto from 'crypto';
import { getKV } from '@/lib/kv';
import type { CrawlerRunStats } from './types';

const BATCH_PREFIX = 'custodydiscovery:batch:';

export interface CustodyDiscoveryBatch {
  id: string;
  findingIds: string[];
  stats: Pick<
    CrawlerRunStats,
    | 'suitesScanned'
    | 'findingsCreated'
    | 'findingsUpdated'
    | 'conflictsFlagged'
    | 'batchCursor'
    | 'batchTotal'
    | 'elapsedMs'
  > & { seededCreated?: number };
  createdAt: string;
  notifiedAt?: string;
}

function batchKey(id: string): string {
  return `${BATCH_PREFIX}${id}`;
}

export function newBatchId(): string {
  return `cdb_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
}

export async function saveBatch(batch: CustodyDiscoveryBatch): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  await kv.set(batchKey(batch.id), batch, { ex: 60 * 60 * 24 * 14 });
}

export async function getBatch(id: string): Promise<CustodyDiscoveryBatch | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<CustodyDiscoveryBatch>(batchKey(id))) ?? null;
}

export async function markBatchNotified(id: string): Promise<void> {
  const batch = await getBatch(id);
  if (!batch) return;
  await saveBatch({ ...batch, notifiedAt: new Date().toISOString() });
}
