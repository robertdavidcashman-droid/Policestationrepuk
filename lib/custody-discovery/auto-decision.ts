import { revalidatePath } from 'next/cache';
import { formatAiReviewNotes } from './ai-review';
import type { CustodyAiReview, CustodyNumberFinding } from './types';
import {
  assessCorroboration,
  corroboratedThresholds,
  isTrustedCorroboratingSource,
  minCorroboratingSources,
} from './corroboration';
import {
  deterministicRejectReason,
  isDeterministicRejectNumber,
  isRepDirectoryFinding,
  resolveHoldFinding,
} from './hold-resolver';
import { isAutoPublishableRange, numberSafetyFlags } from './number-safety';
import {
  evidenceContainsPhone,
  evidenceHasCustodyWording,
} from './source-evidence';
import { isOfficialSourceType } from './source-type';
import {
  appendAuditEntry,
  approveFinding,
  getApprovedNumber,
  getCustodySuite,
  getFindingsForSuite,
  loadAllApprovedNumbers,
  rejectFinding,
  saveApprovedNumber,
  saveFinding,
} from './storage';

export function autoPublishEnabled(): boolean {
  return process.env.CUSTODY_AI_AUTO_PUBLISH === 'true';
}

/** revalidatePath throws outside a Next request scope (e.g. operator tsx scripts). */
function safeRevalidate(path: string): void {
  try {
    revalidatePath(path);
  } catch {
    /* running outside Next — ISR revalidation not needed */
  }
}

export function autoRejectEnabled(): boolean {
  return process.env.CUSTODY_AI_AUTO_REJECT !== 'false';
}

function minApproveConfidence(): number {
  return Number(process.env.CUSTODY_AI_MIN_APPROVE_CONFIDENCE ?? 92);
}

function minRejectConfidence(): number {
  return Number(process.env.CUSTODY_AI_MIN_REJECT_CONFIDENCE ?? 85);
}

function minLowRejectConfidence(): number {
  return Number(process.env.CUSTODY_AI_LOW_REJECT_CONFIDENCE ?? 40);
}

function minRepDirectoryRejectConfidence(): number {
  return Number(process.env.CUSTODY_AI_REP_REJECT_CONFIDENCE ?? 50);
}

const JUNK_CLASSIFICATIONS = new Set([
  'switchboard',
  'general_101',
  'solicitor_office',
  'victim_witness',
  'irrelevant',
]);

/**
 * Whether an AI "reject" should auto-clear without manual review.
 * High confidence (≥85): always. Lower confidence only on safe patterns
 * (rep directories, junk classifications, untrusted sources) — never on
 * official/trusted sources where a wrong reject would drop a real number.
 */
export function shouldAutoRejectAiFinding(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
): { reject: true; reason: string; note: string } | { reject: false } {
  if (review.recommendation !== 'reject') return { reject: false };
  if (finding.conflictReason) return { reject: false };

  const conf = review.aiConfidence;

  if (conf >= minRejectConfidence()) {
    return {
      reject: true,
      reason: 'auto_reject_ai',
      note: `AI reject (${conf}%) — not a publishable custody desk line.`,
    };
  }

  if (isRepDirectoryFinding(finding)) {
    return {
      reject: true,
      reason: 'auto_reject_rep_directory',
      note: `AI reject (${conf}%) from rep/self directory (${finding.sourceDomain}) — not an authoritative source.`,
    };
  }

  if (JUNK_CLASSIFICATIONS.has(finding.classification) && conf >= minLowRejectConfidence()) {
    return {
      reject: true,
      reason: 'auto_reject_junk_classification',
      note: `AI reject (${conf}%) — classified as ${finding.classification}.`,
    };
  }

  if (
    conf >= minLowRejectConfidence() &&
    (finding.sourceType === 'solicitor_site' ||
      (finding.sourceType === 'unknown' && !isTrustedCorroboratingSource(finding)))
  ) {
    return {
      reject: true,
      reason: 'auto_reject_untrusted_source',
      note: `AI reject (${conf}%) from untrusted source (${finding.sourceType}).`,
    };
  }

  return { reject: false };
}

export interface AutoDecisionResult {
  action: 'published' | 'rejected' | 'queued' | 'closed_duplicate';
  reason?: string;
}

