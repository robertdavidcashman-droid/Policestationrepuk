import { describe, expect, it } from 'vitest';
import {
  evidenceContainsPhone,
  evidenceHasCustodyWording,
} from '@/lib/custody-discovery/source-evidence';
import { selectFindingsNeedingAiReview } from '@/lib/custody-discovery/ai-review-backlog';
import type { CustodyNumberFinding } from '@/lib/custody-discovery/types';

describe('source-evidence helpers', () => {
  it('detects phone in excerpt', () => {
    expect(
      evidenceContainsPhone(
        {
          quote: 'custody desk **01622 690690**',
          section: 'Contact',
          sourceUrl: 'https://example.com',
          sourceTitle: 'Contact',
          source: 'page_fetch',
          fetchedAt: '2026-06-13',
        },
        '01622690690',
      ),
    ).toBe(true);
  });

  it('detects custody wording', () => {
    expect(
      evidenceHasCustodyWording({
        quote: 'Maidstone custody suite telephone 01622 690690',
        section: 'Contact',
        sourceUrl: 'https://example.com',
        sourceTitle: 'Contact',
        source: 'page_fetch',
        fetchedAt: '2026-06-13',
      }),
    ).toBe(true);
  });
});

describe('selectFindingsNeedingAiReview', () => {
  const base: CustodyNumberFinding = {
    id: 'a',
    custodySuiteId: 's1',
    forceName: 'Kent Police',
    custodySuiteName: 'A',
    policeStationName: 'A',
    possiblePhoneNumber: '01',
    normalizedPhoneNumber: '01',
    sourceTitle: 't',
    sourceUrl: 'https://a.com',
    sourceDomain: 'a.com',
    sourceType: 'unknown',
    pageSnippet: 'x',
    classification: 'unknown',
    confidenceScore: 50,
    confidenceLevel: 'medium',
    status: 'needs_review',
    dateFound: '2026-06-13',
    lastChecked: '2026-06-13',
    hashOfSourceEvidence: 'h',
    notes: '',
    createdAt: '2026-06-12',
    updatedAt: '2026-06-12',
  };

  const rows: CustodyNumberFinding[] = [
    base,
    {
      ...base,
      id: 'b',
      updatedAt: '2026-06-13',
      aiReview: {
        recommendation: 'hold',
        aiConfidence: 70,
        whyPublish: '',
        whyNot: 'unclear',
        evidence: {
          quote: 'custody 01',
          section: 'x',
          sourceUrl: 'https://a.com',
          sourceTitle: 't',
          source: 'search_snippet',
          fetchedAt: '2026-06-13',
        },
        publishVerified: false,
        flags: [],
        model: 'gpt-4o-mini',
        reviewedAt: '2026-06-13',
      },
    },
  ];

  it('prioritises unreviewed findings, then weak-evidence retries', () => {
    const picked = selectFindingsNeedingAiReview(rows, 5);
    // 'b' was reviewed but its page fetch failed — kept as a retry candidate.
    expect(picked).toHaveLength(2);
    expect(picked[0].id).toBe('a');
    expect(picked[1].id).toBe('b');
  });

  it('drops retry candidates once the retry budget is spent', () => {
    const exhausted = rows.map((r) => (r.id === 'b' ? { ...r, aiEvidenceRetries: 3 } : r));
    const picked = selectFindingsNeedingAiReview(exhausted, 5);
    expect(picked).toHaveLength(1);
    expect(picked[0].id).toBe('a');
  });
});
