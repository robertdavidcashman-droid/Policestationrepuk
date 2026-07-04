import { reviewFindingWithAi } from './review-pipeline';
import { getAllFindings } from './storage';
import type { CustodyNumberFinding } from './types';

export interface AiReviewBatchResult {
  reviewed: number;
  autoPublished: number;
  autoRejected: number;
  duplicatesClosed: number;
  held: number;
  skipped: number;
  evidenceFetchFailed: number;
  remainingBacklog: number;
}

function aiBatchLimit(): number {
  return Math.max(1, Number(process.env.CUSTODY_AI_BATCH_LIMIT ?? 12));
}

function isReviewable(finding: CustodyNumberFinding): boolean {
  return finding.status === 'needs_review' || finding.status === 'new';
}

function evidenceRetryLimit(): number {
  return Math.max(0, Number(process.env.CUSTODY_EVIDENCE_RETRY_LIMIT ?? 3));
}

/**
 * Reviewed but blocked only because the source page fetch failed —
 * worth re-running so a later successful fetch can unlock auto-publish.
 */
export function isWeakEvidenceRetryCandidate(finding: CustodyNumberFinding): boolean {
  const review = finding.aiReview;
  if (!review?.reviewedAt) return false;
  if (review.recommendation === 'reject') return false;
  if (review.evidence.source === 'page_fetch') return false;
  return (finding.aiEvidenceRetries ?? 0) < evidenceRetryLimit();
}

export function selectFindingsNeedingAiReview(
  findings: CustodyNumberFinding[],
  limit: number,
  opts?: { force?: boolean },
): CustodyNumberFinding[] {
  const candidates = findings.filter((f) => {
    if (!isReviewable(f)) return false;
    if (!opts?.force && f.aiReview?.reviewedAt && !isWeakEvidenceRetryCandidate(f)) return false;
    return true;
  });

  // Unreviewed first, then snippet-only (retry fetch), then approve retries, then hold.
  candidates.sort((a, b) => {
    const rank = (f: CustodyNumberFinding) => {
      if (!f.aiReview?.reviewedAt) return 0;
      if (f.aiReview.evidence.source !== 'page_fetch') return 1;
      if (f.aiReview.recommendation === 'approve') return 2;
      return 3;
    };
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
    return a.updatedAt.localeCompare(b.updatedAt);
  });

  return candidates.slice(0, limit);
}

export async function countAiReviewBacklog(): Promise<number> {
  const findings = await getAllFindings();
  return selectFindingsNeedingAiReview(findings, Number.MAX_SAFE_INTEGER).length;
}

export async function runAiReviewBatch(opts?: {
  limit?: number;
  force?: boolean;
  findingIds?: string[];
}): Promise<AiReviewBatchResult> {
  const limit = opts?.limit ?? aiBatchLimit();
  let targets: CustodyNumberFinding[];

  if (opts?.findingIds?.length) {
    const all = await getAllFindings();
    const idSet = new Set(opts.findingIds);
    targets = all.filter((f) => idSet.has(f.id)).slice(0, limit);
  } else {
    const all = await getAllFindings();
    targets = selectFindingsNeedingAiReview(all, limit, opts);
  }

  const result: AiReviewBatchResult = {
    reviewed: 0,
    autoPublished: 0,
    autoRejected: 0,
    duplicatesClosed: 0,
    held: 0,
    skipped: 0,
    evidenceFetchFailed: 0,
    remainingBacklog: 0,
  };

  for (const target of targets) {
    // Weak-evidence retry candidates already have a review; force a fresh pass.
    const force = opts?.force || isWeakEvidenceRetryCandidate(target);
    const row = await reviewFindingWithAi(target.id, { force });
    if (!row) {
      result.skipped++;
      continue;
    }
    if (row.skipped) {
      result.skipped++;
      continue;
    }

    result.reviewed++;
    if (row.evidenceSource === 'search_snippet' || row.evidenceSource === 'pdf_unfetched') {
      result.evidenceFetchFailed++;
    }

    if (row.autoAction === 'published') result.autoPublished++;
    else if (row.autoAction === 'rejected') result.autoRejected++;
    else if (row.autoAction === 'closed_duplicate') result.duplicatesClosed++;
    else result.held++;
  }

  result.remainingBacklog = await countAiReviewBacklog();
  return result;
}

export async function runAiReviewForNewFindings(
  newFindingIds: string[],
  budget: number,
): Promise<AiReviewBatchResult> {
  const ids = newFindingIds.slice(0, budget);
  const newResult = await runAiReviewBatch({ limit: ids.length, findingIds: ids });
  const remaining = Math.max(0, budget - newResult.reviewed - newResult.skipped);
  if (remaining === 0) {
    newResult.remainingBacklog = await countAiReviewBacklog();
    return newResult;
  }

  const backlogResult = await runAiReviewBatch({ limit: remaining });
  return {
    reviewed: newResult.reviewed + backlogResult.reviewed,
    autoPublished: newResult.autoPublished + backlogResult.autoPublished,
    autoRejected: newResult.autoRejected + backlogResult.autoRejected,
    duplicatesClosed: newResult.duplicatesClosed + backlogResult.duplicatesClosed,
    held: newResult.held + backlogResult.held,
    skipped: newResult.skipped + backlogResult.skipped,
    evidenceFetchFailed: newResult.evidenceFetchFailed + backlogResult.evidenceFetchFailed,
    remainingBacklog: backlogResult.remainingBacklog,
  };
}
