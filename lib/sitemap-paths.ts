/**
 * Exact paths from live site sitemap (policestationrepuk.com).
 * Used to generate static pages that mirror the current site for SEO.
 */

/** Exclude reserved Next.js paths (e.g. 500 = error page) */
export const SITEMAP_PATHS: string[] = [
  'About',
  'AboutFounder',
  'Accessibility',
  'AccreditedRepresentativeGuide',
  'Advertisers',
  'Advertising',
  'BeginnersGuide',
  'Blog',
  'BuildPortfolioGuide',
  'CommonOffencesGuide',
  'Complaints',
  'Contact',
  'Cookies',
  'CriminalLawCareerGuide',
  'CrownCourtFees',
  'CustodyNote',
  'DSCCRegistrationGuide',
  'DataProtection',
  'DutySolicitorVsRep',
  'FAQ',
  'Firms',
  'FirmsWhatsAppGroup',
  'Forces',
  'FormsLibrary',
  'Forum',
  'GDPR',
  'GetWork',
  'GettingStarted',
  'GoFeatured',
  'GravesendPoliceStationReps',
  'HowToBecome',
  'HowToBecomePoliceStationRep',
  'ICO',
  'InterviewUnderCaution',
  'Join',
  'KentAgentCover',
  'KentCustodySuites',
  'KentPoliceStationReps',
  'LegalUpdates',
  'MagistratesCourtFees',
  'MaidstonePoliceStationReps',
  'Map',
  'MediaKit',
  'MedwayPoliceStationReps',
  'PACE',
  'PoliceDisclosureGuide',
  'PoliceStationCover',
  'PoliceStationRates',
  'PoliceStationRepJobsUK',
  'PoliceStationRepPay',
  'PoliceStationRepsBerkshire',
  'PoliceStationRepsByCounty',
  'Premium',
  'PrepareForCIT',
  'PrepareForWrittenExam',
  'Privacy',
  'RepFAQMaster',
  'RepsHub',
  'Resources',
  'SevenoaksPoliceStationReps',
  'SolicitorPoliceStationCoverUK',
  'StationsDirectory',
  'HelpUsStationNumbers',
  'UpdateStation',
  'SwanleyPoliceStationReps',
  'Terms',
  'TonbridgePoliceStationReps',
  'WhatDoesRepDo',
  'WhatsApp',
  'Wiki',
  'police-station-representatives-directory-england-wales',
];

/** Human-readable title from path (e.g. "FindYourRep" → "Find Your Rep") */
export function pathToTitle(path: string): string {
  if (path === 'police-station-representatives-directory-england-wales') {
    return 'Police Station Representatives Directory England & Wales';
  }
  return path
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}
