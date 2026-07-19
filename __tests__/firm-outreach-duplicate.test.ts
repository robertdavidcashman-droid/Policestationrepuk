import { describe, expect, it, vi } from 'vitest';
import { emailHasInitialOutreachFromOtherProspect } from '@/lib/firm-outreach/storage';
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

describe('emailHasInitialOutreachFromOtherProspect', () => {
  it('returns false when no prior sends exist for the email', () => {
    expect(
      emailHasInitialOutreachFromOtherProspect([], 'info@firm.co.uk', 'fop_a'),
    ).toBe(false);
  });

  it('returns true when another prospect received the initial send', () => {
    expect(
      emailHasInitialOutreachFromOtherProspect(
        [makeSend({ prospectId: 'fop_other', email: 'info@firm.co.uk' })],
        'info@firm.co.uk',
        'fop_a',
      ),
    ).toBe(true);
  });

  it('matches email case-insensitively', () => {
    expect(
      emailHasInitialOutreachFromOtherProspect(
        [makeSend({ prospectId: 'fop_other', email: 'Info@Firm.co.uk' })],
        'info@firm.co.uk',
        'fop_a',
      ),
    ).toBe(true);
  });

  it('returns false when only follow-up sends exist', () => {
    expect(
      emailHasInitialOutreachFromOtherProspect(
        [makeSend({ prospectId: 'fop_a', sequenceStep: 1, subject: 'Follow-up' })],
        'info@firm.co.uk',
        'fop_a',
      ),
    ).toBe(false);
  });

  it('returns false for bounced initial sends', () => {
    expect(
      emailHasInitialOutreachFromOtherProspect(
        [makeSend({ status: 'bounced' })],
        'info@firm.co.uk',
        'fop_a',
      ),
    ).toBe(false);
  });

  it('returns false when the same prospect received the initial send', () => {
    expect(
      emailHasInitialOutreachFromOtherProspect(
        [makeSend({ prospectId: 'fop_a' })],
        'info@firm.co.uk',
        'fop_a',
      ),
    ).toBe(false);
  });
});

describe('dailySendCap default', () => {
  it('defaults to 150 when env is unset', async () => {
    const prev = process.env.FIRM_OUTREACH_DAILY_CAP;
    delete process.env.FIRM_OUTREACH_DAILY_CAP;
    vi.resetModules();
    const { dailySendCap } = await import('@/lib/firm-outreach/constants');
    expect(dailySendCap()).toBe(150);
    if (prev === undefined) delete process.env.FIRM_OUTREACH_DAILY_CAP;
    else process.env.FIRM_OUTREACH_DAILY_CAP = prev;
  });
});

describe('cronEnrichBatchSize default', () => {
  it('defaults to 50 when env is unset', async () => {
    const prev = process.env.FIRM_OUTREACH_CRON_ENRICH_BATCH;
    delete process.env.FIRM_OUTREACH_CRON_ENRICH_BATCH;
    vi.resetModules();
    const { cronEnrichBatchSize } = await import('@/lib/firm-outreach/constants');
    expect(cronEnrichBatchSize()).toBe(60);
    if (prev === undefined) delete process.env.FIRM_OUTREACH_CRON_ENRICH_BATCH;
    else process.env.FIRM_OUTREACH_CRON_ENRICH_BATCH = prev;
  });
});

describe('paidDailyCap default', () => {
  it('defaults to 150 when env is unset', async () => {
    const prev = process.env.FIRM_OUTREACH_PAID_DAILY_CAP;
    delete process.env.FIRM_OUTREACH_PAID_DAILY_CAP;
    vi.resetModules();
    const { paidDailyCap } = await import('@/lib/firm-outreach/constants');
    expect(paidDailyCap()).toBe(150);
    if (prev === undefined) delete process.env.FIRM_OUTREACH_PAID_DAILY_CAP;
    else process.env.FIRM_OUTREACH_PAID_DAILY_CAP = prev;
  });
});

describe('outreachRequireApproval default', () => {
  it('defaults to false (auto-send) when env is unset', async () => {
    const prev = process.env.FIRM_OUTREACH_REQUIRE_APPROVAL;
    delete process.env.FIRM_OUTREACH_REQUIRE_APPROVAL;
    vi.resetModules();
    const { outreachRequireApproval } = await import('@/lib/firm-outreach/constants');
    expect(outreachRequireApproval()).toBe(false);
    if (prev === undefined) delete process.env.FIRM_OUTREACH_REQUIRE_APPROVAL;
    else process.env.FIRM_OUTREACH_REQUIRE_APPROVAL = prev;
  });

  it('returns true when explicitly enabled', async () => {
    process.env.FIRM_OUTREACH_REQUIRE_APPROVAL = 'true';
    vi.resetModules();
    const { outreachRequireApproval } = await import('@/lib/firm-outreach/constants');
    expect(outreachRequireApproval()).toBe(true);
    delete process.env.FIRM_OUTREACH_REQUIRE_APPROVAL;
  });
});