async function countForcePublishedSameNumber(
  forceName: string,
  normalizedPhone: string,
): Promise<number> {
  const approvedMap = await loadAllApprovedNumbers();
  let count = 0;
  for (const [suiteId, record] of approvedMap) {
    if (!record.publicVisible) continue;
    if (record.normalizedPhoneNumber !== normalizedPhone) continue;
    const suite = await getCustodySuite(suiteId);
    if (suite?.forceName === forceName) count++;
  }
  return count;
}

/** Findings whose number range can never be published from a non-official source. */
function isUnsafeNonOfficialNumber(finding: CustodyNumberFinding): boolean {
  const flags = finding.numberFlags ?? numberSafetyFlags(finding.normalizedPhoneNumber);
  const unsafe = flags.includes('mobile_number') || flags.includes('premium_rate');
  return unsafe && !isOfficialSourceType(finding.sourceType);
}

async function autoRejectFinding(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  reason: string,
  note: string,
): Promise<AutoDecisionResult> {
  const now = new Date().toISOString();
  const notes = [`[Auto ${now.slice(0, 10)}] ${note}`, formatAiReviewNotes(review)]
    .filter(Boolean)
    .join('\n');
  await rejectFinding(finding.id, notes);
  await saveFinding({
    ...finding,
    aiReview: review,
    autoRejectedAt: now,
    notes,
    status: 'rejected',
    updatedAt: now,
  });
  return { action: 'rejected', reason };
}

/**
 * Finding confirms the number already published for this suite:
 * close it as a duplicate, and if it is a fresh trusted source with real
 * page evidence, count it as a free re-verification of the published record.
 */
async function closeDuplicateConfirmation(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
): Promise<void> {
  const now = new Date().toISOString();
  await saveFinding({
    ...finding,
    aiReview: review,
    status: 'duplicate',
    notes: [`[Auto ${now.slice(0, 10)}] Confirms the already-published number for this suite.`, finding.notes]
      .filter(Boolean)
      .join('\n'),
    updatedAt: now,
  });

  if (
    isTrustedCorroboratingSource(finding) &&
    review.evidence.source === 'page_fetch' &&
    evidenceContainsPhone(review.evidence, finding.normalizedPhoneNumber)
  ) {
    const approved = await getApprovedNumber(finding.custodySuiteId);
    if (approved?.publicVisible && approved.normalizedPhoneNumber === finding.normalizedPhoneNumber) {
      const updated = appendAuditEntry(
        { ...approved, lastVerifiedAt: now },
        {
          actor: 'ai-reviewer',
          action: 'corroborated',
          detail: `Independent source confirms number: ${finding.sourceUrl}`,
        },
      );
      await saveApprovedNumber(updated);
    }
  }
}

/** Hold reviews lack whyPublish — synthesise one for corroborated auto-publish. */
function reviewForCorroboratedPublish(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
): CustodyAiReview {
  const whyPublish =
    review.whyPublish && review.whyPublish.length >= 40
      ? review.whyPublish
      : `Cross-reference: ${review.whyNot || `Multiple trusted sources agree this is the ${finding.custodySuiteName} custody desk line.`}`.slice(
          0,
          400,
        );
  return {
    ...review,
    recommendation: 'approve',
    aiConfidence: Math.max(review.aiConfidence, 60),
    whyPublish,
  };
}

async function tryAutoPublish(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  existingApproved: Awaited<ReturnType<typeof getApprovedNumber>>,
  pathLabel: 'hold_corroborated' | 'approve',
): Promise<AutoDecisionResult> {
  const suite = await getCustodySuite(finding.custodySuiteId);
  const suiteFindings = await getFindingsForSuite(finding.custodySuiteId);
  const gates = canAutoPublish(
    finding,
    review,
    existingApproved?.normalizedPhoneNumber,
    suite?.forceDomain,
    suiteFindings,
  );
  if (!gates.ok) {
    return { action: 'queued', reason: gates.reason };
  }

  const pathNote =
    gates.path === 'corroborated' || pathLabel === 'hold_corroborated'
      ? '[Auto-published via hold cross-reference / multi-source corroboration]'
      : '[Auto-published via official source]';
  const notes = [pathNote, formatAiReviewNotes(review)].join('\n');
  const result = await approveFinding(finding.id, 'ai-reviewer', {
    notes,
    markVerified:
      gates.path === 'official' &&
      review.publishVerified &&
      finding.confidenceScore >= 80,
  });
  if (!result) {
    return { action: 'queued', reason: 'approve_failed' };
  }

  const now = new Date().toISOString();
  await saveFinding({
    ...result.finding,
    aiReview: review,
    autoPublishedAt: now,
    notes,
  });
  safeRevalidate('/StationsDirectory');
  safeRevalidate('/admin/custody-number-review');
  if (result.approved.stationSlug) {
    safeRevalidate(`/police-station/${result.approved.stationSlug}`);
  }
  return {
    action: 'published',
    reason: pathLabel === 'hold_corroborated' ? 'auto_publish_hold_corroborated' : `auto_publish_${gates.path}`,
  };
}

