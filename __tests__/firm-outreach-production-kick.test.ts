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
  it('continues when optional requalify/seed steps fail', async () => {
    const fetchFn = vi.fn().mockImplementation(async (url: string) => {
      const u = String(url);
      if (u.includes('requalifyOnly=1') || u.includes('seedAgentCover=1')) {
        return { status: 504, text: async () => 'timeout' };
      }
      if (u.includes('batches=1') && !u.includes('seedAgentCover') && !u.includes('campaignId=')) {
        const n = fetchFn.mock.calls.filter((c: unknown[]) => {
          const cu = String(c[0]);
          return cu.includes('batches=1') && !cu.includes('seedAgentCover') && !cu.includes('campaignId=');
        }).length;
        if (n >= 2) return { status: 504, text: async () => 'timeout' };
      }
      return { status: 200, text: async () => '{"ok":true}' };
    });

    const { failed, results } = await runProductionKickSteps({
      baseUrl: 'https://example.com',
      auth: { header: 'Authorization', value: 'Bearer x' },
      steps: DEFAULT_PRODUCTION_KICK_STEPS,
      fetchFn: fetchFn as typeof fetch,
    });

    expect(failed).toBe(false);
    expect(results.length).toBe(DEFAULT_PRODUCTION_KICK_STEPS.length);
    expect(results[1]?.path).toContain('firm-outreach-probe');
    expect(results[1]?.ok).toBe(true);
  });

  it('starts with optional outreach status health check', () => {
    expect(DEFAULT_PRODUCTION_KICK_STEPS[0]?.path).toBe('/api/cron/firm-outreach-status');
    expect(DEFAULT_PRODUCTION_KICK_STEPS[0]?.optional).toBe(true);
  });

  it('requires pre-flight email probes before flush', () => {
    expect(DEFAULT_PRODUCTION_KICK_STEPS[1]?.path).toBe('/api/cron/firm-outreach-probe');
    expect(DEFAULT_PRODUCTION_KICK_STEPS[1]?.optional).toBeFalsy();
  });

  it('ends with optional multi-campaign send flush after dry-run preview', () => {
    const last = DEFAULT_PRODUCTION_KICK_STEPS.at(-1);
    const dryRun = DEFAULT_PRODUCTION_KICK_STEPS.at(-2);
    expect(dryRun?.path).toContain('dryRunPreview=1');
    expect(dryRun?.optional).toBe(true);
    expect(last?.path).toBe('/api/cron/firm-outreach-send?limit=150');
    expect(last?.optional).toBe(true);
  });

  it('fails when required probe is non-200', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({ status: 200, text: async () => '{"ok":true}' })
      .mockResolvedValueOnce({ status: 503, text: async () => '{"ok":false}' });

    const { failed, results } = await runProductionKickSteps({
      baseUrl: 'https://example.com',
      auth: { header: 'Authorization', value: 'Bearer x' },
      steps: DEFAULT_PRODUCTION_KICK_STEPS,
      fetchFn: fetchFn as typeof fetch,
    });

    expect(failed).toBe(true);
    expect(results).toHaveLength(2);
    expect(results[1]?.ok).toBe(false);
  });

  it('fails when required enrich batch is non-200', async () => {
    const fetchFn = vi.fn().mockImplementation(async (url: string) => {
      const u = String(url);
      if (u.includes('batches=1') && !u.includes('seedAgentCover') && !u.includes('campaignId=')) {
        return { status: 504, text: async () => 'timeout' };
      }
      return { status: 200, text: async () => '{"ok":true}' };
    });

    const { failed, results } = await runProductionKickSteps({
      baseUrl: 'https://example.com',
      auth: { header: 'Authorization', value: 'Bearer x' },
      steps: DEFAULT_PRODUCTION_KICK_STEPS,
      fetchFn: fetchFn as typeof fetch,
    });

    expect(failed).toBe(true);
    const failedStep = results.find((r) => !r.ok && !r.optional);
    expect(failedStep?.label).toContain('Enrich batch 1');
  });

  it('uses separate bootstrap enrich calls not a combined batch', () => {
    const enrichSteps = DEFAULT_PRODUCTION_KICK_STEPS.filter(
      (s) => s.path.includes('bootstrap') && s.path.includes('batches=1'),
    );
    expect(enrichSteps.length).toBeGreaterThanOrEqual(2);
    expect(DEFAULT_PRODUCTION_KICK_STEPS.some((s) => s.path.includes('batches=2'))).toBe(false);
  });
});

describe('waitForVercelProductionDeploy', () => {
  it('waits for the newest deployment for a commit sha to be READY', async () => {
    let nowMs = 0;
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          deployments: [
            { readyState: 'BUILDING', meta: { githubCommitSha: 'abc' }, createdAt: 2, url: 'new.vercel.app' },
            { readyState: 'READY', meta: { githubCommitSha: 'abc' }, createdAt: 1, url: 'old.vercel.app' },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          deployments: [{ readyState: 'READY', meta: { githubCommitSha: 'abc' }, createdAt: 3, url: 'new.vercel.app' }],
        }),
      });

    const result = await waitForVercelProductionDeploy({
      token: 't',
      projectId: 'p',
      commitSha: 'abc',
      timeoutMs: 5_000,
      pollMs: 1,
      now: () => nowMs,
      sleep: async (ms) => {
        nowMs += ms;
      },
      fetchFn: fetchFn as typeof fetch,
    });

    expect(result.ready).toBe(true);
    expect(result.deployment?.url).toBe('new.vercel.app');
    expect(fetchFn).toHaveBeenCalledTimes(2);
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
    vi.doMock('@/lib/firm-outreach/enrichment/recover-enrich-pool', () => ({
      recoverEnrichPool: vi.fn().mockResolvedValue({
        retiredExhaustedDiscovered: 0,
        requeuedStaleNoEmail: 0,
        campaignId: 'whatsapp_invite_v1',
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
      listProspectIdsByRecordStatus: vi.fn().mockResolvedValue([]),
      getProspect: vi.fn(),
      saveProspect: vi.fn(),
    }));

    const { bootstrapOutreach } = await import('@/lib/firm-outreach/bootstrap-outreach');
    await bootstrapOutreach({ batches: 1, limit: 10 });

    expect(reindexProspectStatuses).not.toHaveBeenCalled();
  });
});
