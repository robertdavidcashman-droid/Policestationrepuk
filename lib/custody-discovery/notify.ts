import { markBatchNotified, saveBatch, newBatchId, type CustodyDiscoveryBatch } from './batch';
import { sendCustodyDiscoveryBatchEmail } from './email';
import { getFinding } from './storage';
import type { CrawlerRunStats } from './types';

export interface BatchNotifyInput {
  newFindingIds: string[];
  stats: CrawlerRunStats;
  seededCreated?: number;
}

/** Send one summary email per batch when new findings were discovered. */
export async function notifyIfNewFindings(input: BatchNotifyInput): Promise<{
  emailed: boolean;
  batchId?: string;
  newCount: number;
}> {
  const newCount = input.newFindingIds.length;
  if (newCount === 0) {
    return { emailed: false, newCount: 0 };
  }

  const batch: CustodyDiscoveryBatch = {
    id: newBatchId(),
    findingIds: input.newFindingIds,
    stats: {
      suitesScanned: input.stats.suitesScanned,
      findingsCreated: input.stats.findingsCreated,
      findingsUpdated: input.stats.findingsUpdated,
      conflictsFlagged: input.stats.conflictsFlagged,
      batchCursor: input.stats.batchCursor,
      batchTotal: input.stats.batchTotal,
      elapsedMs: input.stats.elapsedMs,
      seededCreated: input.seededCreated,
    },
    createdAt: new Date().toISOString(),
  };

  await saveBatch(batch);

  const findings = (
    await Promise.all(input.newFindingIds.map((id) => getFinding(id)))
  ).filter((f): f is NonNullable<typeof f> => Boolean(f));

  const emailed = await sendCustodyDiscoveryBatchEmail({ batch, findings });
  if (emailed) await markBatchNotified(batch.id);

  return { emailed, batchId: batch.id, newCount };
}
