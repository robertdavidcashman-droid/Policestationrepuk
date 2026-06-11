import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  extractPhonesFromText,
  isValidCustodyCandidate,
  normalizeUkPhone,
  hasCustodyWordingNear,
} from '@/lib/custody-discovery/phone';
import { detectSourceType, extractDomain, isOfficialSourceType } from '@/lib/custody-discovery/source-type';
import {
  confidenceLevelFromScore,
  meetsNotifyConfidenceThreshold,
  scoreConfidence,
  shouldAutoRejectFinding,
} from '@/lib/custody-discovery/confidence';
import { hashSourceEvidence } from '@/lib/custody-discovery/hash';
import { processSearchHit } from '@/lib/custody-discovery/crawler';
import { getCustodyPhoneDisplay, custodyFallbackMessage } from '@/lib/custody-discovery/display';
import { applyApprovedDiscoveryNumbers } from '@/lib/custody-discovery/overlay';
import type { CustodyNumberFinding, CustodySuite } from '@/lib/custody-discovery/types';
import type { PoliceStation } from '@/lib/types';

vi.mock('@/lib/custody-discovery/classify', () => ({
  classifyPhoneNumber: vi.fn(async () => 'direct_custody' as const),
}));

const approvedCache = new Map<string, import('@/lib/custody-discovery/types').ApprovedCustodyNumber>();

vi.mock('@/lib/custody-discovery/storage', () => ({
  getFindingByHash: vi.fn(),
  getApprovedNumber: vi.fn(),
  saveFinding: vi.fn(),
  getApprovedCache: vi.fn(async () => approvedCache),
  approveFinding: vi.fn(),
}));

import { classifyPhoneNumber } from '@/lib/custody-discovery/classify';
import { getFindingByHash, getApprovedNumber, saveFinding } from '@/lib/custody-discovery/storage';

