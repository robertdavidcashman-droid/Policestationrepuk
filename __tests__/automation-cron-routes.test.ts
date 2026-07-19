import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';

vi.mock('@/lib/automation/healthcheck', () => ({
  runDailyHealthcheck: vi.fn(async () => ({
    ok: true,
    report: { date: '2026-07-18', overallStatus: 'Healthy', dryRun: true },
    repairs: [],
    issues: [],
  })),
}));

vi.mock('@/lib/automation/watchdog', () => ({
  runAutomationWatchdog: vi.fn(async () => ({
    ok: true,
    executionId: 'w1',
    dryRun: true,
    overdueJobs: [],
    stuckJobs: [],
    authFailure: false,
    repairs: [],
    alertsSent: 0,
    notes: [],
  })),
}));

import { GET as healthcheckGet } from '@/app/api/cron/automation-healthcheck/route';
import { GET as watchdogGet } from '@/app/api/cron/automation-watchdog/route';
import { runDailyHealthcheck } from '@/lib/automation/healthcheck';

describe('automation cron routes', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'test-secret');
    vi.stubEnv('NODE_ENV', 'production');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects unauthorised healthcheck requests', async () => {
    const res = await healthcheckGet(new Request('http://localhost/api/cron/automation-healthcheck'));
    expect(res.status).toBe(401);
  });

  it('rejects unauthorised watchdog requests', async () => {
    const res = await watchdogGet(new Request('http://localhost/api/cron/automation-watchdog'));
    expect(res.status).toBe(401);
  });

  it('runs healthcheck when authorised with dryRun', async () => {
    const res = await healthcheckGet(
      new Request('http://localhost/api/cron/automation-healthcheck?dryRun=1', {
        headers: { authorization: 'Bearer test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    expect(runDailyHealthcheck).toHaveBeenCalledWith({ dryRun: true, force: false });
  });
});
