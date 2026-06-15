import { describe, expect, it } from 'vitest';
import {
  activeOutreachCampaignId,
  approvalEmailKey,
  dailySendKeyForCampaign,
  isActiveCampaignProspect,
  isActiveCampaignSend,
} from '@/lib/firm-outreach/campaign-scope';
import { FIRM_OUTREACH_CAMPAIGN_ID } from '@/lib/firm-outreach/constants';
import type { FirmOutreachSend, FirmProspect } from '@/lib/firm-outreach/types';

function prospect(campaignId: string): FirmProspect {
  return {
    id: 'fop_1',
    prospectType: 'firm',
    firmName: 'Test LLP',
    firmKey: 'test',
    email: 'a@b.co.uk',
    sources: ['laa'],
    status: 'ready_to_send',
    priorityScore: 50,
    sequenceStep: 0,
    campaignId,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    enrichAttempts: 0,
  };
}

function send(campaignId: string): FirmOutreachSend {
  return {
    id: 'fos_1',
    prospectId: 'fop_1',
    firmName: 'Test LLP',
    prospectType: 'firm',
    email: 'a@b.co.uk',
    campaignId,
    sequenceStep: 0,
    subject: 'Hello',
    status: 'sent',
    createdAt: '2026-01-01T00:00:00Z',
  };
}

describe('campaign-scope', () => {
  it('uses configured campaign id', () => {
    expect(activeOutreachCampaignId()).toBe(FIRM_OUTREACH_CAMPAIGN_ID);
  });

  it('scopes daily send and approval keys by campaign', () => {
    expect(dailySendKeyForCampaign('2026-06-15')).toContain(FIRM_OUTREACH_CAMPAIGN_ID);
    expect(approvalEmailKey('2026-06-15')).toContain(FIRM_OUTREACH_CAMPAIGN_ID);
  });

  it('filters prospects and sends to active campaign only', () => {
    expect(isActiveCampaignProspect(prospect(FIRM_OUTREACH_CAMPAIGN_ID))).toBe(true);
    expect(isActiveCampaignProspect(prospect('other_campaign'))).toBe(false);
    expect(isActiveCampaignSend(send(FIRM_OUTREACH_CAMPAIGN_ID))).toBe(true);
    expect(isActiveCampaignSend(send('other_campaign'))).toBe(false);
  });
});