const suite: CustodySuite = {
  id: 'suite-1',
  forceName: 'Kent Police',
  forceDomain: 'kent.police.uk',
  county: 'Kent',
  custodySuiteName: 'Medway Custody Suite',
  policeStationName: 'Medway Police Station',
  address: '1 Test Road',
  active: true,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('phone extraction and normalisation', () => {
  it('extracts UK phone numbers from snippets', () => {
    const text =
      'Medway custody suite telephone: 01634 123456 — call this custody desk for detainee welfare.';
    const phones = extractPhonesFromText(text);
    expect(phones.length).toBeGreaterThan(0);
    expect(phones[0].normalized).toMatch(/^0\d+$/);
  });

  it('normalises UK numbers and retains display formatting', () => {
    expect(normalizeUkPhone('01634 123 456')).toBeTruthy();
    expect(normalizeUkPhone('999')).toBeNull();
    expect(normalizeUkPhone('not-a-phone')).toBeNull();
  });

  it('rejects 101 and generic numbers', async () => {
    const { isGenericCustodyNumber } = await import('@/lib/custody-discovery/generic-numbers');
    expect(isValidCustodyCandidate('101')).toBe(false);
    expect(isValidCustodyCandidate('999')).toBe(false);
    expect(isGenericCustodyNumber('101')).toBe(true);
    expect(extractPhonesFromText('call 101 for custody')).toHaveLength(0);
    expect(extractPhonesFromText('custody desk 01634 123456').length).toBeGreaterThan(0);
  });
});

describe('source type detection', () => {
  it('detects official police sources', () => {
    expect(detectSourceType('https://www.kent.police.uk/contact/custody')).toBe('official_police');
    expect(detectSourceType('https://www.police.uk/a/z/forces/kent/')).toBe('police_uk');
    expect(detectSourceType('https://www.whatdotheyknow.com/request/foi')).toBe('foi');
    expect(isOfficialSourceType('official_police')).toBe(true);
  });

  it('extracts domain from URL', () => {
    expect(extractDomain('https://www.kent.police.uk/page')).toBe('kent.police.uk');
  });
});

describe('confidence scoring', () => {
  it('scores official sources higher than solicitor pages', () => {
    const official = scoreConfidence({
      sourceType: 'official_police',
      sourceUrl: 'https://kent.police.uk/custody',
      sourceTitle: 'Custody contact',
      pageSnippet: 'Medway custody suite telephone 01634 123456',
      matchingSourceCount: 1,
      sameNumberSourceCount: 1,
      isArchiveOnly: false,
      hasConflictingNumbers: false,
    });
    const solicitor = scoreConfidence({
      sourceType: 'solicitor_site',
      sourceUrl: 'https://example-solicitors.co.uk/medway',
      sourceTitle: 'Medway police station',
      pageSnippet: 'call 01634 123456',
      matchingSourceCount: 1,
      sameNumberSourceCount: 1,
      isArchiveOnly: false,
      hasConflictingNumbers: false,
    });
    expect(official).toBeGreaterThan(solicitor);
    expect(confidenceLevelFromScore(official)).toBe('medium');

    const highConfidence = scoreConfidence({
      sourceType: 'official_police',
      sourceUrl: 'https://kent.police.uk/custody',
      sourceTitle: 'Custody contact',
      pageSnippet: 'Medway custody suite telephone 01634 123456',
      matchingSourceCount: 3,
      sameNumberSourceCount: 3,
      isArchiveOnly: false,
      hasConflictingNumbers: false,
    });
    expect(confidenceLevelFromScore(highConfidence)).toBe('high');
  });

  it('only notifies when confidence is at least 30%', () => {
    expect(meetsNotifyConfidenceThreshold(29)).toBe(false);
    expect(meetsNotifyConfidenceThreshold(30)).toBe(true);
    expect(meetsNotifyConfidenceThreshold(80)).toBe(true);
  });

  it('rejects findings without source URL or very low score', () => {
    expect(shouldAutoRejectFinding(5, '')).toBe(true);
    expect(shouldAutoRejectFinding(5, 'https://example.com')).toBe(true);
    expect(shouldAutoRejectFinding(10, 'https://example.com')).toBe(false);
    expect(shouldAutoRejectFinding(85, 'https://kent.police.uk')).toBe(false);
  });

  it('stores low scores from 10% upward for admin inspection', () => {
    expect(shouldAutoRejectFinding(9, 'https://example.com')).toBe(true);
    expect(shouldAutoRejectFinding(10, 'https://example.com')).toBe(false);
  });

  it('penalises missing custody wording', () => {
    const withWording = scoreConfidence({
      sourceType: 'official_police',
      sourceUrl: 'https://kent.police.uk',
      sourceTitle: 'Contact',
      pageSnippet: 'custody suite telephone 01634 123456',
      matchingSourceCount: 1,
      sameNumberSourceCount: 1,
      isArchiveOnly: false,
      hasConflictingNumbers: false,
    });
    const withoutWording = scoreConfidence({
      sourceType: 'official_police',
      sourceUrl: 'https://kent.police.uk',
      sourceTitle: 'Contact',
      pageSnippet: 'general enquiries 01634 123456',
      matchingSourceCount: 1,
      sameNumberSourceCount: 1,
      isArchiveOnly: false,
      hasConflictingNumbers: false,
    });
    expect(withWording).toBeGreaterThan(withoutWording);
    expect(hasCustodyWordingNear('custody suite telephone')).toBe(true);
  });
});

describe('duplicate and conflict detection', () => {
  beforeEach(() => {
    vi.mocked(getFindingByHash).mockReset();
    vi.mocked(getApprovedNumber).mockReset();
    vi.mocked(saveFinding).mockReset();
    vi.mocked(classifyPhoneNumber).mockResolvedValue('direct_custody');
  });

  it('updates lastChecked for duplicate hash instead of creating new finding', async () => {
    const hash = hashSourceEvidence({
      custodySuiteId: suite.id,
      normalizedPhoneNumber: '01634123456',
      sourceUrl: 'https://kent.police.uk/custody',
      pageSnippet: 'Medway custody suite telephone 01634 123456',
    });
    const existing: CustodyNumberFinding = {
      id: 'find-1',
      custodySuiteId: suite.id,
      forceName: suite.forceName,
      custodySuiteName: suite.custodySuiteName,
      policeStationName: suite.policeStationName,
      possiblePhoneNumber: '01634 123 456',
      normalizedPhoneNumber: '01634123456',
      sourceTitle: 'Custody',
      sourceUrl: 'https://kent.police.uk/custody',
      sourceDomain: 'kent.police.uk',
      sourceType: 'official_police',
      pageSnippet: 'Medway custody suite telephone 01634 123456',
      classification: 'direct_custody',
      confidenceScore: 80,
      confidenceLevel: 'high',
      status: 'new',
      dateFound: '2025-01-01T00:00:00.000Z',
      lastChecked: '2025-01-01T00:00:00.000Z',
      hashOfSourceEvidence: hash,
      notes: '',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    vi.mocked(getFindingByHash).mockResolvedValue(existing);

    const result = await processSearchHit({
      suite,
      title: 'Custody contact',
      url: 'https://kent.police.uk/custody',
      snippet: 'Medway custody suite telephone 01634 123456',
      existingFindings: [],
    });

    expect(result.action).toBe('duplicate');
    expect(saveFinding).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'find-1', lastChecked: expect.any(String) }),
    );
  });

  it('flags conflict when approved number differs', async () => {
    vi.mocked(getFindingByHash).mockResolvedValue(null);
    vi.mocked(getApprovedNumber).mockResolvedValue({
      id: 'ap-1',
      custodySuiteId: suite.id,
      phoneNumber: '01634 999999',
      normalizedPhoneNumber: '01634999999',
      sourceFindingId: 'old',
      approvedBy: 'admin@test.com',
      approvedAt: '2025-01-01T00:00:00.000Z',
      lastVerifiedAt: '2025-01-01T00:00:00.000Z',
      publicVisible: true,
      notes: '',
    });

    const result = await processSearchHit({
      suite,
      title: 'Custody contact',
      url: 'https://kent.police.uk/custody',
      snippet: 'Medway custody suite telephone 01634 123456',
      existingFindings: [],
    });

    expect(result.action).toBe('created');
    expect(result.finding?.status).toBe('needs_review');
    expect(result.finding?.conflictReason).toBe('possible_conflict');
  });

  it('rejects findings with no source URL', async () => {
    const result = await processSearchHit({
      suite,
      title: 'No url',
      url: '',
      snippet: 'custody 01634 123456',
      existingFindings: [],
    });
    expect(result.action).toBe('rejected');
    expect(saveFinding).not.toHaveBeenCalled();
  });
});

