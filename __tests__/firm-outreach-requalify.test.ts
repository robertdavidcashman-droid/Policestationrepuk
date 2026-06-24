import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { FirmProspect } from '@/lib/firm-outreach/types';

const baseProspect = (): FirmProspect => ({
  id: 'p1',
  firmKey: 'acme',
  firmName: 'Acme Law',
  prospectType: 'firm',
  status: 'ready_to_send',
  sequenceStep: 0,
  sources: ['laa'],
  priorityScore: 10,
  campaignId: 'c',
  enrichAttempts: 1,
  email: '2062d0a4929b45348643784b5cb39c36@sentry.wixpress.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('requalifyAllProspects', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('downgrades ready_to_send with implausible email via reconcile', async () => {
    vi.doMock('@/lib/dscc-register-lookup', () => ({
      ensureDsccRegisterCache: vi.fn().mockResolvedValue({ entries: [] }),
    }));
    vi.doMock('@/lib/legal-directory/laa-fetch', () => ({
      readLaaCrimeJson: vi.fn().mockReturnValue([]),
    }));
    vi.doMock('@/lib/firm-outreach/storage', () => ({
      listAllProspectIds: vi.fn().mockResolvedValue(['p1']),
      getProspect: vi.fn().mockResolvedValue(structuredClone(baseProspect())),
      saveProspect: vi.fn(),
    }));
    vi.doMock('@/lib/firm-outreach/crime-website-verify', () => ({
      websiteIndicatesCrimePractice: vi.fn().mockResolvedValue(false),
    }));

    const { requalifyAllProspects } = await import('@/lib/firm-outreach/requalify-prospects');
    const result = await requalifyAllProspects({ verifyWebsites: false });

    expect(result.reconciledFromReady).toBe(1);
    expect(result.downgradedFromReady).toBe(0);
  });

  it('downgrades ready_to_send when MX validation fails', async () => {
    const prospect = {
      ...baseProspect(),
      email: 'info@example.co.uk',
    };

    const saveProspect = vi.fn();
    vi.doMock('@/lib/dscc-register-lookup', () => ({
      ensureDsccRegisterCache: vi.fn().mockResolvedValue({ entries: [] }),
    }));
    vi.doMock('@/lib/legal-directory/laa-fetch', () => ({
      readLaaCrimeJson: vi.fn().mockReturnValue([]),
    }));
    vi.doMock('@/lib/firm-outreach/storage', () => ({
      listAllProspectIds: vi.fn().mockResolvedValue(['p1']),
      getProspect: vi.fn().mockResolvedValue(structuredClone(prospect)),
      saveProspect,
    }));
    vi.doMock('@/lib/firm-outreach/crime-website-verify', () => ({
      websiteIndicatesCrimePractice: vi.fn().mockResolvedValue(false),
    }));
    vi.doMock('@/lib/firm-outreach/enrichment/validator', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/lib/firm-outreach/enrichment/validator')>();
      return {
        ...actual,
        validateEmailForSend: vi.fn().mockResolvedValue({ ok: false, reason: 'no_mx' }),
      };
    });

    const { requalifyAllProspects } = await import('@/lib/firm-outreach/requalify-prospects');
    const result = await requalifyAllProspects({ verifyWebsites: false });

    expect(result.mxDowngradedFromReady).toBe(1);
    expect(result.downgradedFromReady).toBe(1);
    expect(saveProspect).toHaveBeenCalled();
  });
});
