import { BLOG_CATEGORIES } from '@/lib/blog/categories';
import { CUSTODYNOTE_TRIAL_HREF } from '@/lib/custodynote-promo';
import { POLICESTATIONAGENT_HOME_HREF } from '@/lib/policestationagent-promo';
import { SUPPORT_MAILTO_HREF } from '@/lib/site-contact';
import { PSRTRAIN_TRAINING_HREF } from '@/lib/psrtrain-promo';

/**
 * Navigation & footer definitions locked to policestationrepuk.com structure.
 * Header: docs/live-site-map.json → navigation.primary (labels + order + hrefs).
 * Footer: homepage crawl data/page-content.json (sections Directories / For Reps /
 * Tools & Resources / Community + legal links + regulatory block).
 */

export type HeaderNavLink = { href: string; text: string; external?: boolean };
export type FooterLink = { href: string; label: string; external?: boolean };

function footerLinksToNav(links: readonly FooterLink[]): HeaderNavLink[] {
  return links.map(({ href, label, external }) => ({ href, text: label, external }));
}

/** Always-visible desktop header links (high-traffic destinations). */
export const HEADER_NAV_PRIMARY: HeaderNavLink[] = [
  { href: '/', text: 'Home' },
  { href: '/directory', text: 'Find a Rep' },
  { href: '/CustodyNote', text: 'Custody Note' },
];

/** Blog hub + topic filters for the header Blog menu. */
export const HEADER_NAV_BLOG_LINKS: HeaderNavLink[] = [
  { href: '/Blog', text: 'All articles' },
  ...BLOG_CATEGORIES.map((c) => ({
    href: `/Blog?cat=${c.id}`,
    text: c.label,
  })),
  { href: '/rss.xml', text: 'RSS feed' },
];

/** Community group — WhatsApp number (same as Robert Cashman directory mobile; not shown on generic /Contact). */
export const COMMUNITY_EMAIL = 'robertcashman@defencelegalservices.co.uk';
export const WHATSAPP_JOIN_PHONE = '07535 494446';
/** Single community group for accredited reps and verified criminal defence firms (same chat). */
export const WHATSAPP_JOIN_URL =
  'https://wa.me/447535494446?text=Hi%2C%20I%27d%20like%20to%20join%20the%20PoliceStationRepUK%20WhatsApp%20group%20(reps%20and%20firms).%20My%20name%20is%20';
/** Pre-filled message when a criminal defence firm requests to join (same group as WHATSAPP_JOIN_URL). */
export const WHATSAPP_FIRM_JOIN_URL =
  'https://wa.me/447535494446?text=Hi%2C%20we%20are%20a%20criminal%20defence%20firm%20and%20would%20like%20to%20join%20the%20PoliceStationRepUK%20WhatsApp%20group%20for%20police%20station%20cover.%20Firm%20name%3A%20';
/** Pre-filled message for criminal defence solicitors / duty solicitors joining the same group. */
export const WHATSAPP_SOLICITOR_JOIN_URL =
  'https://wa.me/447535494446?text=Hi%2C%20I%20am%20a%20criminal%20defence%20solicitor%20and%20would%20like%20to%20join%20the%20PoliceStationRepUK%20WhatsApp%20group.%20Firm%20name%3A%20';

/** Audience-specific join guides (SEO landing pages). */
export const WHATSAPP_PAGE_REPS = '/WhatsApp/reps';
export const WHATSAPP_PAGE_SOLICITORS = '/WhatsApp/solicitors';
export const WHATSAPP_PAGE_FIRMS = '/WhatsApp/firms';
/** @deprecated Use WHATSAPP_FIRM_JOIN_URL for firm CTAs. Same group; firm-specific prefill. */
export const WHATSAPP_FIRMS_JOIN_URL = WHATSAPP_FIRM_JOIN_URL;
export const FACEBOOK_GROUP_URL =
  'https://www.facebook.com/groups/policestationrepuk';

/** Right-rail actions on live Wix header */
export const HEADER_HELP_HREF = '/FAQ';
export const HEADER_LOGIN_HREF = '/Account';

