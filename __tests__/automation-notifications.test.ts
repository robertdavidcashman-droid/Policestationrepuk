import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  buildIncidentFingerprint,
  decideNotification,
} from '@/lib/automation/notifications';
import type { IncidentRecord } from '@/lib/automation/types';

describe('automation notifications', () => {
  beforeEach(() => {
    vi.stubEnv('VITEST', 'true');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds stable fingerprints', () => {
    const a = buildIncidentFingerprint({
      jobName: 'buffer-blog-posts',
      category: 'auth',
      scheduledDate: '2026-07-18',
    });
    const b = buildIncidentFingerprint({
      jobName: 'buffer-blog-posts',
      category: 'auth',
      scheduledDate: '2026-07-18',
    });
    expect(a).toBe(b);
    expect(a).toHaveLength(32);
  });

  it('sends on new incident', () => {
    expect(
      decideNotification({
        existing: null,
        severity: 'error',
        reminderHours: 24,
      }),
    ).toEqual({ action: 'send', reason: 'new' });
  });

  it('suppresses duplicate within reminder window', () => {
    const existing: IncidentRecord = {
      fingerprint: 'abc',
      notificationType: 'test',
      jobName: 'buffer-blog-posts',
      severity: 'error',
      status: 'open',
      firstDetectedAt: new Date().toISOString(),
      lastDetectedAt: new Date().toISOString(),
      firstEmailSentAt: new Date().toISOString(),
      lastEmailSentAt: new Date().toISOString(),
      emailCount: 1,
      resolutionAt: null,
      recipient: 'ops@example.com',
      relatedExecutionId: null,
      summary: 'fail',
      category: 'network',
    };
    expect(
      decideNotification({
        existing,
        severity: 'error',
        reminderHours: 24,
      }),
    ).toEqual({ action: 'suppress', reason: 'within_reminder_window' });
  });

  it('allows reminder after configured interval', () => {
    const existing: IncidentRecord = {
      fingerprint: 'abc',
      notificationType: 'test',
      jobName: 'buffer-blog-posts',
      severity: 'error',
      status: 'open',
      firstDetectedAt: new Date(Date.now() - 48 * 3600_000).toISOString(),
      lastDetectedAt: new Date().toISOString(),
      firstEmailSentAt: new Date(Date.now() - 48 * 3600_000).toISOString(),
      lastEmailSentAt: new Date(Date.now() - 48 * 3600_000).toISOString(),
      emailCount: 1,
      resolutionAt: null,
      recipient: 'ops@example.com',
      relatedExecutionId: null,
      summary: 'fail',
      category: 'network',
    };
    expect(
      decideNotification({
        existing,
        severity: 'error',
        reminderHours: 24,
      }),
    ).toEqual({ action: 'send', reason: 'reminder' });
  });

  it('sends resolution email for open incidents', () => {
    const existing: IncidentRecord = {
      fingerprint: 'abc',
      notificationType: 'test',
      jobName: 'buffer-blog-posts',
      severity: 'error',
      status: 'open',
      firstDetectedAt: new Date().toISOString(),
      lastDetectedAt: new Date().toISOString(),
      firstEmailSentAt: new Date().toISOString(),
      lastEmailSentAt: new Date().toISOString(),
      emailCount: 1,
      resolutionAt: null,
      recipient: 'ops@example.com',
      relatedExecutionId: null,
      summary: 'fail',
      category: 'network',
    };
    expect(
      decideNotification({
        existing,
        severity: 'error',
        reminderHours: 24,
        isResolution: true,
      }),
    ).toEqual({ action: 'send', reason: 'resolution' });
  });
});
