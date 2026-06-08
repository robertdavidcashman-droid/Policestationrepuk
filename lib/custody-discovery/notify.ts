import { markBatchNotified, saveBatch, newBatchId, type CustodyDiscoveryBatch } from './batch';
import {
  addToDailyNotifyBucket,
  dailyNotifyDate,
  getDailyNotifyBucket,
  markDailyNotifySent,
  shouldSendDailyDigest,
} from './daily-notify';
import { meetsNotifyConfidenceThreshold } from './confidence';
import { sendCustodyDiscoveryBatchEmail } from './email';
import { getFinding } from './storage';
import type { CrawlerRunStats, CustodyNumberFinding } from './types';

export interface BatchNotifyInput {
  newFindingIds: string[];
  stats: CrawlerRunStats;
  seededCreated?: number;
}

export interface BatchNotifyResult {
  emailed: boolean;
  batchId?: string;
  newCount: number;
  notifyCount: number;
  belowThresholdCount: number;
  pendingDailyDigest: boolean;
  dailyDigestDate?: string;
}

/** Queue qualifying findings for a once-per-day digest email (after 18:00 London). */
export async function notifyIfNewFindings(input: BatchNotifyInput): Promise<BatchNotifyResult> {
  const newCount = input.newFindingIds.length;
  if (newCount === 0) {
    return {
      emailed: false,
      newCount: 0,
      notifyCount: 0,
      belowThresholdCount: 0,
      pendingDailyDigest: false,
    };
  }

  const findings = (
    await Promise.all(input.newFindingIds.map((id) => getFinding(id)))
  ).filter((f): f is CustodyNumberFinding => Boolean(f));

  const qualifying = findings.filter((f) => meetsNotifyConfidenceThreshold(f.confidenceScore));
  const belowThresholdCount = findings.length - qualifying.length;

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

  if (qualifying.length === 0) {
    return {
      emailed: false,
      batchId: batch.id,
      newCount,
      notifyCount: 0,
      belowThresholdCount,
      pendingDailyDigest: false,
    };
  }

  const today = dailyNotifyDate();
  const bucket = await addToDailyNotifyBucket(
    today,
    qualifying.map((f) => f.id),
    {
      suitesScanned: input.stats.suitesScanned,
      conflictsFlagged: input.stats.conflictsFlagged,
      elapsedMs: input.stats.elapsedMs,
    },
  );

  const existing = await getDailyNotifyBucket(today);
  if (existing?.notifiedAt) {
    return {
      emailed: false,
      batchId: batch.id,
      newCount,
      notifyCount: qualifying.length,
      belowThresholdCount,
      pendingDailyDigest: false,
      dailyDigestDate: today,
    };
  }

  if (!shouldSendDailyDigest()) {
    return {
      emailed: false,
      batchId: batch.id,
      newCount,
      notifyCount: qualifying.length,
      belowThresholdCount,
      pendingDailyDigest: true,
      dailyDigestDate: today,
    };
  }

  const digestFindings = (
    await Promise.all(bucket.findingIds.map((id) => getFinding(id)))
  )
    .filter((f): f is CustodyNumberFinding => Boolean(f))
    .filter((f) => meetsNotifyConfidenceThreshold(f.confidenceScore));

  if (digestFindings.length === 0) {
    return {
      emailed: false,
      batchId: batch.id,
      newCount,
      notifyCount: 0,
      belowThresholdCount,
      pendingDailyDigest: false,
      dailyDigestDate: today,
    };
  }

  const digestBatch: CustodyDiscoveryBatch = {
    id: batch.id,
    findingIds: digestFindings.map((f) => f.id),
    stats: {
      suitesScanned: bucket.suitesScanned,
      findingsCreated: digestFindings.length,
      findingsUpdated: 0,
      conflictsFlagged: bucket.conflictsFlagged,
      batchCursor: input.stats.batchCursor,
      batchTotal: input.stats.batchTotal,
      elapsedMs: bucket.elapsedMs,
      seededCreated: input.seededCreated,
    },
    createdAt: batch.createdAt,
  };

  const emailed = await sendCustodyDiscoveryBatchEmail({
    batch: digestBatch,
    findings: digestFindings,
  });

  if (emailed) {
    await markBatchNotified(batch.id);
    await markDailyNotifySent(today);
  }

  return {
    emailed,
    batchId: batch.id,
    newCount,
    notifyCount: digestFindings.length,
    belowThresholdCount,
    pendingDailyDigest: false,
    dailyDigestDate: today,
  };
}
