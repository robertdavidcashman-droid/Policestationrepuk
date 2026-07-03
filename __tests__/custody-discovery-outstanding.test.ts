import { describe, expect, it } from 'vitest';
import {
  buildOutstandingReviewSummary,
  pickOutstandingDigestItems,
} from '@/lib/custody-discovery/outstanding-queue';
import type { CustodyNumberFinding } from '@/lib/custody-discovery/types';

function finding(
  id: string,
  overrides: Partial<CustodyNumberFinding> = {},
): CustodyNumberFinding {
  return {
    id,
    custodySuiteId: 'suite-1',
    forceName: 'Kent Police',
    custodySuiteName: 'Medway Police Station',
    policeStationName: 'Medway Police Station',
    possiblePhoneNumber: '01634 123 456',
    normalizedPhoneNumber: '01634123456',
    sourceTitle: 'Custody contact',
    sourceUrl: 'https://kent.police.uk/custody',
    sourceDomain: 'kent.police.uk',
    sourceType: 'official_police',
    pageSnippet: 'Medway custody suite telephone 01634 123456',
    classification: 'direct_custody',
    confidenceScore: 85,
    confidenceLevel: 'high',
    status: 'needs_review',
    dateFound: '2025-06-01T00:00:00.000Z',
    lastChecked: '2025-06-01T00:00:00.000Z',
    hashOfSourceEvidence: 'abc',
    notes: '',
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2025-06-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('custody outstanding review queue', () => {
  it('counts open findings by AI recommendation', () => {
    const summary = buildOutstandingReviewSummary([
      finding('a', {
        aiReview: {
          recommendation: 'approve',
          aiConfidence: 95,
          whyPublish: 'Direct custody line.',
          evidence: {
            quote: 'custody 01634 123456',
            section: 'Contact',
            sourceUrl: 'https://kent.police.uk/custody',
            sourceTitle: 'Contact',
            source: 'page_fetch',
            fetchedAt: '2025-06-01T00:00:00.000Z',
          },
          publishVerified: true,
          flags: [],
          model: 'gpt-4o-mini',
          reviewedAt: '2025-06-01T00:00:00.000Z',
        },
      }),
      finding('b', {
        status: 'new',
        aiReview: {
          recommendation: 'hold',
          aiConfidence: 40,
          whyPublish: '',
          whyNot: 'Weak excerpt.',
          evidence: {
            quote: 'call 101',
            section: 'Contact',
            sourceUrl: 'https://example.com',
            sourceTitle: 'Contact',
            source: 'search_snippet',
            fetchedAt: '2025-06-01T00:00:00.000Z',
          },
          publishVerified: false,
          flags: [],
          model: 'gpt-4o-mini',
          reviewedAt: '2025-06-01T00:00:00.000Z',
        },
      }),
      finding('c', { status: 'new' }),
      finding('d', { status: 'approved' }),
    ]);

    expect(summary.total).toBe(3);
    expect(summary.aiApprove).toBe(1);
    expect(summary.aiHold).toBe(1);
    expect(summary.awaitingAi).toBe(1);
    expect(summary.officialAiApprove).toBe(1);
    expect(summary.items).toHaveLength(2);
  });

  it('prioritises AI approve findings in the digest preview', () => {
    const summary = buildOutstandingReviewSummary([
      finding('hold', {
        confidenceScore: 90,
        aiReview: {
          recommendation: 'hold',
          aiConfidence: 50,
          whyPublish: '',
          whyNot: 'Uncertain.',
          evidence: {
            quote: 'custody desk',
            section: 'Contact',
            sourceUrl: 'https://example.com',
            sourceTitle: 'Contact',
            source: 'page_fetch',
            fetchedAt: '2025-06-01T00:00:00.000Z',
          },
          publishVerified: false,
          flags: [],
          model: 'gpt-4o-mini',
          reviewedAt: '2025-06-01T00:00:00.000Z',
        },
      }),
      finding('approve', {
        confidenceScore: 70,
        aiReview: {
          recommendation: 'approve',
          aiConfidence: 90,
          whyPublish: 'Clear custody line.',
          evidence: {
            quote: 'custody 01634 123456',
            section: 'Contact',
            sourceUrl: 'https://kent.police.uk/custody',
            sourceTitle: 'Contact',
            source: 'page_fetch',
            fetchedAt: '2025-06-01T00:00:00.000Z',
          },
          publishVerified: true,
          flags: [],
          model: 'gpt-4o-mini',
          reviewedAt: '2025-06-01T00:00:00.000Z',
        },
      }),
    ]);

    const preview = pickOutstandingDigestItems(summary, 1);
    expect(preview).toHaveLength(1);
    expect(preview[0]?.finding.id).toBe('approve');
    expect(preview[0]?.actionHint).toBe('approve_first');
  });
});
