import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getProspect: vi.fn(),
  listProspectIdsByRecordStatus: vi.fn(),
  saveProspect: vi.fn(),
}));

vi.mock('@/lib/firm-outreach/storage', () => ({
  getProspect: mocks.getProspect,
  listProspectIdsByRecordStatus: mocks.listProspectIdsByRecordStatus,
  saveProspect: mocks.saveProspect,
}));

vi.mock('@/lib/firm-outreach/campaign-scope', () => ({
  activeOutreachCampaignId: () => 'whatsapp_invite_v1',
}));

import { recoverEnrichPool } from '@/lib/firm-outreach/enrichment/recover-enrich-pool';

describe('recoverEnrichPool', () => {
  beforeEach(() => {
    mocks.getProspect.mockReset();
    mocks.listProspectIdsByRecordStatus.mockReset();
    mocks.saveProspect.mockReset();
  });

  it('retires exhausted discovered rows to no_email', async () => {
    mocks.listProspectIdsByRecordStatus.mockImplementation(async (status: string) =>
      status === 'discovered' ? ['p1'] : [],
    );
    mocks.getProspect.mockResolvedValue({
      id: 'p1',
      status: 'discovered',
      enrichAttempts: 6,
      firmName: 'Stuck Firm',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const result = await recoverEnrichPool({ campaignId: 'whatsapp_invite_v1' });
    expect(result.retiredExhaustedDiscovered).toBe(1);
    expect(mocks.saveProspect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p1', status: 'no_email' }),
      'discovered',
    );
  });

  it('requeues stale no_email even at max attempts by resetting enrichAttempts', async () => {
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 86_400_000).toISOString();
    mocks.listProspectIdsByRecordStatus.mockImplementation(async (status: string) =>
      status === 'no_email' ? ['p2'] : [],
    );
    mocks.getProspect.mockResolvedValue({
      id: 'p2',
      status: 'no_email',
      enrichAttempts: 6,
      lastEnrichAttemptAt: thirtyOneDaysAgo,
      firmName: 'Retry Firm',
      updatedAt: thirtyOneDaysAgo,
    });

    const result = await recoverEnrichPool({ campaignId: 'agent_cover_kent_v1' });
    expect(result.requeuedStaleNoEmail).toBe(1);
    expect(mocks.saveProspect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'p2',
        status: 'discovered',
        enrichAttempts: 0,
      }),
      'no_email',
    );
  });
});
