export const LEGAL_DIRECTORY_BASE = '/legal-services-directory';

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
