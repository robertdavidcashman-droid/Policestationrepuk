import { describe, expect, it } from 'vitest';
import {
  isDueForFollowUpStep1,
  prospectHasInitialSend,
  reconcileReadyProspectStatus,
} from '@/lib/firm-outreach/reconcile-ready-status';
import type { FirmProspect } from '@/lib/firm-outreach/types';

const base = (): FirmProspect => ({
  id: 'fop_test',
  firmKey: 'test-firm',
  firmName: 'Test Solicitors',
  prospectType: 'firm',
  status: 'ready_to_send',
  sequenceStep: 0,
  sources: ['laa'],
  priorityScore: 0,
  campaignId: 'whatsapp_invite_v1',
  enrichAttempts: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('reconcileReadyProspectStatus', () => {
  it('moves ready_to_send with lastEmailAt to sent', () => {
    const p = {
      ...base(),
      lastEmailAt: '2026-06-11T14:04:45.387Z',
    };
    expect(prospectHasInitialSend(p)).toBe(true);
    expect(reconcileReadyProspectStatus(p)).toBe('sent');
  });

  it('downgrades ready_to_send with malformed email to discovered', () => {
    expect(
      reconcileReadyProspectStatus({
        ...base(),
        email: 'not-an-email',
      }),
    ).toBe('discovered');
  });

  it('downgrades crawler junk emails to discovered', () => {
    expect(
      reconcileReadyProspectStatus({
        ...base(),
        email: 'gallagherlogo@4x.png',
      }),
    ).toBe('discovered');
    expect(
      reconcileReadyProspectStatus({
        ...base(),
        email: '605a7baede844d278b89dc95ae0a9123@sentry-next.wixpress.com',
      }),
    ).toBe('discovered');
  });

  it('leaves valid unsent ready prospects unchanged', () => {
    const p = {
      ...base(),
      email: 'info@example.co.uk',
    };
    expect(reconcileReadyProspectStatus(p)).toBeNull();
  });

  it('ignores non-ready statuses', () => {
    const p = { ...base(), status: 'sent' as const, lastEmailAt: '2026-06-11T14:04:45.387Z' };
    expect(reconcileReadyProspectStatus(p)).toBeNull();
  });
});

describe('isDueForFollowUpStep1', () => {
  it('returns true after seven days on step 0', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      isDueForFollowUpStep1({
        sequenceStep: 0,
        lastEmailAt: eightDaysAgo,
      }),
    ).toBe(true);
  });

  it('returns false before seven days', () => {
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      isDueForFollowUpStep1({
        sequenceStep: 0,
        lastEmailAt: fourDaysAgo,
      }),
    ).toBe(false);
  });
});
