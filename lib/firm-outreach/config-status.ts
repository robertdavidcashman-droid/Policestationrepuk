import { existsSync } from 'fs';
import { getKV } from '@/lib/kv';
import { BROCHURE_PUBLIC_PATH } from './brochure/load-attachment';
import { countyAllowlist, dailySendCap, outreachEnabled } from './constants';
import { getOutreachSendHealth } from './outreach/from-address';
import { getOutreachPauseSummary, isOutreachSendAllowed } from './pause-state';

export async function getOutreachConfigStatus() {
  const pause = await getOutreachPauseSummary();
  const sendAllowed = await isOutreachSendAllowed();
  const sendHealth = await getOutreachSendHealth();

  return {
    kvConfigured: Boolean(getKV()),
    resendConfigured: sendHealth.resendConfigured,
    brochureExists: existsSync(BROCHURE_PUBLIC_PATH),
    dryRun: process.env.FIRM_OUTREACH_DRY_RUN === 'true',
    outreachEnabled: outreachEnabled(),
    sendEnabledEnv: process.env.FIRM_OUTREACH_SEND_ENABLED !== 'false',
    sendAllowed,
    sendHealthy: sendHealth.sendHealthy,
    sendBlockers: sendHealth.sendBlockers,
    campaignSendHealth: sendHealth.campaigns,
    verifiedResendDomains: sendHealth.verifiedDomains,
    fromEmail: process.env.FIRM_OUTREACH_FROM_EMAIL?.trim() || null,
    psaFromEmail: process.env.FIRM_OUTREACH_PSA_FROM_EMAIL?.trim() || null,
    digestEmail: process.env.FIRM_OUTREACH_DIGEST_EMAIL?.trim() || null,
    countyAllowlist: countyAllowlist(),
    dailyCap: dailySendCap(),
    cronConfigured: Boolean(process.env.CRON_SECRET?.trim()),
    ...pause,
  };
}
