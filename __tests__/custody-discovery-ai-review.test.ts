import { describe, expect, it } from 'vitest';
import { validateAiReviewOutput, downgradeReviewOnValidationFailure } from '@/lib/custody-discovery/ai-review-validator';
import type { CustodyAiReview, CustodyNumberFinding } from '@/lib/custody-discovery/types';

function baseFinding(overrides: Partial<CustodyNumberFinding> = {}): CustodyNumberFinding {
  return {
    id: 'cnf_test',
    custodySuiteId: 'suite_1',
    forceName: 'Kent Police',
    custodySuiteName: 'Maidstone Custody',
    policeStationName: 'Maidstone',
    possiblePhoneNumber: '01622 690690',
    normalizedPhoneNumber: '01622690690',
    sourceTitle: 'Contact',
    sourceUrl: 'https://www.kent.police.uk/contact/',
    sourceDomain: 'kent.police.uk',
    sourceType: 'official_police',
    pageSnippet: 'Maidstone custody suite telephone 01622 690690',
    classification: 'direct_custody',
    confidenceScore: 85,
    confidenceLevel: 'high',
    status: 'needs_review',
    dateFound: '2026-06-13T10:00:00.000Z',
    lastChecked: '2026-06-13T10:00:00.000Z',
    hashOfSourceEvidence: 'hash',
    notes: '',
    createdAt: '2026-06-13T10:00:00.000Z',
    updatedAt: '2026-06-13T10:00:00.000Z',
    ...overrides,
  };
}

function baseReview(overrides: Partial<CustodyAiReview> = {}): CustodyAiReview {
  return {
    recommendation: 'approve',
    aiConfidence: 95,
    whyPublish:
      'The Maidstone custody suite section lists 01622 690690 as the direct custody desk line for this suite.',
    evidence: {
      quote:
        'Maidstone custody suite telephone **01622 690690**. Open 24 hours for solicitors.',
      section: 'Custody suites',
      sourceUrl: 'https://www.kent.police.uk/contact/',
      sourceTitle: 'Contact',
      source: 'page_fetch',
      fetchedAt: '2026-06-13T10:00:00.000Z',
    },
    publishVerified: true,
    flags: [],
    model: 'gpt-4o-mini',
    reviewedAt: '2026-06-13T10:00:00.000Z',
    ...overrides,
  };
}

describe('ai-review-validator', () => {
  it('accepts valid approve review', () => {
    const result = validateAiReviewOutput(baseFinding(), baseReview());
    expect(result.ok).toBe(true);
  });

  it('rejects when phone missing from excerpt', () => {
    const result = validateAiReviewOutput(
      baseFinding(),
      baseReview({
        evidence: {
          ...baseReview().evidence,
          quote: 'Custody suite contact details available online.',
        },
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.flags).toContain('ai_evidence_mismatch');
  });

  it('downgrades invalid review to hold', () => {
    const review = baseReview();
    const downgraded = downgradeReviewOnValidationFailure(review, ['ai_evidence_mismatch']);
    expect(downgraded.recommendation).toBe('hold');
    expect(downgraded.whyNot).toMatch(/manual review/i);
  });
});
