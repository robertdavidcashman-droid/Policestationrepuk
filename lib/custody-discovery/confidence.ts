import type { ConfidenceLevel, CustodyNumberFinding, CustodySourceType } from './types';
import { hasCustodyWordingNear, isCommercialUnrelatedPage } from './phone';

export interface ConfidenceInput {
  sourceType: CustodySourceType;
  sourceUrl: string;
  sourceTitle: string;
  pageSnippet: string;
  matchingSourceCount: number;
  sameNumberSourceCount: number;
  sourceDate?: string;
  isArchiveOnly: boolean;
  hasConflictingNumbers: boolean;
}

const SOURCE_BONUS: Record<CustodySourceType, number> = {
  official_police: 40,
  police_uk: 30,
  foi: 25,
  pdf: 25,
  pcc: 15,
  local_authority: 15,
  solicitor_site: 10,
  archived: 0,
  unknown: 0,
};

export function scoreConfidence(input: ConfidenceInput): number {
  let score = 20;

  score += SOURCE_BONUS[input.sourceType] ?? 0;

  if (input.matchingSourceCount >= 2) score += 20;
  if (input.sameNumberSourceCount >= 3) score += 30;

  if (input.sourceDate) {
    const ageYears = (Date.now() - new Date(input.sourceDate).getTime()) / (365.25 * 24 * 3600 * 1000);
    if (ageYears > 3) score -= 20;
  }

  if (input.isArchiveOnly) score -= 20;
  if (input.hasConflictingNumbers) score -= 25;
  if (!hasCustodyWordingNear(input.pageSnippet)) score -= 30;
  if (isCommercialUnrelatedPage(input.sourceUrl, input.sourceTitle)) score -= 40;

  return Math.max(0, Math.min(100, score));
}

export function confidenceLevelFromScore(score: number): ConfidenceLevel {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 20) return 'low';
  return 'reject';
}

/** Minimum score (0–100) to include a finding in daily notify emails. */
export const NOTIFY_MIN_CONFIDENCE_SCORE = 30;

export function meetsNotifyConfidenceThreshold(score: number): boolean {
  return score >= NOTIFY_MIN_CONFIDENCE_SCORE;
}

export function shouldAutoRejectFinding(score: number, sourceUrl: string): boolean {
  if (!sourceUrl?.trim().startsWith('http')) return true;
  return score < 20;
}

export function findingNeedsReview(finding: CustodyNumberFinding): boolean {
  return (
    finding.status === 'new' ||
    finding.status === 'needs_review' ||
    Boolean(finding.conflictReason)
  );
}
