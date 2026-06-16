import { createCampaignScope } from '@robertcashman/firm-outreach-core';
import { FIRM_OUTREACH_CAMPAIGN_ID } from './site-config';

const scope = createCampaignScope(FIRM_OUTREACH_CAMPAIGN_ID);

export const activeOutreachCampaignId = scope.activeOutreachCampaignId;
export const isActiveCampaignProspect = scope.isActiveCampaignProspect;
export const isActiveCampaignSend = scope.isActiveCampaignSend;
export const dailySendKeyForCampaign = scope.dailySendKeyForCampaign;
export const approvalEmailKey = scope.approvalEmailKey;
