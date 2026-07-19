import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/buffer/verify-cross-site', () => ({
  verifyCrossSiteBufferPosts: vi.fn(),
}));

vi.mock('@/lib/buffer/engine-run', () => ({
  verifyRepukBufferSchedule: vi.fn(async () => ({
    ok: true,
    date: '2026-07-19',
    scheduledCount: 5,
    requiredCount: 5,
    gapFilled: 1,
    issues: [],
  })),
}));

import { verifyCrossSiteBufferPosts } from '@/lib/buffer/verify-cross-site';
import { inspectAndRepairCrossSiteQuota } from '@/lib/automation/repairs/cross-site';

describe('cross-site quota repair policy', () => {
  beforeEach(() => {
    vi.stubEnv('AUTOMATION_DRY_RUN', '1');
    vi.stubEnv('AUTO_REPAIR_ENABLED', '0');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reports deficit without inventing filler content', async () => {
    vi.mocked(verifyCrossSiteBufferPosts).mockResolvedValue({
      ok: false,
      date: '2026-07-18',
      sites: [
        {
          id: 'policestationrepuk',
          hostname: 'policestationrepuk.org',
          sentCount: 3,
          requiredCount: 5,
          ok: false,
          issue: 'only 3/5',
        },
        {
          id: 'psrtrain',
          hostname: 'psrtrain.com',
          sentCount: 2,
          requiredCount: 5,
          ok: false,
          issue: 'only 2/5',
        },
      ],
      problems: [],
    });

    const result = await inspectAndRepairCrossSiteQuota({ dryRun: true, date: '2026-07-18' });
    expect(result.expected).toBe(20);
    expect(result.actual).toBe(5);
    expect(result.issues.some((i) => i.summary.includes('psrtrain'))).toBe(true);
    expect(
      result.issues.find((i) => i.summary.includes('psrtrain'))?.requiresHumanAction,
    ).toBe(true);
    expect(result.repairs.some((r) => r.kind === 'crosssite_repuk_gap_fill')).toBe(true);
  });

  it('treats insufficient sibling quota as human action, not REPUK flood', async () => {
    vi.mocked(verifyCrossSiteBufferPosts).mockResolvedValue({
      ok: false,
      date: '2026-07-18',
      sites: [
        {
          id: 'custodynote',
          hostname: 'custodynote.com',
          sentCount: 0,
          requiredCount: 5,
          ok: false,
        },
      ],
      problems: [],
    });
    const result = await inspectAndRepairCrossSiteQuota({ dryRun: true });
    expect(result.repairs.every((r) => r.kind !== 'crosssite_repuk_gap_fill' || r.target === 'policestationrepuk')).toBe(
      true,
    );
    expect(result.issues[0]?.requiresHumanAction).toBe(true);
  });
});
