import { createOutreachEnvHelpers } from '@robertcashman/firm-outreach-core';

export { FIRM_OUTREACH_UA, FIRM_OUTREACH_CAMPAIGN_ID } from './site-config';

export {
  COMPETITOR_KEYWORDS,
  CONTACT_PATHS,
  CRIMINAL_KEYWORDS,
  EXCLUDED_FIRM_PATTERNS,
  FREE_EMAIL_DOMAINS,
  NON_EW_POSTCODE_PREFIXES,
  PREFERRED_EMAIL_LOCALS,
  REJECTED_EMAIL_LOCALS,
} from '@robertcashman/firm-outreach-core';

const env = createOutreachEnvHelpers({
  countyAllowlist: null,
  cronEnrichBatch: 50,
  enrichMaxMs: 270_000,
  paidDailyCap: 150,
  dailyCap: 150,
});

export const outreachEnabled = env.outreachEnabled;
export const outreachSendEnabled = env.outreachSendEnabled;
export const outreachPaused = env.outreachPaused;
export const outreachRequireApproval = env.outreachRequireApproval;
export const dailySendCap = env.dailySendCap;
export const enrichBatchSize = env.enrichBatchSize;
export const cronEnrichBatchSize = env.cronEnrichBatchSize;
export const enrichMaxElapsedMs = env.enrichMaxElapsedMs;
export const paidDailyCap = env.paidDailyCap;
export const countyAllowlist = env.countyAllowlist;
