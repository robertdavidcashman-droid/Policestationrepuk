export const LEGAL_DIRECTORY_BASE = '/legal-services-directory';

/** Legal Services Directory category slug for police station representatives. */
export const PSR_LEGAL_DIRECTORY_CATEGORY_SLUG = 'police-station-representatives';

/** Legal Services Directory category slug for criminal defence solicitors (LAA stubs). */
export const SOLICITORS_LEGAL_DIRECTORY_CATEGORY_SLUG = 'solicitors';

/** Canonical public path for the solicitors category hub (retired `/Firms` redirect target). */
export const SOLICITORS_CATEGORY_PATH = `${LEGAL_DIRECTORY_BASE}/category/${SOLICITORS_LEGAL_DIRECTORY_CATEGORY_SLUG}`;

/** Main rep directory paths (live accredited rep listings — separate from legal directory KV). */
export const REP_DIRECTORY_LINKS = {
  find: '/directory',
  counties: '/directory/counties',
  register: '/register',
  nationalLanding: '/police-station-representatives-directory-england-wales',
  accreditedGuide: '/AccreditedRepresentativeGuide',
  becomeRepGuide: '/HowToBecomePoliceStationRep',
  psrasResources: `${LEGAL_DIRECTORY_BASE}/resources`,
} as const;

export const DESCRIPTION_MIN = 80;
export const DESCRIPTION_MAX = 4000;
export const MAX_LINKS_IN_DESCRIPTION = 3;
export const MANAGEMENT_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const LEGAL_DIRECTORY_DISCLAIMER =
  'This directory is provided for information only. Inclusion in the directory does not amount to a recommendation, endorsement, or legal advice. Users should make their own enquiries and check the regulatory status, experience, and suitability of any provider before instructing them.';

export const UK_REGIONS = [
  'East of England',
  'East Midlands',
  'London',
  'North East',
  'North West',
  'South East',
  'South West',
  'West Midlands',
  'Yorkshire and the Humber',
  'Wales',
  'Scotland',
  'Northern Ireland',
] as const;