export async function applyAutoDecision(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
): Promise<AutoDecisionResult> {
  if (finding.status === 'approved' || finding.status === 'rejected') {
    return { action: 'queued', reason: 'already_finalized' };
  }

  const existingApproved = await getApprovedNumber(finding.custodySuiteId);

  if (
    existingApproved?.publicVisible &&
    existingApproved.normalizedPhoneNumber === finding.normalizedPhoneNumber
  ) {
    await closeDuplicateConfirmation(finding, review);
    return { action: 'closed_duplicate', reason: 'confirms_published_number' };
  }

  if (autoRejectEnabled() && isUnsafeNonOfficialNumber(finding)) {
    return autoRejectFinding(
      finding,
      review,
      'unsafe_number_non_official',
      'Mobile/premium-rate number from a non-official source — never publishable.',
    );
  }

  if (autoRejectEnabled() && isDeterministicRejectNumber(finding)) {
    const kind = deterministicRejectReason(finding);
    return autoRejectFinding(
      finding,
      review,
      `deterministic_${kind}`,
      `Generic/switchboard/emergency number (${kind}) — not a custody desk line.`,
    );
  }

  // Conflicts never auto-publish or auto-reject — human review only.
  if (finding.conflictReason) {
    return { action: 'queued', reason: 'conflict' };
  }

  if (review.recommendation === 'reject' && autoRejectEnabled()) {
    const rejectGate = shouldAutoRejectAiFinding(finding, review);
    if (rejectGate.reject) {
      return autoRejectFinding(finding, review, rejectGate.reason, rejectGate.note);
    }
  }

  if (review.recommendation === 'approve' && autoPublishEnabled()) {
    return tryAutoPublish(finding, review, existingApproved, 'approve');
  }

  if (review.recommendation === 'hold') {
    const suiteFindings = await getFindingsForSuite(finding.custodySuiteId);
    const forceCount = await countForcePublishedSameNumber(
      finding.forceName,
      finding.normalizedPhoneNumber,
    );
    const resolution = resolveHoldFinding(finding, review, {
      suiteFindings,
      approvedNormalized: existingApproved?.normalizedPhoneNumber,
      forceSameNumberPublishedCount: forceCount,
    });

    switch (resolution.outcome) {
      case 'close_duplicate':
        await closeDuplicateConfirmation(finding, review);
        return { action: 'closed_duplicate', reason: 'confirms_published_number' };

      case 'reject_force_switchboard':
      case 'reject_untrusted_only':
        if (!autoRejectEnabled()) {
          return { action: 'queued', reason: resolution.outcome };
        }
        return autoRejectFinding(
          finding,
          review,
          resolution.outcome,
          resolution.detail ?? resolution.outcome,
        );

      case 'flag_conflict': {
        const now = new Date().toISOString();
        await saveFinding({
          ...finding,
          aiReview: review,
          conflictReason: 'possible_conflict',
          notes: [`[Auto ${now.slice(0, 10)}] ${resolution.detail}`, finding.notes]
            .filter(Boolean)
            .join('\n'),
          updatedAt: now,
        });
        return { action: 'queued', reason: 'hold_crossref_conflict' };
      }

      case 'publish_corroborated':
        if (!autoPublishEnabled()) {
          return { action: 'queued', reason: 'hold_corroborated_publish_disabled' };
        }
        return tryAutoPublish(
          finding,
          reviewForCorroboratedPublish(finding, review),
          existingApproved,
          'hold_corroborated',
        );

      default:
        return { action: 'queued', reason: 'needs_human' };
    }
  }

  return { action: 'queued', reason: 'needs_human' };
}

