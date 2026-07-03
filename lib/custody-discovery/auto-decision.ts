import { revalidatePath } from 'next/cache';
import { formatAiReviewNotes } from './ai-review';
import type { CustodyAiReview, CustodyNumberFinding } from './types';
import { isAutoPublishableRange, numberSafetyFlags } from './number-safety';
import {
  evidenceContainsPhone,
  evidenceHasCustodyWording,
} from './source-evidence';
import { isOfficialSourceType } from './source-type';
import {
  approveFinding,
  getApprovedNumber,
  getCustodySuite,
  rejectFinding,
  saveFinding,
} from './storage';

export function autoPublishEnabled(): boolean {
  return process.env.CUSTODY_AI_AUTO_PUBLISH === 'true';
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
  action: 'published' | 'rejected' | 'queued';
  reason?: string;
}

export async function applyAutoDecision(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
): Promise<AutoDecisionResult> {
  if (finding.status === 'approved' || finding.status === 'rejected') {
    return { action: 'queued', reason: 'already_finalized' };
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
    const approved = await getApprovedNumber(finding.custodySuiteId);
    const suite = await getCustodySuite(finding.custodySuiteId);
    const gates = canAutoPublish(
      finding,
      review,
      approved?.normalizedPhoneNumber,
      suite?.forceDomain,
    );
    if (gates.ok) {
      const notes = formatAiReviewNotes(review);
      const result = await approveFinding(finding.id, 'ai-reviewer', {
        notes,
        markVerified: review.publishVerified && finding.confidenceScore >= 80,
      });
      if (result) {
        const now = new Date().toISOString();
        await saveFinding({
          ...result.finding,
          aiReview: review,
          autoPublishedAt: now,
          notes,
        });
        revalidatePath('/StationsDirectory');
        revalidatePath('/admin/custody-number-review');
        if (result.approved.stationSlug) {
          revalidatePath(`/police-station/${result.approved.stationSlug}`);
        }
        return { action: 'published', reason: 'auto_publish' };
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

function canAutoPublish(
  finding: CustodyNumberFinding,
  review: CustodyAiReview,
  approvedNormalized?: string,
  forceDomain?: string,
): { ok: true } | { ok: false; reason: string } {
  // Never auto-publish mobiles, premium-rate, emergency, or invalid ranges.
  if (!isAutoPublishableRange(finding.normalizedPhoneNumber)) {
    const flags = finding.numberFlags ?? numberSafetyFlags(finding.normalizedPhoneNumber);
    return { ok: false, reason: flags[0] ?? 'number_range_not_publishable' };
  }
  if (review.aiConfidence < minApproveConfidence()) {
    return { ok: false, reason: 'ai_confidence_low' };
  }
  if (finding.classification !== 'direct_custody') {
    return { ok: false, reason: 'not_direct_custody' };
  }
  if (finding.confidenceScore < AUTO_PUBLISH_MIN_RULE_SCORE) {
    return { ok: false, reason: 'rule_score_low' };
  }
  if (!isOfficialSourceType(finding.sourceType)) {
    return { ok: false, reason: 'source_not_official' };
  }
  if (!sourceDomainIsOfficialForForce(finding.sourceDomain, forceDomain)) {
    return { ok: false, reason: 'source_domain_not_official' };
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

export { canAutoPublish };
