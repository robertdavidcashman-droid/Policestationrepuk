import { describe, expect, it, vi, beforeEach } from 'vitest';
import { toE164Uk, normalizePhoneDigits } from '@/lib/phone-format';
import {
  classifyUkNumberRange,
  isAutoPublishableRange,
  numberSafetyFlags,
} from '@/lib/custody-discovery/number-safety';
import { canAutoPublish } from '@/lib/custody-discovery/auto-decision';
import {
  validateAiReviewOutput,
  downgradeReviewOnValidationFailure,
} from '@/lib/custody-discovery/ai-review-validator';
import type { CustodyAiReview, CustodyNumberFinding } from '@/lib/custody-discovery/types';

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

function finding(partial: Partial<CustodyNumberFinding> = {}): CustodyNumberFinding {
  return {
    id: 'cnf_1',
    custodySuiteId: 's1',
    forceName: 'Kent Police',
    custodySuiteName: 'Maidstone Custody',
    policeStationName: 'Maidstone',
    possiblePhoneNumber: '01622 690690',
    normalizedPhoneNumber: '01622690690',
    sourceTitle: 'Contact',
    sourceUrl: 'https://www.kent.police.uk/contact/',
    sourceDomain: 'kent.police.uk',
    sourceType: 'official_police',
    pageSnippet: 'custody',
    classification: 'direct_custody',
    confidenceScore: 90,
    confidenceLevel: 'high',
    status: 'needs_review',
    dateFound: '2026-06-13',
    lastChecked: '2026-06-13',
    hashOfSourceEvidence: 'h',
    notes: '',
    createdAt: '2026-06-13',
    updatedAt: '2026-06-13',
    ...partial,
  };
}

function review(partial: Partial<CustodyAiReview> = {}): CustodyAiReview {
  return {
    recommendation: 'approve',
    aiConfidence: 95,
    whyPublish:
      'Official Kent Police page lists this as the Maidstone custody desk line with custody wording.',
    evidence: {
      quote: 'Maidstone custody **01622 690690**',
      section: 'Custody',
      sourceUrl: 'https://www.kent.police.uk/contact/',
      sourceTitle: 'Contact',
      source: 'page_fetch',
      fetchedAt: '2026-06-13',
    },
    publishVerified: true,
    flags: [],
    model: 'gpt-4o-mini',
    reviewedAt: '2026-06-13',
    ...partial,
  };
}

/* ------------------------------------------------------------------ */
/*  Normalisation + E.164                                              */
/* ------------------------------------------------------------------ */