/** Share strip CTA — same wording as current live footer/header behaviour */
export const HEADER_SHARE_LABEL = 'Share this directory with colleagues';
export const HEADER_SHARE_LABEL_COPIED = 'Link copied!';

/** Mobile duplicate CTA (mirrors prominent join button on source) */
export const HEADER_MOBILE_CTA_HREF = '/register';
export const HEADER_MOBILE_CTA_TEXT = 'Join the Directory (Free)';

/** Footer column “Directories” — link labels from data/page-content.json (/) */
export const FOOTER_DIRECTORIES: FooterLink[] = [
  { href: '/directory', label: 'Find a Rep' },
  { href: '/legal-services-directory', label: 'Legal Services Directory' },
  { href: '/search', label: 'Search directory' },
  { href: '/StationsDirectory', label: 'Station Numbers' },
  { href: '/HelpUsStationNumbers', label: 'Help us — station numbers' },
  { href: '/Forces', label: 'Police Forces' },
  { href: '/legal-services-directory/category/solicitors', label: 'Criminal Defence Solicitors' },
  { href: '/Map', label: 'Interactive Map' },
  { href: '/UpdateStation', label: 'Report station phone number' },
];

/** PSRAS accreditation study guides — promoted in header For Reps menu. */
export const HEADER_NAV_PSRAS: HeaderNavLink[] = [
  { href: '/PrepareForWrittenExam', text: 'PSRAS Written Exam Guide' },
  { href: '/BuildPortfolioGuide', text: 'PSRAS Portfolio Guide' },
  { href: '/PrepareForCIT', text: 'PSRAS CIT Exam Guide' },
  { href: '/HowToBecomePoliceStationRep', text: 'How to Become a Rep (2026)' },
  { href: '/FindSupervisingSolicitor', text: 'Find a Supervising Solicitor' },
];

/** Footer column “For Reps” — order & labels from homepage crawl */
export const FOOTER_FOR_REPRESENTATIVES: FooterLink[] = [
  { href: '/register', label: 'Join the Directory (Free)' },
  { href: '/Profile', label: 'My Profile' },
  { href: '/GoFeatured', label: 'Become Featured' },
  { href: '/PoliceStationRepJobsUK', label: 'Rep Jobs UK' },
  { href: '/PrepareForWrittenExam', label: 'PSRAS Written Exam Guide' },
  { href: '/BuildPortfolioGuide', label: 'PSRAS Portfolio Guide' },
  { href: '/PrepareForCIT', label: 'PSRAS CIT Exam Guide' },
  { href: '/HowToBecomePoliceStationRep', label: 'How to Become a Rep' },
  { href: '/FindSupervisingSolicitor', label: 'Find a Supervising Solicitor' },
  { href: '/GettingStarted', label: 'Getting Started' },
  { href: '/BeginnersGuide', label: "Beginner's Guide" },
  { href: '/WhatDoesRepDo', label: 'What Does a Rep Do?' },
  { href: '/DutySolicitorVsRep', label: 'Duty Solicitor vs Rep' },
  { href: '/AccreditedRepresentativeGuide', label: 'Accredited Representative Guide' },
  { href: '/CriminalLawCareerGuide', label: 'Criminal Law Career Guide' },
  { href: '/GetWork', label: 'Get Work Guide' },
  { href: '/DSCCRegistrationGuide', label: 'DSCC Registration Guide' },
  { href: PSRTRAIN_TRAINING_HREF, label: 'PSR Train — exam prep', external: true },
  { href: '/PoliceStationCover', label: 'Police Station Cover (Firms)' },
];

