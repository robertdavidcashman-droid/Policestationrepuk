import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firm-outreach/storage', () => ({
  CURSOR_ENRICH: 'firmoutreach:cursor:enrich',
  setCursor: vi.fn(),
}));

describe('advanceEnrichCursor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('advances cursor by processed count after partial batch', async () => {
    const { advanceEnrichCursor } = await import('@/lib/firm-outreach/enrichment/run-enrich');
    const { setCursor } = await import('@/lib/firm-outreach/storage');

    const next = await advanceEnrichCursor(100, 10, 500);
    expect(next).toBe(110);
    expect(setCursor).toHaveBeenCalledWith('firmoutreach:cursor:enrich', 110);
  });

  it('wraps cursor to zero when batch reaches end of list', async () => {
    const { advanceEnrichCursor } = await import('@/lib/firm-outreach/enrichment/run-enrich');
    const { setCursor } = await import('@/lib/firm-outreach/storage');

    const next = await advanceEnrichCursor(490, 25, 500);
    expect(next).toBe(0);
    expect(setCursor).toHaveBeenCalledWith('firmoutreach:cursor:enrich', 0);
  });

  it('does not advance when nothing processed and cursor still in range', async () => {
    const { advanceEnrichCursor } = await import('@/lib/firm-outreach/enrichment/run-enrich');
    const { setCursor } = await import('@/lib/firm-outreach/storage');

    const next = await advanceEnrichCursor(50, 0, 500);
    expect(next).toBe(50);
    expect(setCursor).not.toHaveBeenCalled();
  });

  it('resets cursor when timed out at end of list with zero processed', async () => {
    const { advanceEnrichCursor } = await import('@/lib/firm-outreach/enrichment/run-enrich');
    const { setCursor } = await import('@/lib/firm-outreach/storage');

    const next = await advanceEnrichCursor(500, 0, 500);
    expect(next).toBe(0);
    expect(setCursor).toHaveBeenCalledWith('firmoutreach:cursor:enrich', 0);
  });
});

describe('runFirmEnrichment cursor on timeout', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('does not advance cursor when maxElapsedMs stops before any processing', async () => {
    const setCursor = vi.fn();
    const getCursor = vi.fn().mockResolvedValue(0);
    const prospect = {
      id: 'p1',
      status: 'discovered',
      priorityScore: 10,
      sources: ['laa'],
      enrichAttempts: 0,
      firmName: 'A',
      firmKey: 'a',
      prospectType: 'firm' as const,
      campaignId: 'c',
      createdAt: '',
      updatedAt: '',
      regulatoryNumber: '123',
      websiteUrl: 'https://example.co.uk',
    };

    vi.doMock('@/lib/firm-outreach/storage', () => ({
      CURSOR_ENRICH: 'firmoutreach:cursor:enrich',
      listProspectIdsByStatus: vi.fn(async (status: string) =>
        status === 'discovered' ? ['p1'] : [],
      ),
      getProspect: vi.fn().mockResolvedValue(prospect),
      saveProspect: vi.fn(),
      getCursor,
      setCursor,
    }));

    vi.doMock('@/lib/dscc-register-lookup', () => ({
      ensureDsccRegisterCache: vi.fn().mockResolvedValue({ entries: [] }),
    }));

    vi.doMock('@/lib/legal-directory/laa-fetch', () => ({
      readLaaCrimeJson: vi.fn().mockReturnValue([]),
    }));

    vi.doMock('@/lib/firm-outreach/sra-org-lookup', () => ({
      lookupSraOrganisationByName: vi.fn(),
    }));

    vi.doMock('@/lib/firm-outreach/enrichment/email-crawler', () => ({
      crawlEmailsForProspect: vi.fn().mockResolvedValue({ best: null, alternatives: [] }),
    }));

    vi.doMock('@/lib/firm-outreach/enrichment/paid-enrichment', () => ({
      paidEnrichEmails: vi.fn().mockResolvedValue([]),
    }));

    vi.doMock('@/lib/firm-outreach/crime-website-verify', () => ({
      websiteIndicatesCrimePractice: vi.fn().mockResolvedValue(false),
    }));

    const { runFirmEnrichment } = await import('@/lib/firm-outreach/enrichment/run-enrich');
    const stats = await runFirmEnrichment({ limit: 5, maxElapsedMs: 0 });

    expect(stats.processed).toBe(0);
    expect(stats.stoppedEarly).toBe(true);
    expect(setCursor).not.toHaveBeenCalled();
  });
});

