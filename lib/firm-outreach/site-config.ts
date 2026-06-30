/** Site-specific firm-outreach identity (no imports — avoids circular init). */
export const FIRM_OUTREACH_UA =
  'PoliceStationRepUK/1.0 (+https://policestationrepuk.org; firm-outreach)';

export const FIRM_OUTREACH_CAMPAIGN_ID = 'whatsapp_invite_v1';

/** All outreach campaigns sharing this KV (RepUK + PSA). */
export const OUTREACH_CAMPAIGN_IDS = [
  'whatsapp_invite_v1',
  'agent_cover_kent_v1',
] as const;
