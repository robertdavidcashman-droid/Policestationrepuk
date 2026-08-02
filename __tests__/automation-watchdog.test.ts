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

vi.mock('@/lib/buffer/engine-run', () => ({
  verifyRepukBufferSchedule: vi.fn(async () => ({
    ok: true,
    date: '2026-07-19',
    scheduledCount: 5,
    requiredCount: 5,
    gapFilled: 0,
    issues: [],
  })),
}));

vi.mock('@/lib/cron-run-log', () => ({
  getCronRunLog: vi.fn(async () => ({
    jobName: 'buffer-blog-posts',
    startedAt: '2026-07-19T05:05:00.000Z',
    finishedAt: '2026-07-19T05:10:00.000Z',
    durationMs: 300_000,
    outcome: 'partial',
  })),
  saveCronRunLog: vi.fn(async () => undefined),
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: vi.fn(async () => ({ id: 'mock' })) };
  },
}));

import { runAutomationWatchdog } from '@/lib/automation/watchdog';
import { verifyRepukBufferSchedule } from '@/lib/buffer/engine-run';
import { getCronRunLog } from '@/lib/cron-run-log';

describe('automation watchdog buffer overdue', () => {
  beforeEach(() => {
    store.clear();
    vi.stubEnv('AUTOMATION_ENABLED', 'true');
    vi.stubEnv('AUTOMATION_DRY_RUN', '1');
    vi.stubEnv('WATCHDOG_ENABLED', 'true');
    vi.stubEnv('AUTO_REPAIR_ENABLED', '0');
    vi.mocked(verifyRepukBufferSchedule).mockClear();
    vi.mocked(getCronRunLog).mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not treat partial cron + met Buffer quota as overdue', async () => {
    const result = await runAutomationWatchdog({
      dryRun: true,
      now: new Date('2026-07-19T08:00:00Z'),
    });

    expect(result.ok).toBe(true);
    expect(result.overdueJobs).toEqual([]);
    // Ran today via partial cron — no need to inspect Buffer for overdue gate.
    expect(verifyRepukBufferSchedule).not.toHaveBeenCalled();
  });

  it('suppresses overdue when cron log missing but Buffer quota already met', async () => {
    vi.mocked(getCronRunLog).mockResolvedValue(null);

    const result = await runAutomationWatchdog({
      dryRun: true,
      now: new Date('2026-07-19T08:00:00Z'),
    });

    expect(result.ok).toBe(true);
    expect(result.overdueJobs).toEqual([]);
    expect(verifyRepukBufferSchedule).toHaveBeenCalledWith({
      now: expect.any(Date),
      gapFill: false,
    });
    expect(result.notes.some((n) => /quota already met/i.test(n))).toBe(true);
  });
});
