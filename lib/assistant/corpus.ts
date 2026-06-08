import { ACCREDITED_FAQS } from '@/lib/guide-accredited-representative';
import { PORTFOLIO_FAQS } from '@/lib/guide-build-portfolio';
import { CAREER_FAQS } from '@/lib/guide-criminal-law-career';
import { DSVR_FAQS } from '@/lib/guide-duty-solicitor-vs-rep';
import { INTERVIEW_FAQS } from '@/lib/guide-interview-under-caution';
import { DISCLOSURE_FAQS } from '@/lib/guide-police-disclosure';
import { CIT_FAQS } from '@/lib/guide-prepare-for-cit';
import { WRITTEN_EXAM_FAQS } from '@/lib/guide-prepare-for-written-exam';
import { REP_DO_FAQS } from '@/lib/guide-what-does-rep-do';
import { FAQ_PAGE_FAQS } from '@/lib/faq-page';
import { HOMEPAGE_FAQS } from '@/lib/homepage-faqs';
import { REP_FAQ_GROUPS } from '@/lib/rep-faq-master';
import { CAMPAIGN_FAQS } from '@/lib/station-numbers-campaign';
import { STATIONS_DIRECTORY_FAQS, UPDATE_STATION_FAQS } from '@/lib/stations-seo';
import type { AssistantEntry } from '@/lib/assistant/types';

type FaqInput = { q: string; a: string };

function faqEntries(
  items: readonly FaqInput[],
  category: string,
  href?: string,
  idPrefix?: string
): AssistantEntry[] {
  return items.map((item, i) => ({
    id: `${idPrefix ?? category.toLowerCase().replace(/\s+/g, '-')}-${i}`,
    question: item.q,
    answer: item.a.replace(/&quot;/g, '"').replace(/&apos;/g, "'"),
    category,
    href,
  }));
}

const SITE_INTENT_ENTRIES: AssistantEntry[] = [
  {
    id: 'site-find-rep',
    question: 'How do I find a police station representative?',
    answer:
      'Use the directory to search by county, station, or name. Filter by availability and accreditation. Each listing shows contact details where provided.',
    category: 'Directory',
    href: '/directory',
    keywords: ['find rep', 'search directory', 'locate representative', 'cover'],
  },
  {
    id: 'site-register',
    question: 'How do I register on the directory?',
    answer:
      'Accredited reps can join free at the registration page. Complete your profile with counties, stations covered, and contact details so firms can find you.',
    category: 'Directory',
    href: '/register',
    keywords: ['sign up', 'join directory', 'create profile', 'listing'],
  },
  {
    id: 'site-whatsapp',
    question: 'How do I join the WhatsApp group?',
    answer:
      'Text the published number or use the audience-specific join pages for reps, solicitors, or firms. Verification is required before you are added to the community group.',
    category: 'Community',
    href: '/WhatsApp',
    keywords: ['whatsapp', 'group chat', 'cover requests', 'community'],
  },
  {
    id: 'site-custody-note',
    question: 'What is Custody Note attendance note software?',
    answer:
      'Custody Note is desktop software for structured police station attendance notes on Windows and Mac. See our Custody Note page for features, pricing, and a free trial.',
    category: 'Tools',
    href: '/CustodyNote',
    keywords: ['custody note', 'custodynote', 'attendance note', 'note software', 'digital notes', 'pace notes'],
  },
  {
    id: 'site-kent-cover',
    question: 'How do I get police station cover in Kent?',
    answer:
      'For cover at Kent custody suites or within about 45 minutes of West Kingsdown, contact Police Station Agent via WhatsApp or policestationagent.com. For cover elsewhere in England and Wales, search the directory and contact a rep via their listing.',
    category: 'Directory',
    href: '/KentAgentCover',
    keywords: ['kent cover', 'maidstone cover', 'medway cover', 'police station agent', 'urgent cover kent'],
  },
  {
    id: 'site-station-numbers',
    question: 'Where can I find police station phone numbers?',
    answer:
      'The Stations Directory lists custody suite and main line numbers across England and Wales. Search by station name, force, or county.',
    category: 'Directory',
    href: '/StationsDirectory',
    keywords: ['station numbers', 'custody desk', 'telephone', 'phone'],
  },
  {
    id: 'site-report-number',
    question: 'How do I report an incorrect station phone number?',
    answer:
      'Use the Report correction form or Help us — station numbers page. Submissions are reviewed before the public listing is updated.',
    category: 'Directory',
    href: '/UpdateStation',
    keywords: ['wrong number', 'update station', 'correction'],
  },
  {
    id: 'site-featured',
    question: 'What is a featured listing?',
    answer:
      'Featured reps appear at the top of directory search results for greater visibility to instructing firms. See Go Featured for pricing and how to upgrade.',
    category: 'Directory',
    href: '/GoFeatured',
    keywords: ['featured', 'promote profile', 'priority listing'],
  },
  {
    id: 'site-contact',
    question: 'How do I contact PoliceStationRepUK?',
    answer:
      'Use the Contact page or email support for directory enquiries. For urgent police station cover, contact representatives directly via their listing details.',
    category: 'Site help',
    href: '/Contact',
    keywords: ['email', 'support', 'enquiry', 'help'],
  },
  {
    id: 'site-ai-assistant',
    question: 'What is the AI assistant?',
    answer:
      'The AI assistant answers questions about the directory, registration, PSRAS career routes, and general police station practice topics on this site, using our published FAQs and guides.',
    category: 'Site help',
    href: '/ai-assistant',
    keywords: ['assistant', 'chat', 'help bot', 'faq search'],
  },
];