describe('UK number normalisation and E.164', () => {
  it('normalises +44, 0044, spaces, brackets, hyphens to the same digits', () => {
    const variants = [
      '01622 690690',
      '+44 1622 690690',
      '0044 1622 690690',
      '(01622) 690-690',
      '01622690690',
    ];
    for (const v of variants) {
      expect(normalizePhoneDigits(v)).toBe('01622690690');
    }
  });

  it('converts valid UK numbers to E.164', () => {
    expect(toE164Uk('01622 690690')).toBe('+441622690690');
    expect(toE164Uk('+44 20 7230 1212')).toBe('+442072301212');
    expect(toE164Uk('0800 405040')).toBe('+44800405040');
  });

  it('returns null E.164 for invalid lengths and short codes', () => {
    expect(toE164Uk('101')).toBeNull();
    expect(toE164Uk('0162269')).toBeNull();
    expect(toE164Uk('016226906901234')).toBeNull();
    expect(toE164Uk('not a number')).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  Range classification                                               */
/* ------------------------------------------------------------------ */

describe('UK number range safety classification', () => {
  it('classifies geographic, 03, and freephone as publishable', () => {
    expect(classifyUkNumberRange('01622 690690')).toBe('geographic');
    expect(classifyUkNumberRange('020 7230 1212')).toBe('geographic');
    expect(classifyUkNumberRange('0300 123 1212')).toBe('non_geographic_03');
    expect(classifyUkNumberRange('0800 405040')).toBe('freephone');
    expect(isAutoPublishableRange('01622 690690')).toBe(true);
    expect(isAutoPublishableRange('0300 123 1212')).toBe(true);
  });

  it('flags mobiles', () => {
    expect(classifyUkNumberRange('07980 000 076')).toBe('mobile');
    expect(numberSafetyFlags('07980 000 076')).toEqual(['mobile_number']);
    expect(isAutoPublishableRange('07980 000 076')).toBe(false);
  });

  it('flags premium-rate and personal-numbering ranges', () => {
    expect(classifyUkNumberRange('0906 123 4567')).toBe('premium');
    expect(classifyUkNumberRange('0844 123 4567')).toBe('premium');
    expect(classifyUkNumberRange('0871 123 4567')).toBe('premium');
    expect(classifyUkNumberRange('070 1234 5678')).toBe('premium');
    expect(numberSafetyFlags('0906 123 4567')).toEqual(['premium_rate']);
    expect(isAutoPublishableRange('0906 123 4567')).toBe(false);
  });

  it('flags emergency short codes and invalid formats', () => {
    expect(classifyUkNumberRange('999')).toBe('emergency');
    expect(classifyUkNumberRange('101')).toBe('emergency');
    expect(classifyUkNumberRange('12345')).toBe('invalid');
    expect(numberSafetyFlags('999')).toEqual(['emergency_number']);
    expect(numberSafetyFlags('12345')).toEqual(['invalid_length']);
  });
});

/* ------------------------------------------------------------------ */
/*  Auto-publish gates (anti-hallucination + safety)                   */
/* ------------------------------------------------------------------ */

describe('canAutoPublish hard gates', () => {
  it('never auto-publishes a mobile even with perfect AI review and score', () => {
    const mobile = finding({
      possiblePhoneNumber: '07980 000 076',
      normalizedPhoneNumber: '07980000076',
      confidenceScore: 100,
    });
    const perfect = review({
      aiConfidence: 100,
      evidence: { ...review().evidence, quote: 'Maidstone custody **07980 000 076**' },
    });
    const result = canAutoPublish(mobile, perfect, undefined, 'kent.police.uk');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('mobile_number');
  });

  it('never auto-publishes premium-rate numbers', () => {
    const premium = finding({
      possiblePhoneNumber: '0906 123 4567',
      normalizedPhoneNumber: '09061234567',
    });
    const result = canAutoPublish(premium, review(), undefined, 'kent.police.uk');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('premium_rate');
  });

  it('requires rule score >= 85', () => {
    const result = canAutoPublish(finding({ confidenceScore: 84 }), review());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('rule_score_low');
  });

  it('blocks official-typed sources hosted on non-official domains', () => {
    const foiOnThirdParty = finding({
      sourceType: 'foi',
      sourceUrl: 'https://www.whatdotheyknow.com/request/custody',
      sourceDomain: 'whatdotheyknow.com',
    });
    const result = canAutoPublish(foiOnThirdParty, review(), undefined, 'kent.police.uk');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('source_domain_not_official');
  });

  it('accepts the force official domain and .police.uk domains', () => {
    expect(canAutoPublish(finding(), review(), undefined, 'kent.police.uk').ok).toBe(true);
    const forceSite = finding({
      sourceUrl: 'https://www.devon-cornwall.police.uk/contact/custody-information',
      sourceDomain: 'devon-cornwall.police.uk',
    });
    expect(canAutoPublish(forceSite, review(), undefined, 'devon-cornwall.police.uk').ok).toBe(true);
  });

  it('never auto-publishes third-party-only evidence', () => {
    const thirdParty = finding({
      sourceType: 'solicitor_site',
      sourceUrl: 'https://www.example-solicitors.co.uk/stations',
      sourceDomain: 'example-solicitors.co.uk',
    });
    const result = canAutoPublish(thirdParty, review());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('insufficient_corroboration');
  });

  it('never overwrites a different approved number', () => {
    const result = canAutoPublish(finding(), review(), '01622111222', 'kent.police.uk');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('different_approved_number');
  });

  it('never auto-publishes when the number is missing from the fetched excerpt', () => {
    const wrongExcerpt = review({
      evidence: { ...review().evidence, quote: 'Maidstone custody desk — call our team' },
    });
    const result = canAutoPublish(finding(), wrongExcerpt, undefined, 'kent.police.uk');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('phone_not_in_excerpt');
  });
});

/* ------------------------------------------------------------------ */
/*  Hallucination rejection (AI output validation)                     */
/* ------------------------------------------------------------------ */

describe('AI hallucination guardrails', () => {
  it('downgrades AI approve when the excerpt does not contain the number', () => {
    const hallucinated = review({
      evidence: {
        ...review().evidence,
        quote: 'Contact us for custody information at Maidstone.',
      },
    });
    const validation = validateAiReviewOutput(finding(), hallucinated);
    expect(validation.ok).toBe(false);
    expect(validation.flags).toContain('ai_evidence_mismatch');

    const downgraded = downgradeReviewOnValidationFailure(hallucinated, validation.flags);
    expect(downgraded.recommendation).toBe('hold');
  });

  it('downgrades AI approve with no custody wording on a non-custody classification', () => {
    const noCustody = review({
      evidence: {
        ...review().evidence,
        quote: 'Reception desk **01622 690690** open 9-5',
      },
    });
    const validation = validateAiReviewOutput(
      finding({ classification: 'unknown' }),
      noCustody,
    );
    expect(validation.ok).toBe(false);
    expect(validation.flags).toContain('no_custody_wording_in_excerpt');
  });
});

/* ------------------------------------------------------------------ */
/*  90-day recheck logic                                               */
/* ------------------------------------------------------------------ */

const savedApproved = vi.fn();
const savedFindings = vi.fn();
const fetchPageTextMock = vi.fn();

vi.mock('@/lib/custody-discovery/source-evidence', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/custody-discovery/source-evidence')>();
  return {
    ...mod,
    fetchPageTextFromUrl: (url: string) => fetchPageTextMock(url),
  };
});

vi.mock('@/lib/custody-discovery/storage', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/custody-discovery/storage')>();
  return {
    ...mod,
    saveApprovedNumber: (r: unknown) => {
      savedApproved(r);
      return Promise.resolve();
    },
    saveFinding: (f: unknown) => {
      savedFindings(f);
      return Promise.resolve();
    },
    getFinding: async () => finding({ status: 'approved' }),
    loadAllApprovedNumbers: async () => new Map(),
    invalidateApprovedCache: () => undefined,
  };
});

import {
  isDueForRecheck,
  pageTextContainsNumber,
  recheckApprovedNumber,
} from '@/lib/custody-discovery/approved-recheck';
import type { ApprovedCustodyNumber } from '@/lib/custody-discovery/types';

function approvedRecord(partial: Partial<ApprovedCustodyNumber> = {}): ApprovedCustodyNumber {
  return {
    id: 'acn_1',
    custodySuiteId: 's1',
    phoneNumber: '01622 690690',
    normalizedPhoneNumber: '01622690690',
    sourceFindingId: 'cnf_1',
    sourceUrl: 'https://www.kent.police.uk/contact/',
    approvedBy: 'ai-reviewer',
    approvedAt: '2026-01-01T00:00:00.000Z',
    lastVerifiedAt: '2026-01-01T00:00:00.000Z',
    verificationStatus: 'verified',
    publicVisible: true,
    notes: '',
    ...partial,
  };
}

describe('approved number 90-day recheck', () => {
  beforeEach(() => {
    savedApproved.mockClear();
    savedFindings.mockClear();
    fetchPageTextMock.mockReset();
  });

  it('marks records older than 90 days as due', () => {
    const now = new Date('2026-07-03T00:00:00.000Z');
    expect(isDueForRecheck(approvedRecord(), now)).toBe(true);
    expect(
      isDueForRecheck(approvedRecord({ lastVerifiedAt: '2026-06-01T00:00:00.000Z' }), now),
    ).toBe(false);
    expect(isDueForRecheck(approvedRecord({ publicVisible: false }), now)).toBe(false);
  });

  it('matches numbers in page text regardless of formatting', () => {
    expect(pageTextContainsNumber('Custody: 01622 690 690', '01622690690')).toBe(true);
    expect(pageTextContainsNumber('Custody: (01622) 690-690', '01622690690')).toBe(true);
    expect(pageTextContainsNumber('Call 101 for enquiries', '01622690690')).toBe(false);
  });

  it('bumps lastVerifiedAt when the number is still on the source page', async () => {
    fetchPageTextMock.mockResolvedValue('Maidstone custody suite 01622 690690');
    const outcome = await recheckApprovedNumber(approvedRecord());
    expect(outcome).toBe('still_present');
    const saved = savedApproved.mock.calls[0][0] as ApprovedCustodyNumber;
    expect(Date.parse(saved.lastVerifiedAt)).toBeGreaterThan(Date.parse('2026-01-01'));
    expect(saved.auditLog?.at(-1)?.action).toBe('recheck_ok');
    expect(savedFindings).not.toHaveBeenCalled();
  });

  it('downgrades to unverified (never deletes) when the source page disappears', async () => {
    fetchPageTextMock.mockResolvedValue(null);
    const outcome = await recheckApprovedNumber(approvedRecord());
    expect(outcome).toBe('source_missing');
    const saved = savedApproved.mock.calls[0][0] as ApprovedCustodyNumber;
    expect(saved.verificationStatus).toBe('unverified');
    expect(saved.publicVisible).toBe(true);
    expect(saved.auditLog?.at(-1)?.action).toBe('recheck_source_missing');
    // Source finding reopened for human review.
    expect(savedFindings).toHaveBeenCalled();
  });

  it('flags a conflict when the page now shows a different number', async () => {
    fetchPageTextMock.mockResolvedValue('Maidstone custody suite has moved. Call 01622 111222.');
    const outcome = await recheckApprovedNumber(approvedRecord());
    expect(outcome).toBe('conflict');
    const saved = savedApproved.mock.calls[0][0] as ApprovedCustodyNumber;
    expect(saved.verificationStatus).toBe('unverified');
    expect(saved.auditLog?.at(-1)?.action).toBe('recheck_conflict');
  });

  it('skips PDF sources without altering the record', async () => {
    const outcome = await recheckApprovedNumber(
      approvedRecord({ sourceUrl: 'https://force.police.uk/custody.pdf' }),
    );
    expect(outcome).toBe('skipped_pdf');
    expect(savedApproved).not.toHaveBeenCalled();
  });
});
