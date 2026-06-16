import type { FirmOutreachSend, FirmProspect } from './types';
export declare function createCampaignScope(campaignId: string): {
    activeOutreachCampaignId(): string;
    isActiveCampaignProspect(prospect: FirmProspect): boolean;
    isActiveCampaignSend(send: FirmOutreachSend): boolean;
    dailySendKeyForCampaign(date: string): string;
    approvalEmailKey(date: string): string;
};
export type CampaignScope = ReturnType<typeof createCampaignScope>;
//# sourceMappingURL=campaign-scope.d.ts.map