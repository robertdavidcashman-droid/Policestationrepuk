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
      listAllProspectIds: vi.fn().mockResolvedValue(['p1']),
      getProspect: vi.fn().mockResolvedValue(prospect),
      saveProspect: vi.fn(),
      getCursor,
      setCursor,
    }));

    vi.doMock('@/lib/firm-outreach/enrichment/resolve-prospect-website', () => ({
      resolveProspectWebsite: vi.fn(async (p: typeof prospect) => p),
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
