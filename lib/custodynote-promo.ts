/** Central CustodyNote conversion URLs, pricing and copy (UTM for funnel attribution). */
const UTM = 'utm_source=policestationrepuk&utm_medium=web&utm_campaign=directory';

export const CUSTODYNOTE_SITE = 'https://custodynote.com';
export const CUSTODYNOTE_TRIAL_HREF = `${CUSTODYNOTE_SITE}/?${UTM}`;
export const CUSTODYNOTE_PRICING_HREF = `${CUSTODYNOTE_SITE}/pricing?${UTM}`;
/** Mac / Chromebook / iPad / Android waitlist landing page (planned browser-based version). */
export const CUSTODYNOTE_ANYWHERE_HREF = `${CUSTODYNOTE_SITE}/custodynote-anywhere?${UTM}`;
export const CUSTODYNOTE_ANYWHERE_NAME = 'CustodyNote Anywhere';
export const CUSTODYNOTE_ANYWHERE_TAGLINE =
  'Planned browser-based version for Mac, Chromebook, iPad and Android — register interest';

/** Current installer version published on custodynote.com. */
export const CUSTODYNOTE_VERSION = '1.4.219';
export const CUSTODYNOTE_DOWNLOAD_HREF =
  `https://github.com/robertcashman-bit/custody-note-app/releases/download/v${CUSTODYNOTE_VERSION}/Custody-Note-Setup-${CUSTODYNOTE_VERSION}.exe`;

/** Headline subscription price as advertised on custodynote.com. */
export const CUSTODYNOTE_PRICE_GBP = '15.99';
/** Discounted price for PSR UK readers using the member code (15.99 × 0.75 ≈ 11.99). */
export const CUSTODYNOTE_MEMBER_PRICE_GBP = '11.99';
/** Member discount code surfaced exclusively on PoliceStationRepUK. */
export const CUSTODYNOTE_DISCOUNT_CODE = 'A2MJY2NQ';
export const CUSTODYNOTE_DISCOUNT_PCT = 25;

/** Trial length, kept in one place so banners/CTAs cannot drift. */
export const CUSTODYNOTE_TRIAL_DAYS = 30;

/** Short reusable phrases for headers / banners. */
export const CUSTODYNOTE_TAGLINE =
  'PACE-aligned police station attendance notes — built for UK custody work';
export const CUSTODYNOTE_MEMBER_DEAL =
  `PSR UK readers pay £${CUSTODYNOTE_MEMBER_PRICE_GBP}/mo with code ${CUSTODYNOTE_DISCOUNT_CODE} (${CUSTODYNOTE_DISCOUNT_PCT}% off)`;

export const TOP_BANNER_TEXT =
  'Write structured PACE custody notes in 3 minutes — try CustodyNote free for 30 days';

export const INLINE_CTA_HEADLINE = 'Stop rewriting custody notes at 2am';
export const INLINE_CTA_BULLETS = [
  'PACE-aligned structured sections',
  'Works offline at the custody desk',
  'PDF + LAA billing in one record',
] as const;

export const LEAD_MAGNET_TITLE = 'Free UK police station attendance note template';
