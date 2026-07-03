import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
  assessCorroboration,
  corroboratedThresholds,
  isTrustedCorroboratingSource,
} from '@/lib/custody-discovery/corroboration';
import { isWeakEvidenceRetryCandidate } from '@/lib/custody-discovery/ai-review-backlog';
import type {
  ApprovedCustodyNumber,
  CustodyAiReview,
  CustodyNumberFinding,
  CustodySuite,
} from '@/lib/custody-discovery/types';

/* ------------------------------------------------------------------ */
/*  Storage mock (applyAutoDecision writes through here)               */
/* ------------------------------------------------------------------ */

const savedFindings = vi.fn();
const savedApproved = vi.fn();
const rejectedIds = vi.fn();
const approveCalls = vi.fn();

let mockApproved: ApprovedCustodyNumber | null = null;
let mockSuiteFindings: CustodyNumberFinding[] = [];

vi.mock('@/lib/custody-discovery/storage', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/custody-discovery/storage')>();
  return {
    ...mod,
    getApprovedNumber: async () => mockApproved,
    getFindingsForSuite: async () => mockSuiteFindings,
    getCustodySuite: async (): Promise<CustodySuite> => ({
      id: 's1',
      stationSlug: 'bethel-street',
      forceName: 'Norfolk Constabulary',
      forceDomain: 'norfolk.police.uk',
      county: 'Norfolk',
      custodySuiteName: 'Bethel Street Custody',
      policeStationName: 'Bethel Street',
      address: '',
      active: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    }),
    saveFinding: async (f: CustodyNumberFinding) => {
      savedFindings(f);
    },
    saveApprovedNumber: async (r: ApprovedCustodyNumber) => {
      savedApproved(r);
    },
    rejectFinding: async (id: string) => {
      rejectedIds(id);
      return null;
    },
    approveFinding: async (id: string, by: string, opts?: unknown) => {
      approveCalls(id, by, opts);
      return {
        finding: finding({ id, status: 'approved' }),
        approved: approvedRecord(),
      };
    },
    invalidateApprovedCache: () => undefined,
  };
});

import { applyAutoDecision } from '@/lib/custody-discovery/auto-decision';

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

