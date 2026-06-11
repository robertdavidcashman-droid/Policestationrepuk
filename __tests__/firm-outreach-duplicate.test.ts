import { describe, expect, it, vi } from 'vitest';
import type { FirmOutreachSend } from '@/lib/firm-outreach/types';

function makeSend(overrides: Partial<FirmOutreachSend>): FirmOutreachSend {
  return {
    id: 'fos_1',
    prospectId: 'fop_other',
    firmName: 'Other Firm',
    prospectType: 'firm',
    email: 'info@firm.co.uk',
    campaignId: 'whatsapp_invite_v1',
    sequenceStep: 0,
    subject: 'Invite',
    status: 'sent',
    sentAt: '2026-06-01T09:00:00.000Z',
    createdAt: '2026-06-01T09:00:00.000Z',
    ...overrides,
  };
}

describe('isDuplicateInitialSend logic', () => {
  function isDuplicateInitialSend(email: string, prospectId: string, sends: FirmOutreachSend[]) {
    return sends.some(
      (s) =>
        s.email === email &&
        s.sequenceStep === 0 &&
        s.prospectId !== prospectId &&
        s.status !== 'bounced' &&
        s.status !== 'queued',
    );
  }

  it('returns false when no prior sends exist for the email', () => {
    expect(isDuplicateInitialSend('info@firm.co.uk', 'fop_a', [])).toBe(false);
  });

  it('returns true when another prospect received the initial send', () => {
    expect(
      isDuplicateInitialSend('info@firm.co.uk', 'fop_a', [
        makeSend({ prospectId: 'fop_other', email: 'info@firm.co.uk' }),
      ]),
    ).toBe(true);
  });

  it('returns false when only follow-up sends exist', () => {
    expect(
      isDuplicateInitialSend('info@firm.co.uk', 'fop_a', [
        makeSend({ prospectId: 'fop_a', sequenceStep: 1, subject: 'Follow-up' }),
      ]),
    ).toBe(false);
  });

  it('returns false for bounced initial sends', () => {
    expect(
      isDuplicateInitialSend('info@firm.co.uk', 'fop_a', [
        makeSend({ status: 'bounced' }),
      ]),
    ).toBe(false);
  });
});

describe('dailySendCap default', () => {
  it('defaults to 50 when env is unset', async () => {
    const prev = process.env.FIRM_OUTREACH_DAILY_CAP;
    delete process.env.FIRM_OUTREACH_DAILY_CAP;
    vi.resetModules();
    const { dailySendCap } = await import('@/lib/firm-outreach/constants');
    expect(dailySendCap()).toBe(50);
    if (prev === undefined) delete process.env.FIRM_OUTREACH_DAILY_CAP;
    else process.env.FIRM_OUTREACH_DAILY_CAP = prev;
  });
});

describe('cronEnrichBatchSize default', () => {
  it('defaults to 25 when env is unset', async () => {
    const prev = process.env.FIRM_OUTREACH_CRON_ENRICH_BATCH;
    delete process.env.FIRM_OUTREACH_CRON_ENRICH_BATCH;
    vi.resetModules();
    const { cronEnrichBatchSize } = await import('@/lib/firm-outreach/constants');
    expect(cronEnrichBatchSize()).toBe(25);
    if (prev === undefined) delete process.env.FIRM_OUTREACH_CRON_ENRICH_BATCH;
    else process.env.FIRM_OUTREACH_CRON_ENRICH_BATCH = prev;
  });
});