/** Auto-publish rule score floor (spec: >= 85 with an official source). */
const AUTO_PUBLISH_MIN_RULE_SCORE = 85;

function sourceDomainIsOfficialForForce(
  sourceDomain: string,
  forceDomain?: string,
): boolean {
  const src = sourceDomain.toLowerCase().replace(/^www\./, '');
  if (!src) return false;
  if (src === 'police.uk' || src.endsWith('.police.uk')) return true;
  if (forceDomain) {
    const force = forceDomain.toLowerCase().replace(/^www\./, '');
    if (force && (src === force || src.endsWith(`.${force}`))) return true;
  }
  return false;
}

export type AutoPublishGateResult =
  | { ok: true; path: 'official' | 'corroborated' }
  | { ok: false; reason: string };

function hardGates(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  approvedNormalized?: string,
): { ok: true } | { ok: false; reason: string } {
  if (!isAutoPublishableRange(finding.normalizedPhoneNumber)) {
    const flags = finding.numberFlags ?? numberSafetyFlags(finding.normalizedPhoneNumber);
    return { ok: false, reason: flags[0] ?? 'number_range_not_publishable' };
  }
  if (finding.classification !== 'direct_custody') {
    return { ok: false, reason: 'not_direct_custody' };
  }
  if (finding.conflictReason) {
    return { ok: false, reason: 'conflict' };
  }
  if (approvedNormalized && approvedNormalized !== finding.normalizedPhoneNumber) {
    return { ok: false, reason: 'different_approved_number' };
  }
  if (review.evidence.source !== 'page_fetch') {
    return { ok: false, reason: 'weak_evidence' };
  }
  if (!evidenceHasCustodyWording(review.evidence)) {
    return { ok: false, reason: 'no_custody_wording' };
  }
  if (!evidenceContainsPhone(review.evidence, finding.normalizedPhoneNumber)) {
    return { ok: false, reason: 'phone_not_in_excerpt' };
  }
  if (!review.whyPublish || review.whyPublish.length < 40) {
    return { ok: false, reason: 'why_publish_missing' };
  }
  return { ok: true };
}

function canAutoPublish(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  approvedNormalized?: string,
  forceDomain?: string,
  suiteFindings: CustodyNumberFinding[] = [],
): AutoPublishGateResult {
  const hard = hardGates(finding, review, approvedNormalized);
  if (!hard.ok) return hard;

  const officialPath =
    isOfficialSourceType(finding.sourceType) &&
    sourceDomainIsOfficialForForce(finding.sourceDomain, forceDomain) &&
    review.aiConfidence >= minApproveConfidence() &&
    finding.confidenceScore >= AUTO_PUBLISH_MIN_RULE_SCORE;
  if (officialPath) return { ok: true, path: 'official' };

  if (isTrustedCorroboratingSource(finding)) {
    const corroboration = assessCorroboration(finding, suiteFindings);
    if (corroboration.conflictingTrustedNumbers.length > 0) {
      return { ok: false, reason: 'corroboration_conflict' };
    }
    const sources = corroboration.independentDomains.length;
    if (sources >= minCorroboratingSources()) {
      const { minAi, minScore } = corroboratedThresholds(sources);
      if (review.aiConfidence >= minAi && finding.confidenceScore >= minScore) {
        return { ok: true, path: 'corroborated' };
      }
      return { ok: false, reason: 'corroborated_confidence_low' };
    }
  }

  if (!isOfficialSourceType(finding.sourceType)) {
    return { ok: false, reason: 'insufficient_corroboration' };
  }
  if (!sourceDomainIsOfficialForForce(finding.sourceDomain, forceDomain)) {
    return { ok: false, reason: 'source_domain_not_official' };
  }
  if (review.aiConfidence < minApproveConfidence()) {
    return { ok: false, reason: 'ai_confidence_low' };
  }
  return { ok: false, reason: 'rule_score_low' };
}

export { canAutoPublish };

/**
 * Re-run auto-decision gates on an existing finding (backlog cleanup).
 * Uses the stored aiReview without re-fetching source pages.
 */
export async function reapplyAutoDecision(
  finding: CustodyNumberFinding,
): Promise<AutoDecisionResult> {
  if (!finding.aiReview?.reviewedAt) {
    return { action: 'queued', reason: 'no_ai_review' };
  }
  return applyAutoDecision(finding, finding.aiReview);
}
