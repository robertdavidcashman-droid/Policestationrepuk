import { existsSync } from 'fs';
import { getKV } from '@/lib/kv';
import { BROCHURE_PUBLIC_PATH } from './brochure/load-attachment';
import { countyAllowlist, dailySendCap, outreachEnabled } from './constants';
import { getOutreachPauseSummary, isOutreachSendAllowed } from './pause-state';

export async function getOutreachConfigStatus() {
  const pause = await getOutreachPauseSummary();
  const sendAllowed = await isOutreachSendAllowed();

  return {
    kvConfigured: Boolean(getKV()),
    resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    brochureExists: existsSync(BROCHURE_PUBLIC_PATH),
    dryRun: process.env.FIRM_OUTREACH_DRY_RUN === 'true',
    outreachEnabled: outreachEnabled(),
    sendEnabledEnv: process.env.FIRM_OUTREACH_SEND_ENABLED !== 'false',
    sendAllowed,
    fromEmail: process.env.FIRM_OUTREACH_FROM_EMAIL?.trim() || null,
    digestEmail: process.env.FIRM_OUTREACH_DIGEST_EMAIL?.trim() || null,
    countyAllowlist: countyAllowlist(),
    dailyCap: dailySendCap(),
    cronConfigured: Boolean(process.env.CRON_SECRET?.trim()),
    ...pause,
  };
}
