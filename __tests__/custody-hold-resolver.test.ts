import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { resolveHoldFinding } from '@/lib/custody-discovery/hold-resolver';
import type { CustodyAiReview, CustodyNumberFinding } from '@/lib/custody-discovery/types';

function finding(partial: Partial<CustodyNumberFinding> = {}): CustodyNumberFinding {
  return {
    id: 'cnf_main',
    custodySuiteId: 's1',
    forceName: 'Norfolk Constabulary',
    custodySuiteName: 'Bethel Street Custody',
    policeStationName: 'Bethel Street',
    possiblePhoneNumber: '01603 276024',
    normalizedPhoneNumber: '01603276024',
    sourceTitle: 'Custody',
    sourceUrl: 'https://www.west-norfolk.gov.uk/custody',
    sourceDomain: 'west-norfolk.gov.uk',
    sourceType: 'local_authority',
    pageSnippet: 'Bethel Street custody suite 01603 276024',
    classification: 'direct_custody',
    confidenceScore: 65,
    confidenceLevel: 'medium',
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

function sibling(domain: string, partial: Partial<CustodyNumberFinding> = {}): CustodyNumberFinding {
  return finding({
    id: `cnf_${domain}`,
    sourceUrl: `https://www.${domain}/custody`,
    sourceDomain: domain,
    hashOfSourceEvidence: `h_${domain}`,
    ...partial,
  });
}

function holdReview(partial: Partial<CustodyAiReview> = {}): CustodyAiReview {
  return {
    recommendation: 'hold',
    aiConfidence: 55,
    whyPublish: '',
    whyNot: 'Ambiguous whether this is the custody desk line.',
    evidence: {
      quote: 'Bethel Street custody suite **01603 276024**',
      section: 'Custody',
      sourceUrl: 'https://www.west-norfolk.gov.uk/custody',
      sourceTitle: 'Custody',
      source: 'page_fetch',
      fetchedAt: '2026-06-13',
    },
    publishVerified: false,
    flags: [],
    model: 'gpt-4o-mini',
    reviewedAt: '2026-06-13',
    ...partial,
  };
}

describe('resolveHoldFinding', () => {
  it('returns publish_corroborated when two council domains agree', () => {
    const result = resolveHoldFinding(finding(), holdReview(), {
      suiteFindings: [sibling('north-norfolk.gov.uk')],
      forceSameNumberPublishedCount: 0,
    });
    expect(result.outcome).toBe('publish_corroborated');
  });

  it('flags conflict when trusted sources disagree', () => {
    const result = resolveHoldFinding(finding(), holdReview(), {
      suiteFindings: [
        sibling('north-norfolk.gov.uk', {
          possiblePhoneNumber: '01603 999888',
          normalizedPhoneNumber: '01603999888',
        }),
      ],
      forceSameNumberPublishedCount: 0,
    });
    expect(result.outcome).toBe('flag_conflict');
  });

  it('rejects when number is published on 3+ force suites (switchboard pattern)', () => {
    const result = resolveHoldFinding(finding(), holdReview(), {
      suiteFindings: [],
      forceSameNumberPublishedCount: 4,
    });
    expect(result.outcome).toBe('reject_force_switchboard');
  });

  it('rejects rep-directory-only sources', () => {
    const rep = finding({
      sourceType: 'unknown',
      sourceUrl: 'https://www.policestationreps.com/stations/bethel',
      sourceDomain: 'policestationreps.com',
    });
    const result = resolveHoldFinding(rep, holdReview(), {
      suiteFindings: [],
      forceSameNumberPublishedCount: 0,
    });
    expect(result.outcome).toBe('reject_untrusted_only');
  });

  it('returns unresolved for single untrusted source without rep directory pattern', () => {
    const result = resolveHoldFinding(
      finding({ sourceType: 'unknown', sourceDomain: 'random-blog.com' }),
      holdReview(),
      { suiteFindings: [], forceSameNumberPublishedCount: 0 },
    );
    expect(result.outcome).toBe('unresolved');
  });

  it('returns unresolved when existing conflictReason is set', () => {
    const result = resolveHoldFinding(
      finding({ conflictReason: 'possible_conflict' }),
      holdReview(),
      { suiteFindings: [], forceSameNumberPublishedCount: 0 },
    );
    expect(result.outcome).toBe('unresolved');
  });

  it('closes duplicate when number matches published record', () => {
    const result = resolveHoldFinding(finding(), holdReview(), {
      suiteFindings: [],
      approvedNormalized: '01603276024',
      forceSameNumberPublishedCount: 0,
    });
    expect(result.outcome).toBe('close_duplicate');
  });
});

/* ------------------------------------------------------------------ */
/*  applyAutoDecision — broad reject + deterministic generic           */
/* ------------------------------------------------------------------ */

const savedFindings = vi.fn();
const rejectedIds = vi.fn();

vi.mock('@/lib/custody-discovery/storage', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/custody-discovery/storage')>();
  return {
    ...mod,
    getApprovedNumber: async () => null,
    getFindingsForSuite: async () => [],
    getCustodySuite: async () => null,
    loadAllApprovedNumbers: async () => new Map(),
    saveFinding: async (f: CustodyNumberFinding) => {
      savedFindings(f);
    },
    rejectFinding: async (id: string) => {
      rejectedIds(id);
      return null;
    },
    approveFinding: async () => null,
    saveApprovedNumber: async () => undefined,
    invalidateApprovedCache: () => undefined,
  };
});

import { applyAutoDecision, shouldAutoRejectAiFinding } from '@/lib/custody-discovery/auto-decision';

beforeEach(() => {
  savedFindings.mockClear();
  rejectedIds.mockClear();
  process.env.CUSTODY_AI_AUTO_REJECT = 'true';
  process.env.CUSTODY_AI_AUTO_PUBLISH = 'true';
});

afterEach(() => {
  delete process.env.CUSTODY_AI_AUTO_REJECT;
  delete process.env.CUSTODY_AI_AUTO_PUBLISH;
});

describe('applyAutoDecision broad reject', () => {
  it('auto-rejects AI reject at >=85% confidence', async () => {
    const result = await applyAutoDecision(
      finding({ sourceDomain: 'policestationreps.com', sourceType: 'unknown' }),
      {
        ...holdReview(),
        recommendation: 'reject',
        aiConfidence: 90,
        whyNot: 'This is a rep directory listing, not an official custody source.',
      },
    );
    expect(result.action).toBe('rejected');
    expect(result.reason).toBe('auto_reject_ai');
  });

  it('does not auto-reject AI reject when confidence is below threshold', async () => {
    const result = await applyAutoDecision(
      finding(),
      { ...holdReview(), recommendation: 'reject', aiConfidence: 70 },
    );
    expect(result.action).toBe('queued');
  });

  it('does not auto-reject conflict findings even when AI says reject', async () => {
    const result = await applyAutoDecision(
      finding({ conflictReason: 'possible_conflict' }),
      { ...holdReview(), recommendation: 'reject', aiConfidence: 95 },
    );
    expect(result.action).toBe('queued');
    expect(result.reason).toBe('conflict');
    expect(rejectedIds).not.toHaveBeenCalled();
  });

  it('deterministically rejects 101 regardless of AI recommendation', async () => {
    const result = await applyAutoDecision(
      finding({
        possiblePhoneNumber: '101',
        normalizedPhoneNumber: '101',
        classification: 'general_101',
        sourceType: 'official_police',
      }),
      { ...holdReview(), recommendation: 'approve', aiConfidence: 100 },
    );
    expect(result.action).toBe('rejected');
    expect(result.reason).toBe('deterministic_general_101');
  });

  it('deterministically rejects known switchboard classification', async () => {
    const result = await applyAutoDecision(
      finding({ classification: 'switchboard' }),
      { ...holdReview(), recommendation: 'hold' },
    );
    expect(result.action).toBe('rejected');
    expect(result.reason).toBe('deterministic_switchboard');
  });
});

describe('shouldAutoRejectAiFinding low-confidence tier', () => {
  it('auto-rejects rep directory at any AI reject confidence', () => {
    const gate = shouldAutoRejectAiFinding(
      finding({ sourceDomain: 'policestationreps.com', sourceType: 'unknown' }),
      { ...holdReview(), recommendation: 'reject', aiConfidence: 20 },
    );
    expect(gate.reject).toBe(true);
    if (gate.reject) expect(gate.reason).toBe('auto_reject_rep_directory');
  });

  it('does not auto-reject low confidence from official police source', () => {
    const gate = shouldAutoRejectAiFinding(
      finding({
        sourceType: 'official_police',
        sourceDomain: 'kent.police.uk',
        classification: 'unknown',
      }),
      { ...holdReview(), recommendation: 'reject', aiConfidence: 75 },
    );
    expect(gate.reject).toBe(false);
  });

  it('auto-rejects unknown third-party at 40%+ AI reject', () => {
    const gate = shouldAutoRejectAiFinding(
      finding({
        sourceType: 'unknown',
        sourceDomain: 'mindwisenv.org',
        classification: 'direct_custody',
      }),
      { ...holdReview(), recommendation: 'reject', aiConfidence: 45 },
    );
    expect(gate.reject).toBe(true);
    if (gate.reject) expect(gate.reason).toBe('auto_reject_untrusted_source');
  });

  it('does not auto-reject when conflict is flagged', () => {
    const gate = shouldAutoRejectAiFinding(
      finding({ sourceDomain: 'policestationreps.com', conflictReason: 'possible_conflict' }),
      { ...holdReview(), recommendation: 'reject', aiConfidence: 95 },
    );
    expect(gate.reject).toBe(false);
  });
});
