import { FIRM_OUTREACH_CAMPAIGN_ID } from './constants';
import type { FirmOutreachSend, FirmProspect } from './types';

export function activeOutreachCampaignId(): string {
  return FIRM_OUTREACH_CAMPAIGN_ID;
}

export function isActiveCampaignProspect(prospect: FirmProspect): boolean {
  return prospect.campaignId === activeOutreachCampaignId();
}

export function isActiveCampaignSend(send: FirmOutreachSend): boolean {
  return send.campaignId === activeOutreachCampaignId();
}

export function dailySendKeyForCampaign(date: string): string {
  return `firmoutreach:daily:${activeOutreachCampaignId()}:${date}`;
}

export function approvalEmailKey(date: string): string {
  return `firmoutreach:approval-email:${activeOutreachCampaignId()}:${date}`;
}
