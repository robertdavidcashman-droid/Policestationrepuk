import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const store = new Map<string, unknown>();

vi.mock('@/lib/kv', () => ({
  getKV: () => ({
    get: async <T>(key: string) => (store.has(key) ? (store.get(key) as T) : null),
    set: async (key: string, value: unknown, opts?: { nx?: boolean }) => {
      if (opts?.nx && store.has(key)) return null;
      store.set(key, value);
      return 'OK';
    },
    del: async (key: string) => {
      store.delete(key);
      return 1;
    },
    sadd: async () => 1,
    smembers: async () => [],
    expire: async () => 1,
    incr: async () => 1,
  }),
}));

vi.mock('@/lib/automation/buffer-probe', () => ({
  probeBufferCredentials: vi.fn(async () => ({
    ok: true,
    apiKeyPresent: true,
    apiKeyMalformed: false,
    authenticated: true,
    organizationAccessible: true,
    channelsConfigured: 3,
    channelsAccessible: 3,
    missingChannelIds: [],
    disconnectedChannelIds: [],
    issues: [],
  })),
}));

vi.mock('@/lib/automation/repairs/buffer', () => ({
  repairBufferSchedule: vi.fn(async () => ({
    repairs: [],
    todayScheduled: 5,
    todayRequired: 5,
    yesterdayOk: true,
    yesterdaySent: 5,
    yesterdayTotal: 5,
    yesterdayProblems: 0,
  })),
}));

vi.mock('@/lib/automation/repairs/cross-site', () => ({
  inspectAndRepairCrossSiteQuota: vi.fn(async () => ({
    ok: true,
    date: '2026-07-18',
    expected: 20,
    actual: 20,
    sites: [],
    repairs: [],
    issues: [],
  })),
}));

vi.mock('@/lib/cron-run-log', () => ({
  getCronRunLog: vi.fn(async () => ({
    jobName: 'buffer-blog-posts',
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 10,
    outcome: 'success',
  })),
  saveCronRunLog: vi.fn(async () => undefined),
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: vi.fn(async () => ({ id: 'mock' })) };
  },
}));

import { runDailyHealthcheck } from '@/lib/automation/healthcheck';
import { probeBufferCredentials } from '@/lib/automation/buffer-probe';

describe('daily healthcheck', () => {
  beforeEach(() => {
    store.clear();
    vi.stubEnv('AUTOMATION_ENABLED', 'true');
    vi.stubEnv('AUTOMATION_DRY_RUN', '1');
    vi.stubEnv('DAILY_HEALTHCHECK_ENABLED', 'true');
    vi.stubEnv('AUTO_REPAIR_ENABLED', '0');
    vi.stubEnv('BUFFER_HEALTHCHECK_ENABLED', 'true');
    vi.stubEnv('CROSS_SITE_HEALTHCHECK_ENABLED', 'true');
    vi.stubEnv('DAILY_SUCCESS_EMAIL_ENABLED', 'true');
    vi.stubEnv('RESEND_API_KEY', '');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('runs a successful dry-run healthcheck', async () => {
    const result = await runDailyHealthcheck({
      dryRun: true,
      now: new Date('2026-07-19T08:00:00Z'),
    });
    expect(result.skipped).toBeFalsy();
    expect(result.report.dryRun).toBe(true);
    expect(result.report.bufferExpected).toBeGreaterThan(0);
    expect(result.report.crossSiteExpected).toBe(20);
    expect(probeBufferCredentials).toHaveBeenCalled();
  });

  it('skips when second process holds the lock', async () => {
    store.set('automation:lock:automation-daily-healthcheck', {
      jobName: 'automation-daily-healthcheck',
      executionId: 'other',
      acquiredAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    const result = await runDailyHealthcheck({ dryRun: true });
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('lock_held');
  });

  it('surfaces Buffer auth failure as action required', async () => {
    vi.mocked(probeBufferCredentials).mockResolvedValueOnce({
      ok: false,
      apiKeyPresent: true,
      apiKeyMalformed: false,
      authenticated: false,
      organizationAccessible: false,
      channelsConfigured: 3,
      channelsAccessible: 0,
      missingChannelIds: [],
      disconnectedChannelIds: [],
      issues: [
        {
          id: 'auth',
          fingerprint: 'authfp',
          jobName: 'buffer-blog-posts',
          category: 'auth',
          severity: 'critical',
          summary: 'Buffer authentication failed',
          recoverable: false,
          requiresHumanAction: true,
        },
      ],
    });
    const result = await runDailyHealthcheck({
      dryRun: true,
      now: new Date('2026-07-19T08:00:00Z'),
    });
    expect(result.report.overallStatus).toBe('Action Required');
    expect(result.issues.some((i) => i.category === 'auth')).toBe(true);
  });
});
