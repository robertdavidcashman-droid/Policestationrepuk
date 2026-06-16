import type { FirmOutreachSend, FirmProspect } from './types';

export function createCampaignScope(campaignId: string) {
  return {
    activeOutreachCampaignId(): string {
      return campaignId;
    },
    isActiveCampaignProspect(prospect: FirmProspect): boolean {
      return prospect.campaignId === campaignId;
    },
    isActiveCampaignSend(send: FirmOutreachSend): boolean {
      return send.campaignId === campaignId;
    },
    dailySendKeyForCampaign(date: string): string {
      return `firmoutreach:daily:${campaignId}:${date}`;
    },
    approvalEmailKey(date: string): string {
      return `firmoutreach:approval-email:${campaignId}:${date}`;
    },
  };
}

export type CampaignScope = ReturnType<typeof createCampaignScope>;