describe('public display and approval overlay', () => {
  const baseStation: PoliceStation = {
    id: 'suite-1',
    slug: 'medway-police-station',
    name: 'Medway Police Station',
    address: '1 Test Road',
    county: 'Kent',
    forceName: 'Kent Police',
    isCustodyStation: true,
  };

  it('shows fallback when no approved number exists', () => {
    const display = getCustodyPhoneDisplay(baseStation);
    expect(display.state).toBe('fallback_101');
    expect(display.message).toContain('Direct custody number not currently verified');
    expect(display.message).toContain('Medway Police Station');
    expect(custodyFallbackMessage(baseStation)).toContain('101');
  });

  it('shows verified number after admin approval overlay', async () => {
    const approvedStation: PoliceStation = {
      ...baseStation,
      custodyPhone: '01634 123 456',
      verificationMeta: {
        custodyDiscovery: {
          status: 'verified',
          sourceFindingId: 'find-1',
          approvedAt: '2025-06-01T00:00:00.000Z',
          approvedBy: 'admin@test.com',
          source: 'autonomous_discovery',
        },
        fields: {
          custodyPhone: {
            status: 'verified',
            notes: 'Admin-approved discovery',
          },
        },
      },
    };

    const display = getCustodyPhoneDisplay(approvedStation);
    expect(display.state).toBe('verified');
    expect(display.number).toBe('01634 123 456');
  });

  it('applyApprovedDiscoveryNumbers only publishes publicVisible approved records', async () => {
    approvedCache.clear();
    approvedCache.set('suite-1', {
      id: 'ap-1',
      custodySuiteId: 'suite-1',
      stationSlug: 'medway-police-station',
      phoneNumber: '01634 555 555',
      normalizedPhoneNumber: '01634555555',
      sourceFindingId: 'find-9',
      sourceUrl: 'https://kent.police.uk/custody',
      approvedBy: 'admin@test.com',
      approvedAt: '2025-06-01T00:00:00.000Z',
      lastVerifiedAt: '2025-06-01T00:00:00.000Z',
      verificationStatus: 'verified',
      publicVisible: true,
      notes: '',
    });

    const merged = await applyApprovedDiscoveryNumbers([baseStation]);
    expect(merged[0].custodyPhone).toBe('01634 555 555');
    expect(merged[0].verificationMeta?.custodyDiscovery?.status).toBe('verified');
    expect(merged[0].verificationMeta?.custodyDiscovery?.sourceUrl).toBe(
      'https://kent.police.uk/custody',
    );
    expect(merged[0].verificationMeta?.fields?.custodyPhone?.sourceUrl).toBe(
      'https://kent.police.uk/custody',
    );
  });

  it('publishes approved unverified numbers with unverified meta', async () => {
    approvedCache.clear();
    approvedCache.set('suite-1', {
      id: 'ap-2',
      custodySuiteId: 'suite-1',
      phoneNumber: '01634 111 111',
      normalizedPhoneNumber: '01634111111',
      sourceFindingId: 'find-2',
      sourceUrl: 'https://kent.police.uk/custody',
      approvedBy: 'admin@test.com',
      approvedAt: '2025-06-01T00:00:00.000Z',
      lastVerifiedAt: '',
      verificationStatus: 'unverified',
      publicVisible: true,
      notes: '',
    });

    const merged = await applyApprovedDiscoveryNumbers([baseStation]);
    expect(merged[0].custodyPhone).toBe('01634 111 111');
    expect(merged[0].verificationMeta?.custodyDiscovery?.status).toBe('unverified');
    expect(merged[0].verificationMeta?.fields?.custodyPhone?.status).toBe('unverified');
  });
});

