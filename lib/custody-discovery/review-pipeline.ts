import { formatAiReviewNotes, runAiReview } from './ai-review';
import { applyAutoDecision } from './auto-decision';
import { fetchSourceEvidence } from './source-evidence';
import { getApprovedNumber, getFinding, saveFinding } from './storage';
import type { CustodyNumberFinding } from './types';

export interface ReviewFindingResult {
  finding: CustodyNumberFinding;
  skipped: boolean;
  skipReason?: string;
  evidenceSource?: string;
  autoAction?: 'published' | 'rejected' | 'queued';
}

export async function reviewFindingWithAi(
  findingId: string,
  opts?: { force?: boolean },
): Promise<ReviewFindingResult | null> {
  const finding = await getFinding(findingId);
  if (!finding) return null;

  if (
    !opts?.force &&
    finding.aiReview?.reviewedAt &&
    (finding.status === 'approved' || finding.status === 'rejected' || finding.status === 'stale')
  ) {
    return { finding, skipped: true, skipReason: 'already_finalized' };
  }

  if (!opts?.force && finding.aiReview?.reviewedAt) {
    return { finding, skipped: true, skipReason: 'already_reviewed' };
  }

  if (finding.status !== 'needs_review' && finding.status !== 'new') {
    return { finding, skipped: true, skipReason: 'not_reviewable_status' };
  }

  const evidence = await fetchSourceEvidence(finding);
  const approved = await getApprovedNumber(finding.custodySuiteId);
  const review = await runAiReview(finding, evidence, {
    hasApprovedNumber: Boolean(approved?.publicVisible),
    approvedNumber: approved?.phoneNumber,
  });

  const notesPrefix = formatAiReviewNotes(review);
  const mergedNotes = finding.notes?.includes('[AI ')
    ? finding.notes
    : [notesPrefix, finding.notes].filter(Boolean).join('\n');

  let updated: CustodyNumberFinding = {
    ...finding,
    aiReview: review,
    notes: mergedNotes,
    updatedAt: new Date().toISOString(),
  };
  await saveFinding(updated);

  const decision = await applyAutoDecision(updated, review);
  const refreshed = (await getFinding(findingId)) ?? updated;

  return {
    finding: refreshed,
    skipped: false,
    evidenceSource: evidence.source,
    autoAction: decision.action,
  };
}