describe('enrichCandidateScore', () => {
  it('prioritises LAA prospects without email and zero enrich attempts', async () => {
    const { enrichCandidateScore } = await import('@/lib/firm-outreach/enrichment/enrich-candidates');
    const laaNoEmail = enrichCandidateScore({
      id: 'a',
      firmKey: 'a',
      firmName: 'A',
      prospectType: 'firm',
      campaignId: 'c',
      sources: ['laa'],
      priorityScore: 10,
      status: 'discovered',
      enrichAttempts: 0,
      createdAt: '',
      updatedAt: '',
      sequenceStep: 0,
    });
    const archiveRetry = enrichCandidateScore({
      id: 'b',
      firmKey: 'b',
      firmName: 'B',
      prospectType: 'firm',
      campaignId: 'c',
      sources: ['archive'],
      priorityScore: 10,
      status: 'discovered',
      enrichAttempts: 3,
      createdAt: '',
      updatedAt: '',
      sequenceStep: 0,
    });
    expect(laaNoEmail).toBeGreaterThan(archiveRetry);
  });
});

describe('isPlausibleOutreachEmail wixpress junk', () => {
  it('rejects sentry.wixpress.com crawler artefacts', async () => {
    const { isPlausibleOutreachEmail } = await import('@/lib/firm-outreach/enrichment/validator');
    expect(isPlausibleOutreachEmail('2062d0a4929b45348643784b5cb39c36@sentry.wixpress.com')).toBe(false);
    expect(isPlausibleOutreachEmail('info@takkandcompanymedway.co.uk')).toBe(true);
  });
});

describe('shouldEnrichProspect', () => {
  const base = {
    id: 'p1',
    firmKey: 'k',
    firmName: 'Test',
    prospectType: 'firm' as const,
    campaignId: 'c',
    sources: ['laa'],
    priorityScore: 10,
    createdAt: '',
    updatedAt: '',
  };

  it('includes discovered prospects under max attempts', async () => {
    const { shouldEnrichProspect } = await import('@/lib/firm-outreach/enrichment/enrich-candidates');
    expect(
      shouldEnrichProspect({
        ...base,
        status: 'discovered',
        enrichAttempts: 0,
      }),
    ).toBe(true);
  });

  it('retries no_email after 30 days when attempts remain', async () => {
    const { shouldEnrichProspect } = await import('@/lib/firm-outreach/enrichment/enrich-candidates');
    const now = Date.parse('2026-06-12T12:00:00.000Z');
    const last = '2026-05-01T12:00:00.000Z';
    expect(
      shouldEnrichProspect(
        {
          ...base,
          status: 'no_email',
          enrichAttempts: 3,
          lastEnrichAttemptAt: last,
        },
        now,
      ),
    ).toBe(true);
  });

  it('skips no_email within 30-day cooldown', async () => {
    const { shouldEnrichProspect } = await import('@/lib/firm-outreach/enrichment/enrich-candidates');
    const now = Date.parse('2026-06-12T12:00:00.000Z');
    const last = '2026-06-01T12:00:00.000Z';
    expect(
      shouldEnrichProspect(
        {
          ...base,
          status: 'no_email',
          enrichAttempts: 3,
          lastEnrichAttemptAt: last,
        },
        now,
      ),
    ).toBe(false);
  });

  it('stops after max enrich attempts', async () => {
    const { shouldEnrichProspect, MAX_ENRICH_ATTEMPTS } = await import(
      '@/lib/firm-outreach/enrichment/enrich-candidates'
    );
    expect(
      shouldEnrichProspect({
        ...base,
        status: 'no_email',
        enrichAttempts: MAX_ENRICH_ATTEMPTS,
        lastEnrichAttemptAt: '2020-01-01T00:00:00.000Z',
      }),
    ).toBe(false);
  });
});
