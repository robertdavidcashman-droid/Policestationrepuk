import { describe, expect, it } from 'vitest';
import {
  applySharedResendBudget,
  type DryRunPreviewResult,
} from '@/lib/firm-outreach/dry-run-preview';

function stub(partial: Partial<DryRunPreviewResult> & { campaignId: string }): DryRunPreviewResult {
  return {
    date: '2026-07-31',
    dailyCap: 45,
    sentToday: 0,
    remaining: 45,
    resendQuotaRemaining: 10,
    preview: [],
    skipReasons: {},
    wouldSendCount: partial.safeSendLimitNow ?? 0,
    safeSendLimitNow: 0,
    ...partial,
  };
}

describe('applySharedResendBudget', () => {
  it('does not let campaign safe limits exceed shared Resend remaining', () => {
    const result = applySharedResendBudget(
      [
        stub({ campaignId: 'whatsapp_invite_v1', safeSendLimitNow: 8, wouldSendCount: 8 }),
        stub({ campaignId: 'agent_cover_kent_v1', safeSendLimitNow: 5, wouldSendCount: 5 }),
      ],
      10,
    );

    expect(result.campaigns[0]?.safeSendLimitNow).toBe(8);
    expect(result.campaigns[1]?.safeSendLimitNow).toBe(2);
    expect(result.safeSendLimitNow).toBe(10);
    expect(result.wouldSendCount).toBe(13);
  });
});
