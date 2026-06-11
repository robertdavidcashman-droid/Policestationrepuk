export const FIRM_OUTREACH_UA =
  'PoliceStationRepUK/1.0 (+https://policestationrepuk.org; firm-outreach)';

export const FIRM_OUTREACH_CAMPAIGN_ID = 'whatsapp_invite_v1';

export const CONTACT_PATHS = [
  '/',
  '/contact',
  '/contact-us',
  '/about',
  '/about-us',
  '/criminal-law',
  '/police-station',
  '/criminal-defence',
] as const;

export const REJECTED_EMAIL_LOCALS = new Set([
  'noreply',
  'no-reply',
  'donotreply',
  'careers',
  'recruitment',
  'jobs',
  'privacy',
  'gdpr',
  'accounts',
  'billing',
  'newsletter',
  'marketing',
]);

export const PREFERRED_EMAIL_LOCALS: Record<string, number> = {
  police: 30,
  custody: 30,
  crime: 30,
  criminal: 30,
  duty: 30,
  stations: 30,
  station: 25,
  info: 20,
  enquiries: 20,
  enquiry: 20,
  reception: 20,
  contact: 20,
  admin: 15,
  office: 15,
};

export const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'hotmail.co.uk',
  'outlook.com',
  'live.com',
  'yahoo.com',
  'yahoo.co.uk',
  'icloud.com',
]);

export const EXCLUDED_FIRM_PATTERNS = [
  /public defender service/i,
  /^pds\b/i,
  /crown prosecution/i,
  /^cps\b/i,
];

export const CRIMINAL_KEYWORDS = [
  'police station',
  'custody',
  'criminal defence',
  'criminal defense',
  'duty solicitor',
  'legal aid crime',
  'crime department',
] as const;

export const COMPETITOR_KEYWORDS = [
  'police station agency',
  'cover agency',
  'rep agency',
] as const;

/** Scotland, NI, IoM, Channel Islands — not England & Wales. */
export const NON_EW_POSTCODE_PREFIXES = [
  'AB',
  'BT',
  'DD',
  'DG',
  'EH',
  'FK',
  'G',
  'GY',
  'HS',
  'IM',
  'IV',
  'JE',
  'KA',
  'KW',
  'KY',
  'ML',
  'PA',
  'PH',
  'TD',
  'ZE',
] as const;

/** Master switch for discovery + enrichment crons. */
export function outreachEnabled(): boolean {
  return process.env.FIRM_OUTREACH_ENABLED !== 'false';
}

/** Sends run automatically unless explicitly disabled (FIRM_OUTREACH_SEND_ENABLED=false). */
export function outreachSendEnabled(): boolean {
  return outreachEnabled() && process.env.FIRM_OUTREACH_SEND_ENABLED !== 'false' && !outreachPaused();
}

export function outreachPaused(): boolean {
  return process.env.FIRM_OUTREACH_PAUSED === 'true';
}

export function dailySendCap(): number {
  return Number(process.env.FIRM_OUTREACH_DAILY_CAP ?? 50) || 50;
}

export function enrichBatchSize(): number {
  return Number(process.env.FIRM_OUTREACH_ENRICH_BATCH ?? 150) || 150;
}

export function paidDailyCap(): number {
  return Number(process.env.FIRM_OUTREACH_PAID_DAILY_CAP ?? 50) || 50;
}

export function countyAllowlist(): string[] | null {
  const raw = process.env.FIRM_OUTREACH_COUNTY_ALLOWLIST?.trim();
  if (!raw) return null;
  return raw
    .split(/[,;]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
