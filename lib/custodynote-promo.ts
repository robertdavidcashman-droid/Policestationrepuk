/** Central Custody Note conversion URLs, pricing and copy (UTM for funnel attribution). */
const UTM = 'utm_source=policestationrepuk&utm_medium=web&utm_campaign=directory';

/** User-facing product name — matches custodynote.com. */
export const CUSTODYNOTE_BRAND_NAME = 'Custody Note';

export const CUSTODYNOTE_SITE = 'https://custodynote.com';
export const CUSTODYNOTE_DOWNLOAD_HREF = `${CUSTODYNOTE_SITE}/download?${UTM}`;
/** Primary trial CTA — custodynote.com/download is the canonical install path. */
export const CUSTODYNOTE_TRIAL_HREF = CUSTODYNOTE_DOWNLOAD_HREF;
export const CUSTODYNOTE_PRICING_HREF = `${CUSTODYNOTE_SITE}/pricing?${UTM}`;
/** Browser/PWA early-access landing page for non-desktop platforms. */
export const CUSTODYNOTE_ANYWHERE_HREF = `${CUSTODYNOTE_SITE}/custodynote-anywhere?${UTM}`;
export const CUSTODYNOTE_ANYWHERE_NAME = 'Custody Note Anywhere';
export const CUSTODYNOTE_ANYWHERE_TAGLINE =
  'Early-access browser/PWA option for Chromebook, iPad and Android — when you cannot install desktop software';

/** Current release published on custodynote.com (see custody-note-website/data/releases.json). */
export const CUSTODYNOTE_VERSION = '1.9.11';

export const CUSTODYNOTE_PLATFORM_LINE =
  'Windows 10+ and macOS 11+ (Apple Silicon and Intel)';

/** Headline subscription price as advertised on custodynote.com. */
export const CUSTODYNOTE_PRICE_GBP = '15.99';
/** Discounted price for PSR UK readers using the member code (15.99 × 0.75 ≈ 11.99). */
export const CUSTODYNOTE_MEMBER_PRICE_GBP = '11.99';
/** Member discount code surfaced exclusively on PoliceStationRepUK. */
export const CUSTODYNOTE_DISCOUNT_CODE = 'A2MJY2NQ';
export const CUSTODYNOTE_DISCOUNT_PCT = 25;

/** Trial length, kept in one place so banners/CTAs cannot drift. */
export const CUSTODYNOTE_TRIAL_DAYS = 30;
export const CUSTODYNOTE_TRIAL_LABEL = '30-day free trial';
export const CUSTODYNOTE_TRIAL_CTA = 'Start 30-Day Free Trial';
export const CUSTODYNOTE_DOWNLOAD_CTA = 'Download Free 30-Day Trial';

/** Short reusable phrases for headers / banners — aligned with custodynote.com product copy. */
export const CUSTODYNOTE_TAGLINE =
  'Structured custody attendance notes, built for criminal defence work';

export const CUSTODYNOTE_SHORT_DESCRIPTION =
  'Digital note-taking and workflow tool for criminal defence professionals attending police stations and managing pre-charge case preparation.';

export const CUSTODYNOTE_MEMBER_DEAL =
  `PSR UK readers pay £${CUSTODYNOTE_MEMBER_PRICE_GBP}/mo with code ${CUSTODYNOTE_DISCOUNT_CODE} (${CUSTODYNOTE_DISCOUNT_PCT}% off)`;

export const CUSTODYNOTE_MAC_NOTE =
  'Native Mac and Windows desktop apps — download from custodynote.com';

export const CUSTODYNOTE_ANYWHERE_NOTE =
  'On Chromebook, iPad or Android? Custody Note Anywhere is an early-access browser alternative.';

export const TOP_BANNER_TEXT =
  'Structured custody attendance notes for criminal defence work — try Custody Note free for 30 days';

export const INLINE_CTA_HEADLINE = 'Stop rewriting custody notes at 2am';
export const INLINE_CTA_BULLETS = [
  'PACE-aligned structured sections',
  'Works offline at the custody desk',
  'PDF + LAA billing in one record',
] as const;

export const LEAD_MAGNET_TITLE = 'Free UK police station attendance note template';
