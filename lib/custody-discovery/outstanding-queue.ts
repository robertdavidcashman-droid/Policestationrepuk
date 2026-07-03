import { meetsNotifyConfidenceThreshold } from './confidence';
import { isOfficialSourceType } from './source-type';
import type { CustodyNumberFinding } from './types';

export type OutstandingActionHint =
  | 'approve_first'
  | 'review'
  | 'likely_reject'
  | 'awaiting_ai';

export interface OutstandingReviewItem {
  finding: CustodyNumberFinding;
  priority: number;
  actionHint: OutstandingActionHint;
}

export interface OutstandingReviewSummary {
  total: number;
  inspectable: number;
  awaitingAi: number;
  aiApprove: number;
  aiHold: number;
  aiReject: number;
  conflicts: number;
  officialAiApprove: number;
  /** Sorted actionable items (AI-reviewed, still open). */
  items: OutstandingReviewItem[];
}

function isOpenFinding(finding: CustodyNumberFinding): boolean {
  return finding.status === 'needs_review' || finding.status === 'new';
}

function actionHint(finding: CustodyNumberFinding): OutstandingActionHint {
  if (!finding.aiReview?.reviewedAt) return 'awaiting_ai';
  const rec = finding.aiReview.recommendation;
  if (rec === 'approve') return 'approve_first';
  if (rec === 'reject') return 'likely_reject';
  return 'review';
}

function priorityScore(finding: CustodyNumberFinding): number {
  if (!finding.aiReview?.reviewedAt) return 0;

  let score = finding.confidenceScore;
  const rec = finding.aiReview.recommendation;

  if (rec === 'approve') score += 200;
  else if (rec === 'hold') score += 80;
  else if (rec === 'reject') score += 20;

  if (isOfficialSourceType(finding.sourceType)) score += 50;
  score += finding.aiReview.aiConfidence * 0.5;
  if (finding.conflictReason) score += 30;
  if (finding.classification === 'direct_custody') score += 25;

  return score;
}

export function buildOutstandingReviewSummary(
  findings: CustodyNumberFinding[],
): OutstandingReviewSummary {
  const open = findings.filter(isOpenFinding);
  const inspectable = open.filter((f) => meetsNotifyConfidenceThreshold(f.confidenceScore));

  const awaitingAi = open.filter((f) => !f.aiReview?.reviewedAt).length;
  const aiApprove = open.filter((f) => f.aiReview?.recommendation === 'approve').length;
  const aiHold = open.filter((f) => f.aiReview?.recommendation === 'hold').length;
  const aiReject = open.filter((f) => f.aiReview?.recommendation === 'reject').length;
  const conflicts = open.filter((f) => Boolean(f.conflictReason)).length;
  const officialAiApprove = open.filter(
    (f) =>
      f.aiReview?.recommendation === 'approve' && isOfficialSourceType(f.sourceType),
  ).length;

  const items: OutstandingReviewItem[] = open
    .filter((f) => Boolean(f.aiReview?.reviewedAt))
    .map((finding) => ({
      finding,
      priority: priorityScore(finding),
      actionHint: actionHint(finding),
    }))
    .sort((a, b) => b.priority - a.priority);

  return {
    total: open.length,
    inspectable: inspectable.length,
    awaitingAi,
    aiApprove,
    aiHold,
    aiReject,
    conflicts,
    officialAiApprove,
    items,
  };
}

export function pickOutstandingDigestItems(
  summary: OutstandingReviewSummary,
  limit = 12,
): OutstandingReviewItem[] {
  const approve = summary.items.filter((i) => i.actionHint === 'approve_first');
  const review = summary.items.filter((i) => i.actionHint === 'review');
  const likelyReject = summary.items.filter((i) => i.actionHint === 'likely_reject');

  const picked: OutstandingReviewItem[] = [];
  const push = (rows: OutstandingReviewItem[], max: number) => {
    for (const row of rows) {
      if (picked.length >= limit) return;
      if (picked.some((p) => p.finding.id === row.finding.id)) continue;
      if (picked.filter((p) => p.actionHint === row.actionHint).length >= max) continue;
      picked.push(row);
    }
  };

  push(approve, 8);
  push(review, 4);
  if (picked.length < limit) push(likelyReject, 2);

  return picked.slice(0, limit);
}
