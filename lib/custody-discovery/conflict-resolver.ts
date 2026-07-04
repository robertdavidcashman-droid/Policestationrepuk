import {
  assessCorroboration,
  isTrustedCorroboratingSource,
} from './corroboration';
import { isRepDirectoryFinding } from './hold-resolver';
import { isAutoPublishableRange } from './number-safety';
import {
  evidenceContainsPhone,
  evidenceHasCustodyWording,
} from './source-evidence';
import { isOfficialSourceType } from './source-type';
import type { CustodyAiReview, CustodyNumberFinding } from './types';

/** Hard publish gates ignoring conflict flags — used to score conflict candidates. */
export function passesPublishHardGates(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  approvedNormalized?: string,
): boolean {
  if (!isAutoPublishableRange(finding.normalizedPhoneNumber)) return false;
  if (finding.classification !== 'direct_custody') return false;
  if (approvedNormalized && approvedNormalized !== finding.normalizedPhoneNumber) return false;
  if (review.evidence.source !== 'page_fetch') return false;
  if (!evidenceHasCustodyWording(review.evidence)) return false;
  if (!evidenceContainsPhone(review.evidence, finding.normalizedPhoneNumber)) return false;
  if (isRepDirectoryFinding(finding)) return false;
  return true;
}

function sourceDomainIsOfficialForForce(sourceDomain: string, forceDomain?: string): boolean {
  const src = sourceDomain.toLowerCase().replace(/^www\./, '');
  if (!src) return false;
  if (src === 'police.uk' || src.endsWith('.police.uk')) return true;
  if (forceDomain) {
    const force = forceDomain.toLowerCase().replace(/^www\./, '');
    if (force && (src === force || src.endsWith(`.${force}`))) return true;
  }
  return false;
}

/** Higher = more authoritative for conflict winner selection. */
export function sourceTrustScore(
  finding: CustodyNumberFinding,
  forceDomain?: string,
): number {
  if (isRepDirectoryFinding(finding)) return 0;
  if (sourceDomainIsOfficialForForce(finding.sourceDomain, forceDomain)) return 100;
  if (finding.sourceType === 'official_police') return 90;
  if (finding.sourceType === 'police_uk') return 85;
  if (finding.sourceType === 'foi') return 70;
  if (finding.sourceType === 'pdf') return 65;
  if (finding.sourceType === 'pcc') return 60;
  if (finding.sourceType === 'local_authority') return 55;
  if (isTrustedCorroboratingSource(finding)) return 40;
  return 5;
}

export function scoreConflictCandidate(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  suiteFindings: CustodyNumberFinding[],
  forceDomain?: string,
  approvedNormalized?: string,
): number | null {
  if (!passesPublishHardGates(finding, review, approvedNormalized)) return null;

  const corroboration = assessCorroboration(finding, suiteFindings);
  let score = sourceTrustScore(finding, forceDomain);
  score += corroboration.independentDomains.length * 15;
  score += Math.min(finding.confidenceScore, 85) * 0.15;
  score += review.aiConfidence * 0.08;

  if (score < 45) return null;
  return score;
}

export function pickConflictWinner(
  candidates: Array<{ finding: CustodyNumberFinding; review: CustodyAiReview; score: number }>,
): { finding: CustodyNumberFinding; review: CustodyAiReview } | null {
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0]!;
  const tiedOfficial = candidates.filter(
    (c) =>
      c.score >= best.score - 3 &&
      c.finding.normalizedPhoneNumber !== best.finding.normalizedPhoneNumber &&
      sourceTrustScore(c.finding) >= 85 &&
      sourceTrustScore(best.finding) >= 85,
  );
  if (tiedOfficial.length > 0) return null;

  return { finding: best.finding, review: best.review };
}

export interface SuiteConflictResolution {
  action: 'none' | 'published' | 'rejected_only';
  winningFindingId?: string;
  rejectedCount: number;
  reason?: string;
}
