import { SUPPORT_MAILTO_HREF } from '@/lib/site-contact';
import { PSRTRAIN_TRAINING_HREF } from '@/lib/psrtrain-promo';

/**
 * Navigation & footer definitions locked to policestationrepuk.com structure.
 * Header: docs/live-site-map.json → navigation.primary (labels + order + hrefs).
 * Footer: homepage crawl data/page-content.json (sections Directories / For Reps /
 * Tools & Resources / Community + legal links + regulatory block).
 */

/**
 * Primary header — order + labels from policestationrepuk.com (`docs/live-site-map.json` + homepage crawl).
 * `/search` is an on-site extra (advanced filters); everything else mirrors the live Wix menu.
 */
export const PRIMARY_NAV = [
  { href: '/', text: 'Home' },
  { href: '/Blog', text: 'Blog' },
  { href: '/CustodyNote', text: '🆕 Custody Note' },
  { href: '/directory', text: '🔍 Find a Rep' },
  { href: '/register', text: 'Join the Directory (Free)' },
  { href: '/StationsDirectory', text: '📞 Station Numbers' },
  { href: '/FormsLibrary', text: '📄 Forms' },
  { href: '/Resources', text: '🌐 Resources' },
  { href: '/search', text: '🔎 Search' },
  { href: '/Contact', text: 'Contact Us' },
  { href: '/About', text: 'About' },
  { href: PSRTRAIN_TRAINING_HREF, text: 'PSRAS prep ↗' },
] as const;

/** Community group — WhatsApp number (same as Robert Cashman directory mobile; not shown on generic /Contact). */
export const COMMUNITY_EMAIL = 'robertcashman@defencelegalservices.co.uk';
export const WHATSAPP_JOIN_PHONE = '07535 494446';
/** Single community group for accredited reps and verified criminal defence firms (same chat). */
export const WHATSAPP_JOIN_URL =
  'https://wa.me/447535494446?text=Hi%2C%20I%27d%20like%20to%20join%20the%20PoliceStationRepUK%20WhatsApp%20group%20(reps%20and%20firms).%20My%20name%20is%20';
/** @deprecated Same as WHATSAPP_JOIN_URL — one group for everyone. Kept for older links. */
export const WHATSAPP_FIRMS_JOIN_URL = WHATSAPP_JOIN_URL;
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

export type FooterLink = { href: string; label: string; external?: boolean };

/** Footer column “Directories” — link labels from data/page-content.json (/) */
export const FOOTER_DIRECTORIES: FooterLink[] = [
  { href: '/directory', label: 'Find a Rep' },
  { href: '/search', label: 'Search directory' },
  { href: '/StationsDirectory', label: 'Station Numbers' },
  { href: '/Forces', label: 'Police Forces' },
  { href: '/Firms', label: 'Law Firms' },
  { href: '/Map', label: 'Interactive Map' },
  { href: '/UpdateStation', label: 'Update Station Info' },
];

/** Footer column “For Reps” — order & labels from homepage crawl */
export const FOOTER_FOR_REPRESENTATIVES: FooterLink[] = [
  { href: '/register', label: 'Join the Directory (Free)' },
  { href: '/Profile', label: 'My Profile' },
  { href: '/GoFeatured', label: 'Become Featured' },
  { href: '/PoliceStationRepJobsUK', label: 'Rep Jobs UK' },
  { href: '/GetWork', label: 'Get Work Guide' },
  { href: '/HowToBecomePoliceStationRep', label: 'How to Become a Rep' },
  { href: '/PrepareForCIT', label: 'Prepare for the CIT' },
  { href: PSRTRAIN_TRAINING_HREF, label: 'PSR Train — exam prep', external: true },
  { href: '/PoliceStationCover', label: 'Police Station Cover (Firms)' },
];

/** Footer column “Tools & Resources” */
export const FOOTER_TOOLS: FooterLink[] = [
  { href: 'https://custodynote.com', label: 'Custody Note App', external: true },
  { href: PSRTRAIN_TRAINING_HREF, label: 'PSR Train (PSRAS prep)', external: true },
  { href: '/police-station-representative', label: 'Police station representative' },
  { href: '/criminal-solicitor-police-station', label: 'Criminal solicitor — police station' },
  { href: '/police-station-rights-uk', label: 'Police station rights UK' },
  { href: '/free-legal-advice-police-station', label: 'Free legal advice (police station)' },
  { href: '/police-station-rep-kent', label: 'Police station rep — Kent' },
  { href: '/police-station-rep-london', label: 'Police station rep — London' },
  { href: '/police-station-rep-essex', label: 'Police station rep — Essex' },
  { href: '/FormsLibrary', label: 'Forms' },
  { href: '/PoliceStationRates', label: 'Station Rates (2025/26)' },
  { href: '/PACE', label: 'PACE Codes' },
  { href: '/Wiki', label: 'Rep Wiki & training guides' },
  { href: '/LegalUpdates', label: 'Legal Updates' },
];

/** Footer column “Community” — order from homepage crawl (/) */
export const FOOTER_COMMUNITY: FooterLink[] = [
  { href: '/WhatsApp', label: 'WhatsApp group (reps & firms)' },
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
export const FOOTER_UTILITY_RSS_HREF = '/rss.xml';
export const FOOTER_UTILITY_RSS_LABEL = 'RSS Feed';
export const FOOTER_UTILITY_COOKIE_SETTINGS = 'Cookie Settings';

export const FOOTER_COLUMN_TITLES = {
  directories: 'Directories',
  forRepresentatives: 'For reps',
  tools: 'Tools & Resources',
  community: 'Community',
  legal: 'Legal',
} as const;
