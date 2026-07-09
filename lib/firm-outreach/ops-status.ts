import { getOutreachConfigStatus } from './config-status';
import { outreachDigestDate, wasOutreachDigestSent } from './outreach/daily-digest';
import { activeOutreachCampaignId } from './campaign-scope';
import {
  getGlobalResendQuotaRemaining,
  getLatestOutreachRunLog,
  getResendSendCount,
} from './storage';

export async function getOutreachOpsStatus(now = new Date()) {
  const utcDate = now.toISOString().slice(0, 10);
  const digestDate = outreachDigestDate(now);
  const campaignId = activeOutreachCampaignId();
  const config = await getOutreachConfigStatus();
  const runLog = await getLatestOutreachRunLog(campaignId);
  const resendSendCount = await getResendSendCount(utcDate);
  const resendQuotaRemaining = await getGlobalResendQuotaRemaining(utcDate);

  return {
    runLog,
    resendSendCount,
    resendQuotaRemaining,
    perSiteDigestSent: await wasOutreachDigestSent(digestDate, campaignId),
    latestFailures: (runLog?.failures ?? []).slice(-20),
    config,
  };
}
