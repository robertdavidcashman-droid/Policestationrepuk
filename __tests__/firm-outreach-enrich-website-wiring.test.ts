import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * Regression for the firm/solicitor email-discovery gap: enrichment must run
 * Serper homepage discovery (resolveProspectWebsite → discoverFirmWebsiteViaSerper)
 * when the SRA register has no website, then crawl that site, find an email and
 * move the prospect to ready_to_send. Previously resolveProspectWebsite was never
 * called, so any prospect without an SRA-listed website produced no email.
 */
describe('enrichment wires Serper website discovery before crawl', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('resolves website via Serper when SRA has none, crawls an email, sets ready_to_send', async () => {
    const prospect = {
      id: 'p1',
      prospectType: 'firm' as const,
      firmName: 'Acme Law',
      firmKey: 'acme-law',
      town: 'Leeds',
      sources: ['laa'],
      status: 'discovered',
      priorityScore: 10,
      sequenceStep: 0,
      campaignId: 'c',
      createdAt: '',
      updatedAt: '',
      enrichAttempts: 0,
    };

    let saved: Record<string, unknown> | undefined;
    const saveProspect = vi.fn(async (p: Record<string, unknown>) => {
      saved = { ...p };
    });

    vi.doMock('@/lib/firm-outreach/storage', () => ({
      CURSOR_ENRICH: 'firmoutreach:cursor:enrich',
      enrichCursorKey: (campaignId: string) => `firmoutreach:cursor:enrich:${campaignId}`,
      getCursor: vi.fn().mockResolvedValue(0),
      setCursor: vi.fn(),
      listProspectIdsByStatus: vi.fn().mockImplementation(async (status: string) =>
        status === 'discovered' ? ['p1'] : [],
      ),
      listProspectIdsByRecordStatus: vi.fn().mockImplementation(async (status: string) =>
        status === 'discovered' ? ['p1'] : [],
      ),
      getProspectsByIds: vi
        .fn()
        .mockImplementation(async (ids: string[]) =>
          new Map(ids.filter((id) => id === 'p1').map((id) => [id, structuredClone(prospect)])),
        ),
      getProspect: vi.fn().mockImplementation(async () => structuredClone(prospect)),
      saveProspect,
      isDuplicateInitialSend: vi.fn().mockResolvedValue(false),
    }));

    vi.doMock('@/lib/dscc-register-lookup', () => ({
      ensureDsccRegisterCache: vi.fn().mockResolvedValue({ entries: [] }),
    }));
    vi.doMock('@/lib/legal-directory/laa-fetch', () => ({
      readLaaCrimeJson: vi.fn().mockReturnValue([]),
    }));

    // SRA register returns no organisation (so no website from the register).
    vi.doMock('@/lib/firm-outreach/sra-org-lookup', () => ({
      lookupSraOrganisationByName: vi
        .fn()
        .mockResolvedValue({ found: false, matched: false, organisation: null }),
    }));

    // Serper discovery finds the firm homepage.
    const discoverFirmWebsiteViaSerper = vi.fn().mockResolvedValue('https://acmelaw.co.uk');
    vi.doMock('@/lib/firm-outreach/enrichment/website-discovery', () => ({
      discoverFirmWebsiteViaSerper,
      isSerperConfigured: () => true,
    }));

    // Crawler returns an email ONLY when a website was discovered — proves the wiring.
    const crawlEmailsForProspect = vi.fn(async (p: { websiteUrl?: string }) =>
      p.websiteUrl
        ? {
            best: { address: 'contact@acmelaw.co.uk', confidence: 'crawled', score: 10 },
            alternatives: [],
            websiteUrl: p.websiteUrl,
          }
        : { best: null, alternatives: [] },
    );
    vi.doMock('@/lib/firm-outreach/enrichment/email-crawler', () => ({ crawlEmailsForProspect }));

    vi.doMock('@/lib/firm-outreach/enrichment/paid-enrichment', () => ({
      paidEnrichEmails: vi.fn().mockResolvedValue([]),
    }));
    vi.doMock('@/lib/firm-outreach/crime-website-verify', () => ({
      websiteIndicatesCrimePractice: vi.fn().mockResolvedValue(false),
    }));
    vi.doMock('@/lib/firm-outreach/enrichment/validator', () => ({
      isPlausibleOutreachEmail: () => true,
      validateEmailForSend: vi.fn().mockResolvedValue({ ok: true }),
    }));

    const { runFirmEnrichment } = await import('@/lib/firm-outreach/enrichment/run-enrich');
    const stats = await runFirmEnrichment({ limit: 5 });

    expect(discoverFirmWebsiteViaSerper).toHaveBeenCalledTimes(1);
    expect(crawlEmailsForProspect).toHaveBeenCalledTimes(1);
    expect(stats.readyToSend).toBe(1);
    expect(saved?.websiteUrl).toBe('https://acmelaw.co.uk');
    expect(saved?.email).toBe('contact@acmelaw.co.uk');
    expect(saved?.status).toBe('ready_to_send');
  });

  it('without discovery (no website) the prospect yields no email', async () => {
    const prospect = {
      id: 'p2',
      prospectType: 'firm' as const,
      firmName: 'Nowhere Law',
      firmKey: 'nowhere-law',
      sources: ['laa'],
      status: 'discovered',
      priorityScore: 10,
      sequenceStep: 0,
      campaignId: 'c',
      createdAt: '',
      updatedAt: '',
      enrichAttempts: 5,
    };

    let saved: Record<string, unknown> | undefined;
    vi.doMock('@/lib/firm-outreach/storage', () => ({
      CURSOR_ENRICH: 'firmoutreach:cursor:enrich',
      enrichCursorKey: (campaignId: string) => `firmoutreach:cursor:enrich:${campaignId}`,
      getCursor: vi.fn().mockResolvedValue(0),
      setCursor: vi.fn(),
      listProspectIdsByStatus: vi.fn().mockImplementation(async (status: string) =>
        status === 'discovered' ? ['p2'] : [],
      ),
      listProspectIdsByRecordStatus: vi.fn().mockImplementation(async (status: string) =>
        status === 'discovered' ? ['p2'] : [],
      ),
      getProspectsByIds: vi
        .fn()
        .mockImplementation(async (ids: string[]) =>
          new Map(ids.filter((id) => id === 'p2').map((id) => [id, structuredClone(prospect)])),
        ),
      getProspect: vi.fn().mockImplementation(async () => structuredClone(prospect)),
      saveProspect: vi.fn(async (p: Record<string, unknown>) => {
        saved = { ...p };
      }),
      isDuplicateInitialSend: vi.fn().mockResolvedValue(false),
    }));
    vi.doMock('@/lib/dscc-register-lookup', () => ({
      ensureDsccRegisterCache: vi.fn().mockResolvedValue({ entries: [] }),
    }));
    vi.doMock('@/lib/legal-directory/laa-fetch', () => ({
      readLaaCrimeJson: vi.fn().mockReturnValue([]),
    }));
    vi.doMock('@/lib/firm-outreach/sra-org-lookup', () => ({
      lookupSraOrganisationByName: vi
        .fn()
        .mockResolvedValue({ found: false, matched: false, organisation: null }),
    }));
    // Serper finds nothing → no website.
    vi.doMock('@/lib/firm-outreach/enrichment/website-discovery', () => ({
      discoverFirmWebsiteViaSerper: vi.fn().mockResolvedValue(null),
      isSerperConfigured: () => true,
    }));
    vi.doMock('@/lib/firm-outreach/enrichment/email-crawler', () => ({
      crawlEmailsForProspect: vi.fn(async (p: { websiteUrl?: string }) =>
        p.websiteUrl ? { best: { address: 'x@y.co.uk', confidence: 'crawled', score: 5 }, alternatives: [] } : { best: null, alternatives: [] },
      ),
    }));
    vi.doMock('@/lib/firm-outreach/enrichment/paid-enrichment', () => ({
      paidEnrichEmails: vi.fn().mockResolvedValue([]),
    }));
    vi.doMock('@/lib/firm-outreach/crime-website-verify', () => ({
      websiteIndicatesCrimePractice: vi.fn().mockResolvedValue(false),
    }));
    vi.doMock('@/lib/firm-outreach/enrichment/validator', () => ({
      isPlausibleOutreachEmail: () => true,
      validateEmailForSend: vi.fn().mockResolvedValue({ ok: true }),
    }));

    const { runFirmEnrichment } = await import('@/lib/firm-outreach/enrichment/run-enrich');
    const stats = await runFirmEnrichment({ limit: 5 });

    expect(stats.readyToSend).toBe(0);
    expect(saved?.email).toBeUndefined();
    expect(saved?.status).toBe('no_email');
  });
});
