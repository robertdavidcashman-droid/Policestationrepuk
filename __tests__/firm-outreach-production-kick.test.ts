import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PRODUCTION_KICK_STEPS,
  outreachPathsChanged,
  resolveKickAuth,
  runProductionKickSteps,
  waitForVercelProductionDeploy,
} from '@/lib/firm-outreach/production-kick';

describe('resolveKickAuth', () => {
  it('prefers CRON_SECRET bearer auth', () => {
    expect(resolveKickAuth({ CRON_SECRET: 'abc', FIRM_OUTREACH_BOOTSTRAP_SECRET: 'xyz' })).toEqual({
      header: 'Authorization',
      value: 'Bearer abc',
    });
  });

  it('falls back to bootstrap secret header', () => {
    expect(resolveKickAuth({ FIRM_OUTREACH_BOOTSTRAP_SECRET: 'xyz' })).toEqual({
      header: 'x-firm-outreach-bootstrap-secret',
      value: 'xyz',
    });
  });

  it('returns null when no secrets', () => {
    expect(resolveKickAuth({})).toBeNull();
  });
});

describe('outreachPathsChanged', () => {
  it('matches firm-outreach paths only', () => {
    expect(outreachPathsChanged(['lib/firm-outreach/run-enrich.ts'])).toBe(true);
    expect(outreachPathsChanged(['app/api/cron/firm-outreach-enrich/route.ts'])).toBe(true);
    expect(outreachPathsChanged(['app/blog/page.tsx'])).toBe(false);
  });
});

describe('runProductionKickSteps', () => {
  it('continues when optional requalify step fails', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({ status: 200, text: async () => '{"ok":true}' })
      .mockResolvedValueOnce({ status: 504, text: async () => 'timeout' })
      .mockResolvedValueOnce({ status: 200, text: async () => '{"ok":true}' })
      .mockResolvedValueOnce({ status: 504, text: async () => 'timeout' });

    const { failed, results } = await runProductionKickSteps({
      baseUrl: 'https://example.com',
      auth: { header: 'Authorization', value: 'Bearer x' },
      steps: DEFAULT_PRODUCTION_KICK_STEPS,
      fetchFn: fetchFn as typeof fetch,
    });

    expect(failed).toBe(false);
    expect(results).toHaveLength(4);
    expect(results[0]?.ok).toBe(true);
    expect(results[1]?.ok).toBe(false);
    expect(results[1]?.optional).toBe(true);
    expect(results[2]?.ok).toBe(true);
    expect(results[3]?.ok).toBe(false);
    expect(results[3]?.optional).toBe(true);
  });

  it('starts with optional outreach status health check', () => {
    expect(DEFAULT_PRODUCTION_KICK_STEPS[0]?.path).toBe('/api/cron/firm-outreach-status');
    expect(DEFAULT_PRODUCTION_KICK_STEPS[0]?.optional).toBe(true);
  });

  it('fails when required enrich batch is non-200', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({ status: 200, text: async () => '{"ok":true}' })
      .mockResolvedValueOnce({ status: 200, text: async () => '{}' })
      .mockResolvedValueOnce({ status: 504, text: async () => 'timeout' });

    const { failed, results } = await runProductionKickSteps({
      baseUrl: 'https://example.com',
      auth: { header: 'Authorization', value: 'Bearer x' },
      steps: DEFAULT_PRODUCTION_KICK_STEPS,
      fetchFn: fetchFn as typeof fetch,
    });

    expect(failed).toBe(true);
    expect(results).toHaveLength(3);
    expect(results[2]?.ok).toBe(false);
    expect(results[2]?.optional).toBe(false);
  });

  it('uses separate bootstrap enrich calls not a combined batch', () => {
    const enrichSteps = DEFAULT_PRODUCTION_KICK_STEPS.filter((s) => s.path.includes('bootstrap') && s.path.includes('batches=1'));
    expect(enrichSteps).toHaveLength(2);
    expect(DEFAULT_PRODUCTION_KICK_STEPS.some((s) => s.path.includes('batches=2'))).toBe(false);
  });
});

