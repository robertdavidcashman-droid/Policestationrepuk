import { describe, expect, it } from 'vitest';
import {
  buildAutoApproveDigestSummary,
  inferAutoApproveReason,
} from '@/lib/custody-discovery/auto-approve-digest';
import type { CustodyNumberFinding } from '@/lib/custody-discovery/types';

function finding(overrides: Partial<CustodyNumberFinding> = {}): CustodyNumberFinding {
  const now = '2026-07-09T12:00:00.000Z';
  return {
    id: 'f1',
    custodySuiteId: 'suite-1',
    forceName: 'Kent Police',
    custodySuiteName: 'Medway Custody',
    policeStationName: 'Medway',
    possiblePhoneNumber: '01634 123 456',
    normalizedPhoneNumber: '01634123456',
    sourceTitle: 'Contact',
    sourceUrl: 'https://www.kent.police.uk/contact',
    sourceDomain: 'kent.police.uk',
    sourceType: 'official_police',
    pageSnippet: 'Custody desk 01634 123 456',
    classification: 'direct_custody',
    confidenceScore: 90,
    confidenceLevel: 'high',
    status: 'approved',
    dateFound: now,
    lastChecked: now,
    hashOfSourceEvidence: 'abc',
    notes: '[Auto-published via official source]',
    autoPublishedAt: now,
    createdAt: now,
    updatedAt: now,
    aiReview: {
      recommendation: 'approve',
      aiConfidence: 95,
      whyPublish: 'Official Kent Police contact page lists this as the custody suite direct line.',
      evidence: {
        quote: 'Custody suite **01634 123 456**',
        section: 'Contact',
        sourceUrl: 'https://www.kent.police.uk/contact',
        sourceTitle: 'Contact',
        source: 'page_fetch',
        fetchedAt: now,
      },
      publishVerified: true,
      flags: [],
      model: 'gpt-4o-mini',
      reviewedAt: now,
    },
    ...overrides,
  };
}

describe('custody auto-approve digest', () => {
  it('infers official source reason from notes', () => {
    const result = inferAutoApproveReason(finding());
    expect(result.reason).toBe('official_source');
    expect(result.reasonLabel).toContain('Official');
  });

  it('summarises auto-published findings in the last 24h', () => {
    const now = new Date('2026-07-09T20:00:00.000Z');
    const summary = buildAutoApproveDigestSummary(
      [
        finding(),
        finding({
          id: 'f2',
          autoPublishedAt: '2026-07-07T10:00:00.000Z',
        }),
        finding({
          id: 'f3',
          status: 'rejected',
          autoRejectedAt: '2026-07-09T11:00:00.000Z',
          autoPublishedAt: undefined,
        }),
      ],
      now,
    );

    expect(summary.published).toHaveLength(1);
    expect(summary.autoRejectedLast24h).toBe(1);
    expect(summary.published[0]?.finding.id).toBe('f1');
  });
});
