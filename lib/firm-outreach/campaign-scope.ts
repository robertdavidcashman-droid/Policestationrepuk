import { createCampaignScope } from '@robertcashman/firm-outreach-core';
import { FIRM_OUTREACH_CAMPAIGN_ID } from './site-config';
import type { FirmOutreachSend, FirmProspect } from './types';

export const AGENT_COVER_KENT_CAMPAIGN_ID = 'agent_cover_kent_v1';

const scope = createCampaignScope(FIRM_OUTREACH_CAMPAIGN_ID);
const agentCoverScope = createCampaignScope(AGENT_COVER_KENT_CAMPAIGN_ID);

export const activeOutreachCampaignId = scope.activeOutreachCampaignId;
export const isActiveCampaignProspect = scope.isActiveCampaignProspect;
export const isActiveCampaignSend = scope.isActiveCampaignSend;
export const dailySendKeyForCampaign = scope.dailySendKeyForCampaign;
export const approvalEmailKey = scope.approvalEmailKey;

export function scopeForCampaign(campaignId: string) {
  if (campaignId === AGENT_COVER_KENT_CAMPAIGN_ID) return agentCoverScope;
  return createCampaignScope(campaignId);
}

export function isCampaignProspect(prospect: FirmProspect, campaignId: string): boolean {
  return prospect.campaignId === campaignId;
}

export function isCampaignSend(send: FirmOutreachSend, campaignId: string): boolean {
  return send.campaignId === campaignId;
}

export function dailySendKeyForCampaignId(campaignId: string, date: string): string {
  return scopeForCampaign(campaignId).dailySendKeyForCampaign(date);
}
