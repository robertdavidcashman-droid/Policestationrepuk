import { getKV } from '@/lib/kv';
import type { CustodySuite } from './types';

const CURSOR_KEY = 'custodydiscovery:cursor';
let memoryCursor = 0;

export interface SuiteBatchSelection {
  batch: CustodySuite[];
  /** Index in the sorted active list where this batch started. */
  batchStartIndex: number;
  nextCursor: number;
  total: number;
  scannedSuiteIds: string[];
}

/** Rotate through all active suites so cron batches eventually cover the full directory. */
export async function selectSuiteBatch(
  suites: CustodySuite[],
  limit: number,
): Promise<SuiteBatchSelection> {
  const active = suites
    .filter((s) => s.active)
    .sort((a, b) => a.id.localeCompare(b.id));

  if (active.length === 0 || limit <= 0) {
    return { batch: [], batchStartIndex: 0, nextCursor: 0, total: 0, scannedSuiteIds: [] };
  }

  const kv = getKV();
  let offset = 0;
  if (kv) {
    const stored = await kv.get<number>(CURSOR_KEY);
    if (typeof stored === 'number' && stored >= 0 && stored < active.length) {
      offset = stored;
    }
  } else {
    offset = memoryCursor % active.length;
  }

  const batchStartIndex = offset;
  const batch: CustodySuite[] = [];
  const seenInBatch = new Set<string>();

  // Sequential sweep: at most one pass per suite per run (no duplicates in batch).
  const take = Math.min(limit, active.length);
  for (let i = 0; i < take; i++) {
    const suite = active[(offset + i) % active.length];
    if (seenInBatch.has(suite.id)) break;
    seenInBatch.add(suite.id);
    batch.push(suite);
  }

  const nextCursor = (offset + batch.length) % active.length;
  if (kv) {
    await kv.set(CURSOR_KEY, nextCursor);
  } else {
    memoryCursor = nextCursor;
  }

  return {
    batch,
    batchStartIndex,
    nextCursor,
    total: active.length,
    scannedSuiteIds: batch.map((s) => s.id),
  };
}

/** Test helper — reset cursor in memory and KV so tests are isolated. */
export async function resetCursorForTests(): Promise<void> {
  memoryCursor = 0;
  const kv = getKV();
  if (kv) {
    await kv.del(CURSOR_KEY);
  }
}
