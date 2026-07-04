import {
  reapplyAutoDecision,
  resolveSuiteConflicts,
} from './auto-decision';
import { isWeakEvidenceRetryCandidate } from './ai-review-backlog';
import { reviewFindingWithAi } from './review-pipeline';
import { getAllFindings, getFinding } from './storage';
import type { CustodyNumberFinding } from './types';

export interface QueueReprocessResult {
  weakEvidenceRefetched: number;
  suitesConflictResolved: number;
  conflictPublished: number;
  conflictRejected: number;
  reprocessed: number;
  published: number;
  rejected: number;
  duplicatesClosed: number;
  queued: number;
}

function isOpenReviewable(f: CustodyNumberFinding): boolean {
  return f.status === 'needs_review' || f.status === 'new';
}

function reprocessLimit(): number {
  return Math.max(1, Number(process.env.CUSTODY_QUEUE_REPROCESS_LIMIT ?? 96));
}

function weakEvidenceBatchLimit(): number {
  return Math.max(1, Number(process.env.CUSTODY_WEAK_EVIDENCE_BATCH_LIMIT ?? 24));
}

export async function runOpenQueueReprocess(opts?: {
  reprocessLimit?: number;
  weakEvidenceLimit?: number;
}): Promise<QueueReprocessResult> {
  const result: QueueReprocessResult = {
    weakEvidenceRefetched: 0,
    suitesConflictResolved: 0,
    conflictPublished: 0,
    conflictRejected: 0,
    reprocessed: 0,
    published: 0,
    rejected: 0,
    duplicatesClosed: 0,
    queued: 0,
  };

  const all = await getAllFindings();
  const open = all.filter((f) => isOpenReviewable(f) && f.aiReview?.reviewedAt);

  const weakCandidates = open
    .filter(isWeakEvidenceRetryCandidate)
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  const weakLimit = opts?.weakEvidenceLimit ?? weakEvidenceBatchLimit();

  for (const finding of weakCandidates.slice(0, weakLimit)) {
    const row = await reviewFindingWithAi(finding.id, { force: true });
    if (row && !row.skipped) result.weakEvidenceRefetched++;
  }

  const suiteMap = new Map<string, CustodyNumberFinding[]>();
  for (const f of open) {
    const list = suiteMap.get(f.custodySuiteId) ?? [];
    list.push(f);
    suiteMap.set(f.custodySuiteId, list);
  }
  const conflictSuiteIds = [...suiteMap.entries()]
    .filter(([, findings]) => {
      const numbers = new Set(findings.map((item) => item.normalizedPhoneNumber));
      return findings.some((item) => item.conflictReason) || numbers.size > 1;
    })
    .map(([id]) => id);
  for (const suiteId of conflictSuiteIds) {
    const resolution = await resolveSuiteConflicts(suiteId);
    if (resolution.action !== 'none') result.suitesConflictResolved++;
    result.conflictRejected += resolution.rejectedCount;
    if (resolution.action === 'published') result.conflictPublished++;
  }

  const refreshed = await getAllFindings();
  const toReprocess = refreshed
    .filter((f) => isOpenReviewable(f) && f.aiReview?.reviewedAt)
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));

  const limit = opts?.reprocessLimit ?? reprocessLimit();
  for (const finding of toReprocess.slice(0, limit)) {
    const latest = (await getFinding(finding.id)) ?? finding;
    if (!isOpenReviewable(latest) || !latest.aiReview?.reviewedAt) continue;
    const decision = await reapplyAutoDecision(latest);
    result.reprocessed++;
    if (decision.action === 'published') result.published++;
    else if (decision.action === 'rejected') result.rejected++;
    else if (decision.action === 'closed_duplicate') result.duplicatesClosed++;
    else result.queued++;
  }

  return result;
}
