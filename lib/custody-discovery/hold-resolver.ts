import {
  assessCorroboration,
  corroboratedThresholds,
  isTrustedCorroboratingSource,
  minCorroboratingSources,
} from './corroboration';
import { isGenericCustodyNumber } from './generic-numbers';
import { isAutoPublishableRange, numberSafetyFlags } from './number-safety';
import {
  evidenceContainsPhone,
  evidenceHasCustodyWording,
} from './source-evidence';
import type { CustodyAiReview, CustodyNumberFinding } from './types';

export type HoldResolutionOutcome =
  | 'publish_corroborated'
  | 'close_duplicate'
  | 'reject_force_switchboard'
  | 'reject_untrusted_only'
  | 'flag_conflict'
  | 'unresolved';

export interface HoldResolution {
  outcome: HoldResolutionOutcome;
  detail?: string;
}

export interface HoldResolverContext {
  suiteFindings: CustodyNumberFinding[];
  /** Normalised number already published for this suite, if any. */
  approvedNormalized?: string;
  /** How many suites in the same force have this number published. */
  forceSameNumberPublishedCount: number;
}

const REP_DIRECTORY_DOMAINS = [
  'policestationreps.com',
  'policestationrepuk.org',
  'policestationrep.com',
];

export function isRepDirectoryFinding(finding: CustodyNumberFinding): boolean {
  const domain = finding.sourceDomain.toLowerCase();
  return REP_DIRECTORY_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}

function isRepDirectory(finding: CustodyNumberFinding): boolean {
  return isRepDirectoryFinding(finding);
}

function openSiblingFindings(suiteFindings: CustodyNumberFinding[]): CustodyNumberFinding[] {
  return suiteFindings.filter(
    (f) => f.status !== 'rejected' && f.status !== 'stale' && f.status !== 'duplicate',
  );
}

/** Same suite + same normalised number from any open finding. */
function siblingsWithSameNumber(
  finding: CustodyNumberFinding,
  suiteFindings: CustodyNumberFinding[],
): CustodyNumberFinding[] {
  return openSiblingFindings(suiteFindings).filter(
    (f) => f.normalizedPhoneNumber === finding.normalizedPhoneNumber,
  );
}

function passesCorroboratedHardGates(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  approvedNormalized?: string,
): boolean {
  if (!isAutoPublishableRange(finding.normalizedPhoneNumber)) return false;
  if (finding.classification !== 'direct_custody') return false;
  if (finding.conflictReason) return false;
  if (approvedNormalized && approvedNormalized !== finding.normalizedPhoneNumber) return false;
  if (review.evidence.source !== 'page_fetch') return false;
  if (!evidenceHasCustodyWording(review.evidence)) return false;
  if (!evidenceContainsPhone(review.evidence, finding.normalizedPhoneNumber)) return false;
  return true;
}

function minForceSwitchboardSuites(): number {
  return Math.max(3, Number(process.env.CUSTODY_FORCE_SWITCHBOARD_MIN_SUITES ?? 3));
}

/**
 * Deterministic cross-reference for AI "hold" findings.
 * Uses sibling findings and force-wide published patterns already in KV — no live web.
 */
export function resolveHoldFinding(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  ctx: HoldResolverContext,
): HoldResolution {
  if (finding.conflictReason) {
    return { outcome: 'unresolved', detail: 'existing_conflict' };
  }

  if (
    ctx.approvedNormalized &&
    ctx.approvedNormalized === finding.normalizedPhoneNumber
  ) {
    return { outcome: 'close_duplicate', detail: 'confirms_published_number' };
  }

  if (ctx.forceSameNumberPublishedCount >= minForceSwitchboardSuites()) {
    return {
      outcome: 'reject_force_switchboard',
      detail: `Number published on ${ctx.forceSameNumberPublishedCount} suites in ${finding.forceName} — likely force switchboard.`,
    };
  }

  const corroboration = assessCorroboration(finding, ctx.suiteFindings);
  if (corroboration.conflictingTrustedNumbers.length > 0) {
    return {
      outcome: 'flag_conflict',
      detail: `Trusted sources disagree: also reported ${corroboration.conflictingTrustedNumbers.join(', ')}`,
    };
  }

  const sameNumberSiblings = siblingsWithSameNumber(finding, ctx.suiteFindings);
  const trustedAgreeing = sameNumberSiblings.filter(isTrustedCorroboratingSource);
  const untrustedOnly =
    sameNumberSiblings.length > 0 &&
    trustedAgreeing.length === 0 &&
    !isTrustedCorroboratingSource(finding);

  if (untrustedOnly || (isRepDirectory(finding) && corroboration.independentDomains.length < 2)) {
    const repOnly =
      isRepDirectory(finding) ||
      sameNumberSiblings.every((f) => isRepDirectory(f) || f.sourceType === 'solicitor_site');
    if (repOnly || untrustedOnly) {
      return {
        outcome: 'reject_untrusted_only',
        detail: 'Only third-party/rep-directory sources cite this number for the suite.',
      };
    }
  }

  const sources = corroboration.independentDomains.length;
  if (
    sources >= minCorroboratingSources() &&
    isTrustedCorroboratingSource(finding) &&
    passesCorroboratedHardGates(finding, review, ctx.approvedNormalized)
  ) {
    const { minScore } = corroboratedThresholds(sources);
    // Cross-reference substitutes for AI approve confidence on hold findings.
    if (finding.confidenceScore >= minScore) {
      return {
        outcome: 'publish_corroborated',
        detail: `${sources} independent trusted domains agree on ${finding.possiblePhoneNumber}.`,
      };
    }
  }

  return { outcome: 'unresolved' };
}

/** Deterministic reject for generic/switchboard/101/emergency numbers. */
export function isDeterministicRejectNumber(finding: CustodyNumberFinding): boolean {
  if (
    isGenericCustodyNumber(finding.normalizedPhoneNumber, finding.forceName) ||
    finding.classification === 'switchboard' ||
    finding.classification === 'general_101'
  ) {
    return true;
  }
  const flags = finding.numberFlags ?? numberSafetyFlags(finding.normalizedPhoneNumber);
  return flags.includes('emergency_number');
}

export function deterministicRejectReason(finding: CustodyNumberFinding): string {
  if (finding.classification === 'general_101') return 'general_101';
  if (finding.classification === 'switchboard') return 'switchboard';
  if (isGenericCustodyNumber(finding.normalizedPhoneNumber, finding.forceName)) {
    return 'generic_or_force_switchboard';
  }
  return 'emergency_number';
}
