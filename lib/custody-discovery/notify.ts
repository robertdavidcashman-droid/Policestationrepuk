import { markBatchNotified, saveBatch, newBatchId, type CustodyDiscoveryBatch } from './batch';
import {
  addToDailyNotifyBucket,
  dailyNotifyDate,
  getDailyNotifyBucket,
  markDailyNotifySent,
  shouldSendDailyDigest,
  type DailyNotifyBucket,
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

async function loadQualifyingFindings(ids: string[]): Promise<CustodyNumberFinding[]> {
  return (
    await Promise.all(ids.map((id) => getFinding(id)))
  )
    .filter((f): f is CustodyNumberFinding => Boolean(f))
    .filter((f) => meetsNotifyConfidenceThreshold(f.confidenceScore));
}

async function sendDailyDigestFromBucket(opts: {
  today: string;
  bucket: DailyNotifyBucket;
  batchId: string;
  batchCursor?: number;
  batchTotal?: number;
  seededCreated?: number;
  createdAt?: string;
}): Promise<{ emailed: boolean; notifyCount: number; batchId: string }> {
  const digestFindings = await loadQualifyingFindings(opts.bucket.findingIds);

  if (digestFindings.length === 0) {
    return { emailed: false, notifyCount: 0, batchId: opts.batchId };
  }

  const digestBatch: CustodyDiscoveryBatch = {
    id: opts.batchId,
    findingIds: digestFindings.map((f) => f.id),
    stats: {
      suitesScanned: opts.bucket.suitesScanned,
      findingsCreated: digestFindings.length,
      findingsUpdated: 0,
      conflictsFlagged: opts.bucket.conflictsFlagged,
      batchCursor: opts.batchCursor ?? 0,
      batchTotal: opts.batchTotal ?? 0,
      elapsedMs: opts.bucket.elapsedMs,
      seededCreated: opts.seededCreated,
    },
    createdAt: opts.createdAt ?? new Date().toISOString(),
  };

  const emailed = await sendCustodyDiscoveryBatchEmail({
    batch: digestBatch,
    findings: digestFindings,
  });

  if (emailed) {
    await markBatchNotified(opts.batchId);
    await markDailyNotifySent(opts.today);
  }

  return { emailed, notifyCount: digestFindings.length, batchId: opts.batchId };
}

/** Send today's queued digest if the evening window is open and not yet sent. */
export async function flushPendingDailyDigest(now = new Date()): Promise<BatchNotifyResult> {
  const today = dailyNotifyDate(now);
  const bucket = await getDailyNotifyBucket(today);

  if (!bucket || bucket.findingIds.length === 0) {
    return {
      emailed: false,
      newCount: 0,
      notifyCount: 0,
      belowThresholdCount: 0,
      pendingDailyDigest: false,
      dailyDigestDate: today,
    };
  }

  if (bucket.notifiedAt) {
    return {
      emailed: false,
      newCount: 0,
      notifyCount: bucket.findingIds.length,
      belowThresholdCount: 0,
      pendingDailyDigest: false,
      dailyDigestDate: today,
    };
  }

  if (!shouldSendDailyDigest(now)) {
    return {
      emailed: false,
      newCount: 0,
      notifyCount: bucket.findingIds.length,
      belowThresholdCount: 0,
      pendingDailyDigest: true,
      dailyDigestDate: today,
    };
  }

  const { emailed, notifyCount, batchId } = await sendDailyDigestFromBucket({
    today,
    bucket,
    batchId: `digest_${today}`,
  });

  return {
    emailed,
    batchId,
    newCount: 0,
    notifyCount,
    belowThresholdCount: 0,
    pendingDailyDigest: false,
    dailyDigestDate: today,
  };
}

/** Queue qualifying findings for a once-per-day digest email (after 18:00 London). */
export async function notifyIfNewFindings(input: BatchNotifyInput): Promise<BatchNotifyResult> {
  const newCount = input.newFindingIds.length;
  if (newCount === 0) {
    return flushPendingDailyDigest();
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

  const { emailed, notifyCount } = await sendDailyDigestFromBucket({
    today,
    bucket,
    batchId: batch.id,
    batchCursor: input.stats.batchCursor,
    batchTotal: input.stats.batchTotal,
    seededCreated: input.seededCreated,
    createdAt: batch.createdAt,
  });

  return {
    emailed,
    batchId: batch.id,
    newCount,
    notifyCount,
    belowThresholdCount,
    pendingDailyDigest: false,
    dailyDigestDate: today,
  };
}
