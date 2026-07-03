import { revalidatePath } from 'next/cache';
import { formatAiReviewNotes } from './ai-review';
import type { CustodyAiReview, CustodyNumberFinding } from './types';
import {
  assessCorroboration,
  corroboratedThresholds,
  isTrustedCorroboratingSource,
  minCorroboratingSources,
} from './corroboration';
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
  return Number(process.env.CUSTODY_AI_MIN_REJECT_CONFIDENCE ?? 90);
}

export interface AutoDecisionResult {
  action: 'published' | 'rejected' | 'queued' | 'closed_duplicate';
  reason?: string;
}

/** Findings whose number range can never be published from a non-official source. */
function isUnsafeNonOfficialNumber(finding: CustodyNumberFinding): boolean {
  const flags = finding.numberFlags ?? numberSafetyFlags(finding.normalizedPhoneNumber);
  const unsafe = flags.includes('mobile_number') || flags.includes('premium_rate');
  return unsafe && !isOfficialSourceType(finding.sourceType);
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

export async function applyAutoDecision(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
): Promise<AutoDecisionResult> {
  if (finding.status === 'approved' || finding.status === 'rejected') {
    return { action: 'queued', reason: 'already_finalized' };
  }

  // A finding that repeats the already-published number needs no human time.
  const existingApproved = await getApprovedNumber(finding.custodySuiteId);
  if (
    existingApproved?.publicVisible &&
    existingApproved.normalizedPhoneNumber === finding.normalizedPhoneNumber
  ) {
    await closeDuplicateConfirmation(finding, review);
    return { action: 'closed_duplicate', reason: 'confirms_published_number' };
  }

  // Mobiles/premium-rate from non-official sources can never publish — clear them.
  if (autoRejectEnabled() && isUnsafeNonOfficialNumber(finding)) {
    const now = new Date().toISOString();
    const notes = [
      `[Auto ${now.slice(0, 10)}] Mobile/premium-rate number from a non-official source — never publishable.`,
      formatAiReviewNotes(review),
    ].join('\n');
    await rejectFinding(finding.id, notes);
    await saveFinding({
      ...finding,
      aiReview: review,
      autoRejectedAt: now,
      notes,
      status: 'rejected',
      updatedAt: now,
    });
    return { action: 'rejected', reason: 'unsafe_number_non_official' };
  }

  if (review.recommendation === 'reject' && autoRejectEnabled()) {
    const junkClasses = new Set([
      'switchboard',
      'general_101',
      'solicitor_office',
      'victim_witness',
      'irrelevant',
    ]);
    if (
      review.aiConfidence >= minRejectConfidence() &&
      junkClasses.has(finding.classification) &&
      finding.confidenceScore < 50 &&
      !finding.conflictReason
    ) {
      const notes = formatAiReviewNotes(review);
      await rejectFinding(finding.id, notes);
      const now = new Date().toISOString();
      await saveFinding({
        ...finding,
        aiReview: review,
        autoRejectedAt: now,
        notes,
        status: 'rejected',
        updatedAt: now,
      });
      return { action: 'rejected', reason: 'auto_reject_junk' };
    }
  }

  if (review.recommendation === 'approve' && autoPublishEnabled()) {
    const suite = await getCustodySuite(finding.custodySuiteId);
    const suiteFindings = await getFindingsForSuite(finding.custodySuiteId);
    const gates = canAutoPublish(
      finding,
      review,
      existingApproved?.normalizedPhoneNumber,
      suite?.forceDomain,
      suiteFindings,
    );
    if (gates.ok) {
      const pathNote =
        gates.path === 'corroborated'
          ? '[Auto-published via multi-source corroboration]'
          : '[Auto-published via official source]';
      const notes = [pathNote, formatAiReviewNotes(review)].join('\n');
      const result = await approveFinding(finding.id, 'ai-reviewer', {
        notes,
        // Corroborated publishes stay 'unverified' until an official-domain source confirms.
        markVerified:
          gates.path === 'official' &&
          review.publishVerified &&
          finding.confidenceScore >= 80,
      });
      if (result) {
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
        return { action: 'published', reason: `auto_publish_${gates.path}` };
      }
      return { action: 'queued', reason: 'approve_failed' };
    }
    return { action: 'queued', reason: gates.reason };
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

/**
 * Non-negotiable deterministic gates shared by both publish paths.
 * These are the anti-hallucination core: safe landline range, custody
 * classification, exact number present in fetched page text, no conflicts.
 */
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

  // Path A — single official source on the force's own domain (strictest).
  const officialPath =
    isOfficialSourceType(finding.sourceType) &&
    sourceDomainIsOfficialForForce(finding.sourceDomain, forceDomain) &&
    review.aiConfidence >= minApproveConfidence() &&
    finding.confidenceScore >= AUTO_PUBLISH_MIN_RULE_SCORE;
  if (officialPath) return { ok: true, path: 'official' };

  // Path B — multiple independent trusted domains agree on the same landline.
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

  // Neither path — report the most useful blocking reason.
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
