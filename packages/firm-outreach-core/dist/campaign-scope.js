"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCampaignScope = createCampaignScope;
function createCampaignScope(campaignId) {
    return {
        activeOutreachCampaignId() {
            return campaignId;
        },
        isActiveCampaignProspect(prospect) {
            return prospect.campaignId === campaignId;
        },
        isActiveCampaignSend(send) {
            return send.campaignId === campaignId;
        },
        dailySendKeyForCampaign(date) {
            return `firmoutreach:daily:${campaignId}:${date}`;
        },
        approvalEmailKey(date) {
            return `firmoutreach:approval-email:${campaignId}:${date}`;
        },
    };
}
