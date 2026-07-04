import { describe, expect, it } from 'vitest';
import {
  shouldAutoRejectWeakEvidence,
} from '@/lib/custody-discovery/auto-decision';
import {
  pickConflictWinner,
  scoreConflictCandidate,
  sourceTrustScore,
} from '@/lib/custody-discovery/conflict-resolver';
import type { CustodyAiReview, CustodyNumberFinding } from '@/lib/custody-discovery/types';

function finding(partial: Partial<CustodyNumberFinding> = {}): CustodyNumberFinding {
  return {
    id: 'cnf_1',
    custodySuiteId: 's1',
    forceName: 'Norfolk Constabulary',
    custodySuiteName: 'Bethel Street Custody',
    policeStationName: 'Bethel Street',
    possiblePhoneNumber: '01603 276024',
    normalizedPhoneNumber: '01603276024',
    sourceTitle: 'Custody',
    sourceUrl: 'https://www.norfolk.police.uk/custody',
    sourceDomain: 'norfolk.police.uk',
    sourceType: 'official_police',
    pageSnippet: 'Bethel Street custody suite 01603 276024',
    classification: 'direct_custody',
    confidenceScore: 85,
    confidenceLevel: 'high',
    status: 'needs_review',
    dateFound: '2026-06-13',
    lastChecked: '2026-06-13',
    hashOfSourceEvidence: 'h1',
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
    whyPublish: 'Official police page lists this as the Bethel Street custody desk direct line.',
    whyNot: '',
    evidence: {
      quote: 'Bethel Street custody suite **01603 276024**',
      section: 'Custody',
      sourceUrl: 'https://www.norfolk.police.uk/custody',
      sourceTitle: 'Custody',
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

describe('shouldAutoRejectWeakEvidence', () => {
  it('auto-rejects AI approve with search snippet only', () => {
    expect(
      shouldAutoRejectWeakEvidence(
        finding(),
        review({ evidence: { ...review().evidence, source: 'search_snippet' } }),
      ),
    ).toBe(true);
  });

  it('auto-rejects rep directory hold after retries exhausted', () => {
    expect(
      shouldAutoRejectWeakEvidence(
        finding({
          sourceDomain: 'policestationrepuk.org',
          sourceUrl: 'https://policestationrepuk.org/stations/foo',
        }),
        review({
          recommendation: 'hold',
          evidence: { ...review().evidence, source: 'search_snippet' },
        }),
      ),
    ).toBe(true);
  });

  it('allows hold with snippet while retries remain', () => {
    expect(
      shouldAutoRejectWeakEvidence(
        finding({ aiEvidenceRetries: 1 }),
        review({
          recommendation: 'hold',
          evidence: { ...review().evidence, source: 'search_snippet' },
        }),
      ),
    ).toBe(false);
  });
});

describe('conflict winner selection', () => {
  it('prefers official police source over council', () => {
    const official = finding({ id: 'official' });
    const council = finding({
      id: 'council',
      sourceDomain: 'west-norfolk.gov.uk',
      sourceType: 'local_authority',
      sourceUrl: 'https://www.west-norfolk.gov.uk/custody',
      normalizedPhoneNumber: '01603999888',
      possiblePhoneNumber: '01603 999888',
    });
    const officialScore = scoreConflictCandidate(official, review(), [official, council], 'norfolk.police.uk')!;
    const councilScore = scoreConflictCandidate(
      council,
      review({
        whyPublish: 'Council page lists a custody contact number for Bethel Street suite.',
        evidence: {
          ...review().evidence,
          quote: 'Bethel Street custody **01603 999888**',
          sourceUrl: council.sourceUrl,
        },
      }),
      [official, council],
      'norfolk.police.uk',
    )!;
    expect(officialScore).toBeGreaterThan(councilScore);
    expect(sourceTrustScore(official, 'norfolk.police.uk')).toBe(100);
  });

  it('returns null when two official sources disagree equally', () => {
    const a = finding({ id: 'a', normalizedPhoneNumber: '01603276024' });
    const b = finding({
      id: 'b',
      normalizedPhoneNumber: '01603999888',
      possiblePhoneNumber: '01603 999888',
    });
    const winner = pickConflictWinner([
      { finding: a, review: review(), score: 100 },
      { finding: b, review: review(), score: 99 },
    ]);
    expect(winner).toBeNull();
  });

  it('picks clear winner when scores diverge', () => {
    const winner = pickConflictWinner([
      {
        finding: finding({ id: 'low' }),
        review: review(),
        score: 55,
      },
      {
        finding: finding({ id: 'high', sourceDomain: 'norfolk.police.uk' }),
        review: review(),
        score: 110,
      },
    ]);
    expect(winner?.finding.id).toBe('high');
  });
});
