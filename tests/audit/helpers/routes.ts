/**
 * Static list of audit entry points and known categorisations used across the audit
 * suite. We keep this hand-curated (rather than fully derived) so the audit always
 * exercises the high-value journeys even if a regression breaks discovery itself.
 */

/**
 * Audit entry points used by most specs. Keep this list tight — it is hammered by the
 * link-audit and SEO specs sequentially. Add new top-level navigational pages here.
 * Large index pages with hundreds of dynamic children (e.g. /StationsDirectory) are
 * intentionally excluded so the link audit terminates in a couple of minutes.
 */
export const ENTRY_POINTS: string[] = [
  '/',
  '/Resources',
  '/Blog',
  '/HowToBecomePoliceStationRep',
  '/Contact',
  '/About',
  '/directory',
  '/register',
  '/Account',
  '/FAQ',
  '/Wiki',
  '/PACE',
  '/FormsLibrary',
];

/** Pages powered by the CrawlContent component — must render real headings + sections. */
export const CRAWL_CONTENT_PAGES: string[] = [
  '/HowToBecomePoliceStationRep',
  '/HowToBecome',
  '/BeginnersGuide',
  '/GetWork',
  '/DSCCRegistrationGuide',
  '/PrepareForCIT',
  '/BuildPortfolioGuide',
  '/CriminalLawCareerGuide',
  '/AccreditedRepresentativeGuide',
  '/DutySolicitorVsRep',
  '/PoliceDisclosureGuide',
  '/WhatDoesRepDo',
  '/InterviewUnderCaution',
  '/GettingStarted',
];

/** Core pages used for responsive + a11y + console assertions. */
export const CORE_PAGES: string[] = [
  '/',
  '/Resources',
  '/Blog',
  '/HowToBecomePoliceStationRep',
  '/Contact',
  '/About',
  '/directory',
  '/register',
  '/links',
  '/rep/robert-cashman',
];

/** Viewports for responsive checks. */
export const VIEWPORTS = [
  { name: 'phone-se', width: 320, height: 568 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide', width: 1920, height: 1080 },
] as const;