function buildCorpus(): AssistantEntry[] {
  const repFaqFlat = REP_FAQ_GROUPS.flatMap((g) => g.items);
  return [
    ...SITE_INTENT_ENTRIES,
    ...faqEntries(HOMEPAGE_FAQS, 'General', '/'),
    ...faqEntries(FAQ_PAGE_FAQS, 'FAQ', '/FAQ', 'faq-page'),
    ...faqEntries(repFaqFlat, 'Rep FAQ', '/RepFAQMaster', 'rep-faq'),
    ...faqEntries(PORTFOLIO_FAQS, 'PSRAS Portfolio', '/BuildPortfolioGuide', 'portfolio'),
    ...faqEntries(WRITTEN_EXAM_FAQS, 'PSRAS Written Exam', '/PrepareForWrittenExam', 'written-exam'),
    ...faqEntries(CIT_FAQS, 'PSRAS CIT', '/PrepareForCIT', 'cit'),
    ...faqEntries(ACCREDITED_FAQS, 'Accreditation', '/AccreditedRepresentativeGuide', 'accredited'),
    ...faqEntries(CAREER_FAQS, 'Career', '/CriminalLawCareerGuide', 'career'),
    ...faqEntries(REP_DO_FAQS, 'Role', '/WhatDoesRepDo', 'rep-do'),
    ...faqEntries(DSVR_FAQS, 'Role', '/DutySolicitorVsRep', 'dsvr'),
    ...faqEntries(INTERVIEW_FAQS, 'PACE', '/InterviewUnderCaution', 'interview'),
    ...faqEntries(DISCLOSURE_FAQS, 'PACE', '/PoliceDisclosureGuide', 'disclosure'),
    ...faqEntries(STATIONS_DIRECTORY_FAQS, 'Directory', '/StationsDirectory', 'stations-dir'),
    ...faqEntries(UPDATE_STATION_FAQS, 'Directory', '/UpdateStation', 'update-station'),
    ...faqEntries(CAMPAIGN_FAQS, 'Directory', '/HelpUsStationNumbers', 'campaign'),
  ];
}

/** Deduplicated by id — built once at module load. */
export const ASSISTANT_CORPUS: AssistantEntry[] = buildCorpus();

export const ASSISTANT_STARTER_PROMPTS = [
  'How do I register on the directory?',
  'Find station phone numbers',
  'PSRAS portfolio — how many cases?',
  'Join WhatsApp group',
] as const;

export const ASSISTANT_LOW_CONFIDENCE_LINKS = [
  { href: '/FAQ', label: 'Help & FAQ' },
  { href: '/directory', label: 'Find a rep' },
  { href: '/Contact', label: 'Contact us' },
] as const;
