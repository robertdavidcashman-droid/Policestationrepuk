import { reviewFindingWithAi } from './review-pipeline';
import { getAllFindings } from './storage';
import type { CustodyNumberFinding } from './types';

export interface AiReviewBatchResult {
  reviewed: number;
  autoPublished: number;
  autoRejected: number;
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

export function selectFindingsNeedingAiReview(
  findings: CustodyNumberFinding[],
  limit: number,
  opts?: { force?: boolean },
): CustodyNumberFinding[] {
  const candidates = findings.filter((f) => {
    if (!isReviewable(f)) return false;
    if (!opts?.force && f.aiReview?.reviewedAt) return false;
    return true;
  });

  candidates.sort((a, b) => {
    const aHas = a.aiReview?.reviewedAt ? 1 : 0;
    const bHas = b.aiReview?.reviewedAt ? 1 : 0;
    if (aHas !== bHas) return aHas - bHas;
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
    held: 0,
    skipped: 0,
    evidenceFetchFailed: 0,
    remainingBacklog: 0,
  };

  for (const target of targets) {
    const row = await reviewFindingWithAi(target.id, { force: opts?.force });
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
    held: newResult.held + backlogResult.held,
    skipped: newResult.skipped + backlogResult.skipped,
    evidenceFetchFailed: newResult.evidenceFetchFailed + backlogResult.evidenceFetchFailed,
    remainingBacklog: backlogResult.remainingBacklog,
  };
}