describe('approval verification status', () => {
  it('defaults to unverified except high confidence', async () => {
    const { resolveApprovalVerificationStatus } = await import('@/lib/custody-discovery/verification');
    const base = {
      confidenceLevel: 'medium' as const,
    } as import('@/lib/custody-discovery/types').CustodyNumberFinding;
    expect(resolveApprovalVerificationStatus({ ...base, confidenceLevel: 'medium' })).toBe('unverified');
    expect(resolveApprovalVerificationStatus({ ...base, confidenceLevel: 'high' })).toBe('verified');
    expect(resolveApprovalVerificationStatus({ ...base, confidenceLevel: 'low' }, true)).toBe('verified');
    expect(resolveApprovalVerificationStatus({ ...base, confidenceLevel: 'high' }, false)).toBe('unverified');
  });

  it('shows approved unverified number in directory display', () => {
    const station: PoliceStation = {
      id: 'suite-1',
      slug: 'medway-police-station',
      name: 'Medway Police Station',
      address: '1 Test Road',
      isCustodyStation: true,
      custodyPhone: '01634 555 555',
      verificationMeta: {
        custodyDiscovery: {
          status: 'unverified',
          sourceFindingId: 'f1',
          approvedAt: '2025-06-01T00:00:00.000Z',
          approvedBy: 'admin@test.com',
          source: 'autonomous_discovery',
        },
        fields: { custodyPhone: { status: 'unverified' } },
      },
    };
    const display = getCustodyPhoneDisplay(station);
    expect(display.state).toBe('found_unverified');
    expect(display.number).toBe('01634 555 555');
  });
});