/** Training & reference guides — header “Guides” menu + footer tools block. */
export const HEADER_NAV_GUIDES: HeaderNavLink[] = [
  { href: '/Resources', text: 'Knowledge Centre (all resources)' },
  { href: '/PrepareForWrittenExam', text: 'PSRAS Written Exam Guide' },
  { href: '/BuildPortfolioGuide', text: 'PSRAS Portfolio Guide' },
  { href: '/PrepareForCIT', text: 'PSRAS CIT Exam Guide' },
  { href: '/Wiki', text: 'Rep Wiki' },
  { href: '/CommonOffencesGuide', text: 'Common Offences Guide' },
  { href: '/BeginnersGuide', text: "Beginner's Guide" },
  { href: '/PACE', text: 'PACE Codes' },
  { href: '/InterviewUnderCaution', text: 'Interview Under Caution' },
  { href: '/PoliceDisclosureGuide', text: 'Police Disclosure Guide' },
  { href: '/LegalUpdates', text: 'Legal Updates' },
  { href: '/RepFAQMaster', text: 'Rep FAQ' },
  { href: '/FAQ', text: 'Help & FAQ' },
  { href: '/police-station-rights-uk', text: 'Police station rights UK' },
  { href: '/free-legal-advice-police-station', text: 'Free legal advice (police station)' },
];

/** Fees, billing & forms — header “Fees & Forms” menu. */
export const HEADER_NAV_FEES_FORMS: HeaderNavLink[] = [
  { href: '/PoliceStationRates', text: 'Station Rates (2025/26)' },
  { href: '/PoliceStationRepPay', text: 'Rep Pay Explained' },
  { href: '/EscapeFeeCalculator', text: 'Escape Fee Calculator' },
  { href: '/MagistratesCourtFees', text: "Magistrates' Court Fees" },
  { href: '/CrownCourtFees', text: 'Crown Court Fees' },
  { href: '/FormsLibrary', text: 'Forms Library' },
  { href: '/DSCCRegistrationGuide', text: 'DSCC Registration Guide' },
];

function dedupeNavLinks(links: HeaderNavLink[]): HeaderNavLink[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
}

/** Footer column “Community” — order from homepage crawl (/) */
export const FOOTER_COMMUNITY: FooterLink[] = [
  { href: '/guided-assistant', label: 'Guided assistant' },
  { href: '/WhatsApp', label: 'WhatsApp group — overview' },
  { href: WHATSAPP_PAGE_REPS, label: 'Join WhatsApp — reps' },
  { href: WHATSAPP_PAGE_SOLICITORS, label: 'Join WhatsApp — solicitors' },
  { href: WHATSAPP_PAGE_FIRMS, label: 'Join WhatsApp — firms' },
  { href: FACEBOOK_GROUP_URL, label: 'Facebook Group', external: true },
  { href: '/Forum', label: 'Community Forum' },
  { href: '/Blog', label: 'Blog' },
  { href: SUPPORT_MAILTO_HREF, label: 'Email support', external: true },
  { href: '/Contact', label: 'Contact Us' },
  { href: '/FAQ', label: 'Help & FAQ' },
];

/** Footer legal column — order & labels from homepage crawl */
export const FOOTER_LEGAL: FooterLink[] = [
  { href: '/About', label: 'About' },
  {
    href: '/police-station-representatives-directory-england-wales',
    label: 'About the PoliceStationRepUK Directory',
  },
  { href: '/Advertising', label: 'Advertising & Promotions Disclosure' },
  { href: '/Terms', label: 'Terms' },
  { href: '/Privacy', label: 'Privacy' },
  { href: '/Cookies', label: 'Cookies' },
  { href: '/GDPR', label: 'GDPR' },
  { href: '/DataProtection', label: 'Data Protection' },
  { href: '/Accessibility', label: 'Accessibility' },
  { href: '/Complaints', label: 'Complaints' },
];

