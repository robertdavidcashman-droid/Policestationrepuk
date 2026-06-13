import { describe, expect, it } from 'vitest';
import { canAutoPublish } from '@/lib/custody-discovery/auto-decision';
import type { CustodyAiReview, CustodyNumberFinding } from '@/lib/custody-discovery/types';

function finding(partial: Partial<CustodyNumberFinding>): CustodyNumberFinding {
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
    confidenceScore: 85,
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

function review(partial: Partial<CustodyAiReview>): CustodyAiReview {
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

describe('canAutoPublish gates', () => {
  it('allows official high-confidence page_fetch approve', () => {
    expect(canAutoPublish(finding({}), review({})).ok).toBe(true);
  });

  it('blocks conflicts', () => {
    const result = canAutoPublish(finding({ conflictReason: 'possible_conflict' }), review({}));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('conflict');
  });

  it('blocks snippet-only evidence', () => {
    const result = canAutoPublish(
      finding({}),
      review({ evidence: { ...review({}).evidence, source: 'search_snippet' } }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('weak_evidence');
  });

  it('blocks non-official sources', () => {
    const result = canAutoPublish(finding({ sourceType: 'solicitor_site' }), review({}));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('source_not_official');
  });
});