describe('waitForVercelProductionDeploy', () => {
  it('returns ready when deployment matches commit sha', async () => {
    let calls = 0;
    const fetchFn = vi.fn(async () => {
      calls++;
      return {
        ok: true,
        json: async () => ({
          deployments: [
            { readyState: 'BUILDING', meta: { githubCommitSha: 'abc' } },
            { readyState: 'READY', meta: { githubCommitSha: 'abc' }, url: 'x.vercel.app' },
          ],
        }),
      };
    });

    const result = await waitForVercelProductionDeploy({
      token: 't',
      projectId: 'p',
      commitSha: 'abc',
      timeoutMs: 5_000,
      pollMs: 1,
      now: () => 0,
      sleep: async () => {},
      fetchFn: fetchFn as typeof fetch,
    });

    expect(result.ready).toBe(true);
    expect(result.deployment?.url).toBe('x.vercel.app');
    expect(calls).toBe(1);
  });
});

describe('requalifyAllProspects readyOnly', () => {
  it('uses ready_to_send index instead of all prospect ids', async () => {
    vi.resetModules();
    const listProspectIdsByStatus = vi.fn().mockResolvedValue(['ready-1']);
    const listAllProspectIds = vi.fn().mockResolvedValue(['all-1', 'all-2']);
    vi.doMock('@/lib/dscc-register-lookup', () => ({
      ensureDsccRegisterCache: vi.fn().mockResolvedValue({ entries: [] }),
    }));
    vi.doMock('@/lib/legal-directory/laa-fetch', () => ({
      readLaaCrimeJson: vi.fn().mockReturnValue([]),
    }));
    vi.doMock('@/lib/firm-outreach/storage', () => ({
      listProspectIdsByStatus,
      listAllProspectIds,
      getProspect: vi.fn().mockResolvedValue({
        id: 'ready-1',
        firmName: 'Acme',
        status: 'ready_to_send',
        sources: ['laa'],
        email: 'info@example.co.uk',
        sequenceStep: 0,
        priorityScore: 1,
        campaignId: 'c',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
      saveProspect: vi.fn(),
    }));
    vi.doMock('@/lib/firm-outreach/crime-website-verify', () => ({
      websiteIndicatesCrimePractice: vi.fn().mockResolvedValue(false),
    }));

    const { requalifyAllProspects } = await import('@/lib/firm-outreach/requalify-prospects');
    await requalifyAllProspects({ verifyWebsites: false, readyOnly: true, mxCheckLimit: 0 });

    expect(listProspectIdsByStatus).toHaveBeenCalledWith('ready_to_send');
    expect(listAllProspectIds).not.toHaveBeenCalled();
  });
});

describe('bootstrapOutreach', () => {
  it('does not reindex after enrich unless explicitly requested', async () => {
    vi.resetModules();
    const reindexProspectStatuses = vi.fn();
    vi.doMock('@/lib/firm-outreach/enrichment/run-enrich', () => ({
      runFirmEnrichment: vi.fn().mockResolvedValue({
        processed: 3,
        emailsFound: 1,
        readyToSend: 1,
        noEmail: 2,
        errors: 0,
      }),
    }));
    vi.doMock('@/lib/firm-outreach/reindex-prospects', () => ({ reindexProspectStatuses }));
    vi.doMock('@/lib/firm-outreach/pause-state', () => ({
      getOutreachPauseSummary: vi.fn().mockResolvedValue({ effectivePaused: false, envPaused: false }),
      setAdminPauseState: vi.fn(),
      isOutreachSendAllowed: vi.fn().mockResolvedValue(true),
    }));
    vi.doMock('@/lib/firm-outreach/storage', () => ({
      countProspectsByStatus: vi.fn().mockResolvedValue({ discovered: 10 }),
    }));

    const { bootstrapOutreach } = await import('@/lib/firm-outreach/bootstrap-outreach');
    await bootstrapOutreach({ batches: 1, limit: 10 });

    expect(reindexProspectStatuses).not.toHaveBeenCalled();
  });
});