/** Partner tools, directories, community, legal & SEO landing pages — header “More” menu. */
export const HEADER_NAV_MORE: HeaderNavLink[] = dedupeNavLinks([
  { href: '/links', text: 'Quick links hub' },
  { href: '/guided-assistant', text: 'Guided assistant' },
  ...footerLinksToNav(FOOTER_DIRECTORIES),
  ...footerLinksToNav(FOOTER_COMMUNITY),
  ...footerLinksToNav(FOOTER_LEGAL),
  { href: '/CustodyNote', text: 'Custody Note — overview' },
  { href: CUSTODYNOTE_TRIAL_HREF, text: 'Custody Note — free trial', external: true },
  { href: PSRTRAIN_TRAINING_HREF, text: 'PSR Train (PSRAS prep)', external: true },
  { href: POLICESTATIONAGENT_HOME_HREF, text: 'Police Station Agent — solicitors', external: true },
  { href: '/police-station-representative', text: 'Police station representative' },
  { href: '/criminal-solicitor-police-station', text: 'Criminal solicitor — police station' },
  { href: '/police-station-rep-kent', text: 'Police station rep — Kent' },
  { href: '/police-station-rep-london', text: 'Police station rep — London' },
  { href: '/police-station-rep-essex', text: 'Police station rep — Essex' },
  { href: '/Blog', text: 'Professional blog' },
]);

/** Footer column “Guides” — mirrors header Guides menu. */
export const FOOTER_GUIDES: FooterLink[] = HEADER_NAV_GUIDES.map(({ href, text, external }) => ({
  href,
  label: text.replace(' (all resources)', ''),
  external,
}));

/** Footer column “Fees & forms” — mirrors header Fees & Forms menu. */
export const FOOTER_FEES_FORMS: FooterLink[] = HEADER_NAV_FEES_FORMS.map(({ href, text, external }) => ({
  href,
  label: text,
  external,
}));

/** Footer column “Partners & SEO” — unique partner/SEO links only (not duplicated in other columns). */
export const FOOTER_PARTNERS: FooterLink[] = [
  { href: '/links', label: 'Quick links hub' },
  { href: '/CustodyNote', label: 'Custody Note — overview' },
  { href: CUSTODYNOTE_TRIAL_HREF, label: 'Custody Note — free trial', external: true },
  { href: PSRTRAIN_TRAINING_HREF, label: 'PSR Train (PSRAS prep)', external: true },
  { href: POLICESTATIONAGENT_HOME_HREF, label: 'Police Station Agent — solicitors', external: true },
  { href: '/police-station-representative', label: 'Police station representative' },
  { href: '/criminal-solicitor-police-station', label: 'Criminal solicitor — police station' },
  { href: '/police-station-rep-kent', label: 'Police station rep — Kent' },
  { href: '/police-station-rep-london', label: 'Police station rep — London' },
  { href: '/police-station-rep-essex', label: 'Police station rep — Essex' },
];

/** Guides + fees — used by homepage ToolsForRepsSection “More tools” grid. */
export const FOOTER_TOOLS: FooterLink[] = [...FOOTER_GUIDES, ...FOOTER_FEES_FORMS];

/** Grouped desktop dropdown menus — keep the header row readable (5 menus, not 8). */
export const HEADER_NAV_DROPDOWNS: { label: string; links: HeaderNavLink[] }[] = [
  { label: 'Blog', links: HEADER_NAV_BLOG_LINKS },
  {
    label: 'For Reps',
    links: dedupeNavLinks([
      ...HEADER_NAV_PSRAS,
      ...footerLinksToNav(FOOTER_FOR_REPRESENTATIVES),
    ]),
  },
  { label: 'Guides', links: HEADER_NAV_GUIDES },
  { label: 'Fees & Forms', links: HEADER_NAV_FEES_FORMS },
  { label: 'More', links: HEADER_NAV_MORE },
];

/** Flat deduplicated list for mobile drawer and legacy imports. */
export function buildHeaderMobileLinks(): HeaderNavLink[] {
  const seen = new Set<string>();
  const out: HeaderNavLink[] = [];
  const add = (link: HeaderNavLink) => {
    if (seen.has(link.href)) return;
    seen.add(link.href);
    out.push(link);
  };
  for (const link of HEADER_NAV_PRIMARY) add(link);
  for (const group of HEADER_NAV_DROPDOWNS) {
    for (const link of group.links) add(link);
  }
  return out;
}

/** @deprecated Prefer HEADER_NAV_PRIMARY + HEADER_NAV_DROPDOWNS in Header. */
export const PRIMARY_NAV = buildHeaderMobileLinks();

