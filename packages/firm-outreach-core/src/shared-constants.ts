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

/**
 * Registrable domains that appear in firm website footers, badges, widgets,
 * directories, review sites, CDNs and analytics — never a firm's own contact
 * address. Crawled emails on these are rejected outright so we don't outreach
 * to e.g. support@crunchbase.com or contact@thegoodsolicitorguide.com.
 */
export const NON_FIRM_EMAIL_DOMAINS = new Set([
  // Legal directories / review / lead-gen sites
  'thegoodsolicitorguide.com',
  'threebestrated.co.uk',
  'reviewsolicitors.co.uk',
  'review-solicitors.co.uk',
  'solicitors.co.uk',
  'yell.com',
  'yelp.com',
  'trustpilot.com',
  'feefo.com',
  'legaladvice2u.co.uk',
  'crunchbase.com',
  'clutch.co',
  // Site builders / hosting / CDNs / analytics / fonts
  'wix.com',
  'wixpress.com',
  'squarespace.com',
  'wordpress.com',
  'automattic.com',
  'godaddy.com',
  'cloudflare.com',
  'sentry.io',
  'latofonts.com',
  'fontawesome.com',
  'googleapis.com',
  'gstatic.com',
  'google.com',
  'gravatar.com',
  'schema.org',
  'w3.org',
  'sentry.wixpress.com',
  // Generic placeholders
  'example.com',
  'example.org',
  'domain.com',
  'email.com',
  'yourdomain.com',
  'sentry-next.wixpress.com',
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

export interface OutreachLimitsDefaults {
  dailyCap?: number;
  enrichBatch?: number;
  cronEnrichBatch?: number;
  enrichMaxMs?: number;
  paidDailyCap?: number;
  countyAllowlist?: string[] | null;
}

export function createOutreachEnvHelpers(defaults: OutreachLimitsDefaults = {}) {
  const countyDefault = defaults.countyAllowlist;

  return {
    outreachEnabled(): boolean {
      return process.env.FIRM_OUTREACH_ENABLED !== 'false';
    },
    outreachPaused(): boolean {
      return process.env.FIRM_OUTREACH_PAUSED === 'true';
    },
    outreachSendEnabled(): boolean {
      return (
        process.env.FIRM_OUTREACH_ENABLED !== 'false' &&
        process.env.FIRM_OUTREACH_SEND_ENABLED !== 'false' &&
        process.env.FIRM_OUTREACH_PAUSED !== 'true'
      );
    },
    outreachRequireApproval(): boolean {
      return process.env.FIRM_OUTREACH_REQUIRE_APPROVAL !== 'false';
    },
    dailySendCap(): number {
      return Number(process.env.FIRM_OUTREACH_DAILY_CAP ?? defaults.dailyCap ?? 50) || 50;
    },
    enrichBatchSize(): number {
      return Number(process.env.FIRM_OUTREACH_ENRICH_BATCH ?? defaults.enrichBatch ?? 150) || 150;
    },
    cronEnrichBatchSize(): number {
      return (
        Number(process.env.FIRM_OUTREACH_CRON_ENRICH_BATCH ?? defaults.cronEnrichBatch ?? 10) || 10
      );
    },
    enrichMaxElapsedMs(): number {
      return (
        Number(process.env.FIRM_OUTREACH_ENRICH_MAX_MS ?? defaults.enrichMaxMs ?? 90_000) || 90_000
      );
    },
    paidDailyCap(): number {
      return Number(process.env.FIRM_OUTREACH_PAID_DAILY_CAP ?? defaults.paidDailyCap ?? 50) || 50;
    },
    countyAllowlist(): string[] | null {
      const raw = process.env.FIRM_OUTREACH_COUNTY_ALLOWLIST?.trim();
      if (!raw) return countyDefault ?? null;
      return raw
        .split(/[,;]/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    },
  };
}
