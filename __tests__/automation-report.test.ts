import { describe, expect, it } from 'vitest';
import { buildDailyHealthReport, computeOverallStatus } from '@/lib/automation/report';
import type { HealthIssue, RepairAction } from '@/lib/automation/types';

describe('automation report', () => {
  it('marks healthy when no issues', () => {
    expect(computeOverallStatus({ issues: [], repairs: [] })).toBe('Healthy');
  });

  it('marks repaired when verified repairs exist', () => {
    const repairs: RepairAction[] = [
      {
        id: '1',
        kind: 'gap',
        target: 'today',
        attempted: true,
        verified: true,
        dryRun: false,
        summary: 'ok',
      },
    ];
    expect(computeOverallStatus({ issues: [], repairs })).toBe('Repaired');
  });

  it('marks action required for human issues', () => {
    const issues: HealthIssue[] = [
      {
        id: '1',
        fingerprint: 'fp',
        jobName: 'buffer-blog-posts',
        category: 'auth',
        severity: 'critical',
        summary: 'auth failed',
        recoverable: false,
        requiresHumanAction: true,
      },
    ];
    expect(computeOverallStatus({ issues, repairs: [] })).toBe('Action Required');
  });

  it('builds report with quotas and execution id', () => {
    const report = buildDailyHealthReport({
      date: '2026-07-18',
      executionId: 'exec-1',
      dryRun: true,
      bufferExpected: 5,
      bufferActual: 4,
      crossSiteExpected: 20,
      crossSiteActual: 18,
      failedJobs: ['buffer-blog-posts'],
      repairs: [],
      issues: [],
      duplicatesPrevented: 1,
      emailsSuppressed: 2,
    });
    expect(report.overallStatus).toBe('Healthy');
    expect(report.bufferExpected).toBe(5);
    expect(report.duplicatesPrevented).toBe(1);
  });
});