/** Mid-footer spotlight — h3 + body from homepage headings/content */
export const FOOTER_SPOTLIGHT_KENT_TITLE = 'Need a Police Station Rep in Kent?';
export const FOOTER_SPOTLIGHT_KENT_BODY =
  'Accredited Reps • 24/7 Immediate Coverage • All Kent Custody Suites';

export const FOOTER_SPOTLIGHT_TRAINING_TITLE = 'Training Guides & Resources';
export const FOOTER_SPOTLIGHT_TRAINING_BODY =
  'Access training guides, Rep Wiki, and professional resources — all free.';

/** Regulatory block title */
export const FOOTER_REGULATORY_TITLE = 'Regulatory Notice';

/** Disclaimer body — neutral branding for .org / .com deployments. */
export const FOOTER_REGULATORY_BODY =
  'PoliceStationRepUK is a directory and connection platform operated by Defence Legal Services Ltd. It is not a law firm, does not provide legal advice, and does not itself supply regulated legal services through the directory function. It is not authorised or regulated by the Solicitors Regulation Authority (SRA), the Bar Standards Board, or the Legal Aid Agency. Representatives listed are self-registered and independently responsible for their own accreditation, insurance, and regulatory compliance. Any engagement arranged via the directory is a direct contract between the instructing firm and the representative — PoliceStationRepUK is not a party to that arrangement. Firms remain responsible for instruction, supervision, professional obligations, and compliance. This site contains advertisements and promoted services that are clearly labelled; these are separate from the directory function. Users should verify credentials independently before instructing any representative.';

/** Advertising disclosure text for footer */
export const FOOTER_ADVERTISING_DISCLOSURE =
  'This site features advertisements and promoted services, including from Custody Note and Police Station Agent (policestationagent.com). These are products and services of Defence Legal Services Ltd or affiliated businesses and are separate from the PoliceStationRepUK directory function. All advertisements are labelled.';

/** Bottom utility row — hrefs as on source (Next redirects resolve to sitemap/blog) */
export const FOOTER_UTILITY_SHARE = 'Share Directory';
export const FOOTER_UTILITY_TOP = 'Top';
export const FOOTER_UTILITY_SITEMAP_HREF = '/sitemap.xml';
export const FOOTER_UTILITY_SITEMAP_LABEL = 'Sitemap';
export const FOOTER_UTILITY_LINKS_HREF = '/links';
export const FOOTER_UTILITY_LINKS_LABEL = 'Quick Links';
export const FOOTER_UTILITY_RSS_HREF = '/rss.xml';
export const FOOTER_UTILITY_RSS_LABEL = 'RSS Feed';
export const FOOTER_UTILITY_COOKIE_SETTINGS = 'Cookie Settings';

export const FOOTER_COLUMN_TITLES = {
  directories: 'Directories',
  forRepresentatives: 'For reps',
  guides: 'Guides',
  feesForms: 'Fees & forms',
  community: 'Community',
  legal: 'Legal',
  partners: 'Partners & SEO',
  /** @deprecated Use FOOTER_GUIDES + FOOTER_FEES_FORMS in footer layout. */
  tools: 'Tools & Resources',
} as const;

/** All footer link columns — for layout and dedupe tests. */
export const FOOTER_LINK_COLUMNS: { title: string; links: FooterLink[] }[] = [
  { title: FOOTER_COLUMN_TITLES.directories, links: FOOTER_DIRECTORIES },
  { title: FOOTER_COLUMN_TITLES.forRepresentatives, links: FOOTER_FOR_REPRESENTATIVES },
  { title: FOOTER_COLUMN_TITLES.guides, links: FOOTER_GUIDES },
  { title: FOOTER_COLUMN_TITLES.feesForms, links: FOOTER_FEES_FORMS },
  { title: FOOTER_COLUMN_TITLES.community, links: FOOTER_COMMUNITY },
  { title: FOOTER_COLUMN_TITLES.legal, links: FOOTER_LEGAL },
  { title: FOOTER_COLUMN_TITLES.partners, links: FOOTER_PARTNERS },
];