describe('batch cursor rotation', () => {
  it('rotates sequentially without repeating suites between consecutive runs', async () => {
    const { selectSuiteBatch, resetCursorForTests } = await import('@/lib/custody-discovery/cursor');
    resetCursorForTests();
    const suites = Array.from({ length: 10 }, (_, i) => ({
      ...suite,
      id: `suite-${String(i).padStart(2, '0')}`,
      custodySuiteName: `Suite ${i}`,
    }));

    const first = await selectSuiteBatch(suites, 3);
    expect(first.batch).toHaveLength(3);
    expect(first.batchStartIndex).toBe(0);
    expect(first.nextCursor).toBe(3);
    expect(first.scannedSuiteIds).toEqual(['suite-00', 'suite-01', 'suite-02']);

    const second = await selectSuiteBatch(suites, 3);
    expect(second.batchStartIndex).toBe(3);
    expect(second.scannedSuiteIds).toEqual(['suite-03', 'suite-04', 'suite-05']);

    const overlap = first.scannedSuiteIds.filter((id) => second.scannedSuiteIds.includes(id));
    expect(overlap).toHaveLength(0);

    const third = await selectSuiteBatch(suites, 3);
    expect(third.batchStartIndex).toBe(6);
    expect(third.scannedSuiteIds).toEqual(['suite-06', 'suite-07', 'suite-08']);
  });

  it('wraps to start after covering all suites', async () => {
    const { selectSuiteBatch, resetCursorForTests } = await import('@/lib/custody-discovery/cursor');
    resetCursorForTests();
    const suites = Array.from({ length: 5 }, (_, i) => ({
      ...suite,
      id: `suite-${i}`,
      custodySuiteName: `Suite ${i}`,
    }));

    await selectSuiteBatch(suites, 2);
    await selectSuiteBatch(suites, 2);
    const third = await selectSuiteBatch(suites, 2);
    expect(third.batchStartIndex).toBe(4);
    expect(third.scannedSuiteIds[0]).toBe('suite-4');

    const fourth = await selectSuiteBatch(suites, 2);
    expect(fourth.batchStartIndex).toBe(1);
    expect(fourth.scannedSuiteIds[0]).toBe('suite-1');
  });
});

describe('official JSON seed', () => {
  it('loads committed force custody JSON files', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const dir = path.join(process.cwd(), 'data');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('-custody-numbers.json'));
    expect(files.length).toBeGreaterThan(0);
  });
});

describe('official page fallback', () => {
  it('builds candidate URLs from force domain', async () => {
    const { buildSearchQueries } = await import('@/lib/custody-discovery/search');
    const queries = buildSearchQueries(suite);
    expect(queries.some((q) => q.includes('site:kent.police.uk'))).toBe(true);
    expect(queries.some((q) => q.includes('filetype:pdf'))).toBe(true);
  });
});

describe('discovery station coverage', () => {
  it('includes every active police station, not only dedicated custody suites', async () => {
    const { getAllStations } = await import('@/lib/data');
    const { buildCustodySuitesFromStations } = await import('@/lib/custody-discovery/suites');
    const stations = await getAllStations();
    const targets = buildCustodySuitesFromStations(stations);

    expect(stations.length).toBeGreaterThan(600);
    expect(targets.length).toBe(stations.length);
    expect(targets.filter((t) => t.isDedicatedCustodySuite).length).toBeGreaterThan(50);
    expect(targets.filter((t) => !t.isDedicatedCustodySuite).length).toBeGreaterThan(500);
  });

  it('builds station-specific search queries for regular police stations', async () => {
    const { buildSearchQueries } = await import('@/lib/custody-discovery/search');
    const queries = buildSearchQueries({
      ...suite,
      forceName: 'Thames Valley Police',
      forceDomain: 'thamesvalley.police.uk',
      custodySuiteName: 'Maidenhead Police Station',
      policeStationName: 'Maidenhead Police Station',
      isDedicatedCustodySuite: false,
    });

    expect(queries.some((q) => q.includes('Maidenhead Police Station') && q.includes('custody'))).toBe(true);
    expect(queries.some((q) => q.includes('Thames Valley Police') && q.includes('Maidenhead'))).toBe(true);
    expect(queries.some((q) => q.includes('site:thamesvalley.police.uk') && q.includes('Maidenhead'))).toBe(true);
  });
});
