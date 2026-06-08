import { getKV } from '@/lib/kv';
import type { AuditUnit } from './types';

const CURSOR_KEY = 'editorial-audit:cursor';
let memoryCursor = 0;

export interface AuditBatchSelection {
  batch: AuditUnit[];
  batchStartIndex: number;
  nextCursor: number;
  total: number;
  scannedUnitIds: string[];
}

/** Rotate through all audit units so cron batches eventually cover the full corpus. */
export async function selectAuditBatch(units: AuditUnit[], limit: number): Promise<AuditBatchSelection> {
  if (units.length === 0 || limit <= 0) {
    return { batch: [], batchStartIndex: 0, nextCursor: 0, total: 0, scannedUnitIds: [] };
  }

  const kv = getKV();
  let offset = 0;
  if (kv) {
    const stored = await kv.get<number>(CURSOR_KEY);
    if (typeof stored === 'number' && stored >= 0 && stored < units.length) {
      offset = stored;
    }
  } else {
    offset = memoryCursor % units.length;
  }

  const batchStartIndex = offset;
  const batch: AuditUnit[] = [];
  const seenInBatch = new Set<string>();
  const take = Math.min(limit, units.length);

  for (let i = 0; i < take; i++) {
    const unit = units[(offset + i) % units.length];
    if (seenInBatch.has(unit.id)) break;
    seenInBatch.add(unit.id);
    batch.push(unit);
  }

  const nextCursor = (offset + batch.length) % units.length;
  if (kv) {
    await kv.set(CURSOR_KEY, nextCursor);
  } else {
    memoryCursor = nextCursor;
  }

  return {
    batch,
    batchStartIndex,
    nextCursor,
    total: units.length,
    scannedUnitIds: batch.map((u) => u.id),
  };
}

/** Test helper — reset in-memory cursor when KV is unavailable. */
export function resetAuditCursorForTests(): void {
  memoryCursor = 0;
}