function finding(partial: Partial<CustodyNumberFinding> = {}): CustodyNumberFinding {
  return {
    id: 'cnf_main',
    custodySuiteId: 's1',
    forceName: 'Norfolk Constabulary',
    custodySuiteName: 'Bethel Street Custody',
    policeStationName: 'Bethel Street',
    possiblePhoneNumber: '01603 276024',
    normalizedPhoneNumber: '01603276024',
    sourceTitle: 'Custody contacts',
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

function review(partial: Partial<CustodyAiReview> = {}): CustodyAiReview {
  return {
    recommendation: 'approve',
    aiConfidence: 80,
    whyPublish:
      'Multiple Norfolk council pages list this as the Bethel Street custody suite direct line.',
    evidence: {
      quote: 'Bethel Street custody suite **01603 276024**',
      section: 'Custody',
      sourceUrl: 'https://www.west-norfolk.gov.uk/custody',
      sourceTitle: 'Custody contacts',
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

function approvedRecord(partial: Partial<ApprovedCustodyNumber> = {}): ApprovedCustodyNumber {
  return {
    id: 'acn_1',
    custodySuiteId: 's1',
    phoneNumber: '01603 276024',
    normalizedPhoneNumber: '01603276024',
    sourceFindingId: 'cnf_prev',
    sourceUrl: 'https://www.norfolk.police.uk/custody',
    approvedBy: 'human',
    approvedAt: '2026-01-01T00:00:00.000Z',
    lastVerifiedAt: '2026-01-01T00:00:00.000Z',
    verificationStatus: 'verified',
    publicVisible: true,
    notes: '',
    ...partial,
  };
}

beforeEach(() => {
  savedFindings.mockClear();
  savedApproved.mockClear();
  rejectedIds.mockClear();
  approveCalls.mockClear();
  mockApproved = null;
  mockSuiteFindings = [];
  process.env.CUSTODY_AI_AUTO_PUBLISH = 'true';
});

afterEach(() => {
  delete process.env.CUSTODY_AI_AUTO_PUBLISH;
});

/* ------------------------------------------------------------------ */
/*  Corroboration assessment                                           */
/* ------------------------------------------------------------------ */

describe('assessCorroboration', () => {
  it('counts independent trusted domains agreeing on the same number', () => {
    const main = finding();
    const siblings = [
      sibling('north-norfolk.gov.uk'),
      sibling('great-yarmouth.gov.uk'),
      sibling('north-norfolk.gov.uk', { id: 'cnf_dup' }), // same domain — no extra credit
    ];
    const result = assessCorroboration(main, siblings);
    expect(result.independentDomains.sort()).toEqual([
      'great-yarmouth.gov.uk',
      'north-norfolk.gov.uk',
      'west-norfolk.gov.uk',
    ]);
    expect(result.conflictingTrustedNumbers).toEqual([]);
  });

  it('ignores rejected findings and untrusted sources', () => {
    const main = finding();
    const siblings = [
      sibling('north-norfolk.gov.uk', { status: 'rejected' }),
      sibling('some-solicitors.co.uk', { sourceType: 'solicitor_site' }),
      sibling('random-blog.com', { sourceType: 'unknown' }),
    ];
    const result = assessCorroboration(main, siblings);
    expect(result.independentDomains).toEqual(['west-norfolk.gov.uk']);
  });

  it('reports conflicting numbers from trusted sources', () => {
    const main = finding();
    const siblings = [
      sibling('north-norfolk.gov.uk', {
        possiblePhoneNumber: '01603 999888',
        normalizedPhoneNumber: '01603999888',
      }),
    ];
    const result = assessCorroboration(main, siblings);
    expect(result.conflictingTrustedNumbers).toEqual(['01603999888']);
  });

  it('classifies trusted vs untrusted source types', () => {
    expect(isTrustedCorroboratingSource(finding({ sourceType: 'local_authority' }))).toBe(true);
    expect(isTrustedCorroboratingSource(finding({ sourceType: 'pcc' }))).toBe(true);
    expect(isTrustedCorroboratingSource(finding({ sourceType: 'solicitor_site' }))).toBe(false);
    expect(isTrustedCorroboratingSource(finding({ sourceType: 'archived' }))).toBe(false);
  });

  it('lowers thresholds as corroboration grows', () => {
    expect(corroboratedThresholds(2)).toEqual({ minAi: 75, minScore: 60 });
    expect(corroboratedThresholds(3)).toEqual({ minAi: 60, minScore: 45 });
  });
});

/* ------------------------------------------------------------------ */
/*  applyAutoDecision — corroborated publish path                      */
/* ------------------------------------------------------------------ */

describe('applyAutoDecision corroborated publish', () => {
  it('publishes when two independent trusted domains agree', async () => {
    mockSuiteFindings = [sibling('north-norfolk.gov.uk')];
    const result = await applyAutoDecision(finding(), review());
    expect(result).toEqual({ action: 'published', reason: 'auto_publish_corroborated' });
    // Corroborated publishes must stay unverified until an official source confirms.
    const opts = approveCalls.mock.calls[0][2] as { markVerified?: boolean };
    expect(opts.markVerified).toBe(false);
  });

  it('publishes with lower AI confidence when three domains agree', async () => {
    mockSuiteFindings = [sibling('north-norfolk.gov.uk'), sibling('great-yarmouth.gov.uk')];
    const result = await applyAutoDecision(
      finding({ confidenceScore: 50 }),
      review({ aiConfidence: 62 }),
    );
    expect(result.action).toBe('published');
  });

  it('holds when only one trusted source exists', async () => {
    const result = await applyAutoDecision(finding(), review());
    expect(result).toEqual({ action: 'queued', reason: 'insufficient_corroboration' });
  });

  it('holds when trusted sources conflict on the number', async () => {
    mockSuiteFindings = [
      sibling('north-norfolk.gov.uk'),
      sibling('great-yarmouth.gov.uk', {
        possiblePhoneNumber: '01603 999888',
        normalizedPhoneNumber: '01603999888',
      }),
    ];
    const result = await applyAutoDecision(finding(), review());
    expect(result).toEqual({ action: 'queued', reason: 'corroboration_conflict' });
  });

  it('never publishes a corroborated mobile', async () => {
    mockSuiteFindings = [
      sibling('north-norfolk.gov.uk', {
        possiblePhoneNumber: '07980 000076',
        normalizedPhoneNumber: '07980000076',
      }),
      sibling('great-yarmouth.gov.uk', {
        possiblePhoneNumber: '07980 000076',
        normalizedPhoneNumber: '07980000076',
      }),
    ];
    const mobile = finding({
      possiblePhoneNumber: '07980 000076',
      normalizedPhoneNumber: '07980000076',
      sourceType: 'pcc',
    });
    const result = await applyAutoDecision(mobile, review({ aiConfidence: 100 }));
    // PCC is official-adjacent but not isOfficialSourceType → unsafe reject does not
    // fire; the mobile is still blocked from publishing by the hard range gate.
    expect(result.action).not.toBe('published');
  });
});

/* ------------------------------------------------------------------ */
/*  applyAutoDecision — queue clearing                                 */
/* ------------------------------------------------------------------ */

describe('applyAutoDecision queue clearing', () => {
  it('closes findings that confirm the already-published number', async () => {
    mockApproved = approvedRecord();
    const result = await applyAutoDecision(finding(), review());
    expect(result).toEqual({ action: 'closed_duplicate', reason: 'confirms_published_number' });
    const saved = savedFindings.mock.calls[0][0] as CustodyNumberFinding;
    expect(saved.status).toBe('duplicate');
    // Trusted source with page evidence counts as a free re-verification.
    const bumped = savedApproved.mock.calls[0][0] as ApprovedCustodyNumber;
    expect(Date.parse(bumped.lastVerifiedAt)).toBeGreaterThan(Date.parse('2026-01-01'));
    expect(bumped.auditLog?.at(-1)?.action).toBe('corroborated');
  });

  it('does not bump verification from snippet-only duplicate evidence', async () => {
    mockApproved = approvedRecord();
    const snippetOnly = review({
      evidence: { ...review().evidence, source: 'search_snippet' },
    });
    const result = await applyAutoDecision(finding(), snippetOnly);
    expect(result.action).toBe('closed_duplicate');
    expect(savedApproved).not.toHaveBeenCalled();
  });

  it('auto-rejects mobiles from non-official sources even if AI says approve', async () => {
    const facebookMobile = finding({
      possiblePhoneNumber: '07921 282193',
      normalizedPhoneNumber: '07921282193',
      numberFlags: ['mobile_number'],
      sourceType: 'unknown',
      sourceUrl: 'https://www.facebook.com/holmfirthpolice',
      sourceDomain: 'facebook.com',
    });
    const result = await applyAutoDecision(facebookMobile, review({ aiConfidence: 95 }));
    expect(result).toEqual({ action: 'rejected', reason: 'unsafe_number_non_official' });
    expect(rejectedIds).toHaveBeenCalledWith('cnf_main');
  });

  it('keeps mobiles from official sources in the manual queue', async () => {
    const officialMobile = finding({
      possiblePhoneNumber: '07921 282193',
      normalizedPhoneNumber: '07921282193',
      numberFlags: ['mobile_number'],
      sourceType: 'official_police',
      sourceUrl: 'https://www.norfolk.police.uk/contact',
      sourceDomain: 'norfolk.police.uk',
    });
    const result = await applyAutoDecision(officialMobile, review({ aiConfidence: 95 }));
    expect(result.action).toBe('queued');
    expect(rejectedIds).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/*  Weak-evidence retry selection                                      */
/* ------------------------------------------------------------------ */

describe('weak-evidence retry', () => {
  it('selects reviewed approve findings whose page fetch failed', () => {
    const weak = finding({
      aiReview: review({ evidence: { ...review().evidence, source: 'search_snippet' } }),
    });
    expect(isWeakEvidenceRetryCandidate(weak)).toBe(true);
  });

  it('does not retry successful fetches, rejects, or exhausted retries', () => {
    const fetched = finding({ aiReview: review() });
    expect(isWeakEvidenceRetryCandidate(fetched)).toBe(false);

    const rejected = finding({
      aiReview: review({
        recommendation: 'reject',
        evidence: { ...review().evidence, source: 'search_snippet' },
      }),
    });
    expect(isWeakEvidenceRetryCandidate(rejected)).toBe(false);

    const exhausted = finding({
      aiEvidenceRetries: 3,
      aiReview: review({ evidence: { ...review().evidence, source: 'search_snippet' } }),
    });
    expect(isWeakEvidenceRetryCandidate(exhausted)).toBe(false);
  });
});
