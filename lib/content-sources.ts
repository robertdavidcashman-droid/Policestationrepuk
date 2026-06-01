/**
 * Authoritative source links for content pages.
 * Prefer CPS, legislation.gov.uk, gov.uk, and Sentencing Council over case names.
 */

export interface ContentSource {
  label: string;
  href: string;
}

const PACE = { label: 'PACE Codes of Practice (A–H)', href: 'https://www.gov.uk/guidance/police-and-criminal-evidence-act-1984-pace-codes-of-practice' };
const PACE_ACT = { label: 'Police and Criminal Evidence Act 1984', href: 'https://www.legislation.gov.uk/ukpga/1984/60/contents' };
const CJPOA = { label: 'Criminal Justice and Public Order Act 1994', href: 'https://www.legislation.gov.uk/ukpga/1994/33/contents' };
const SCC_2025 = { label: 'Standard Crime Contract 2025', href: 'https://www.gov.uk/government/publications/standard-crime-contract-2025' };
const LAA_MANUAL = { label: 'LAA — Criminal Legal Aid Manual', href: 'https://www.gov.uk/guidance/criminal-legal-aid-manual' };
const SABC = { label: 'LAA — Submit a Bulk Claim (SaBC)', href: 'https://www.gov.uk/guidance/submit-a-bulk-claim-sabc' };
const SI_2025_1251 = { label: 'Criminal Legal Aid (Remuneration) (Amendment) Regulations 2025 (SI 2025/1251)', href: 'https://www.legislation.gov.uk/uksi/2025/1251/made' };
const SENTENCING = { label: 'Sentencing Council — definitive guidelines', href: 'https://www.sentencingcouncil.org.uk/sentencing-guidelines/' };
const CPS_ADVERSE = { label: 'CPS — Adverse inferences legal guidance', href: 'https://www.cps.gov.uk/legal-guidance/adverse-inferences' };
const CPS_OAP = { label: 'CPS — Offences against the person (charging standard)', href: 'https://www.cps.gov.uk/prosecution-guidance/offences-against-person-incorporating-charging-standard' };
const CPS_DISCLOSURE = { label: 'CPS — Disclosure Manual', href: 'https://www.cps.gov.uk/legal-guidance/disclosure-manual' };
const AG_DISCLOSURE = { label: "Attorney General's Guidelines on Disclosure (2024)", href: 'https://www.gov.uk/government/publications/attorney-generals-guidelines-on-disclosure' };
const CPIA = { label: 'Criminal Procedure and Investigations Act 1996', href: 'https://www.legislation.gov.uk/ukpga/1996/25/contents' };
const PCSC_BAIL = { label: 'Police, Crime, Sentencing and Courts Act 2022, Sch. 4 (pre-charge bail)', href: 'https://www.legislation.gov.uk/ukpga/2022/32/schedule/4/enacted' };
const PRECHARGE_BAIL = { label: 'Pre-charge bail statutory guidance', href: 'https://www.gov.uk/government/publications/pre-charge-bail-statutory-guidance/pre-charge-bail-statutory-guidance-accessible' };
const CPS_CHARGING = { label: "CPS — Director's Guidance on Charging", href: 'https://www.cps.gov.uk/prosecution-guidance/directors-guidance-charging-sixth-edition-december-2020-incorporating-national' };
const CPS_CTL = { label: 'CPS — Custody time limits', href: 'https://www.cps.gov.uk/legal-guidance/custody-time-limits' };
const HMRC_MILEAGE = { label: 'HMRC — travel and subsistence mileage rates', href: 'https://www.gov.uk/travel-mileage-fuel-rates/travel-and-subsistence' };
const SENTENCING_ACT_2026 = { label: 'Sentencing Act 2026', href: 'https://www.legislation.gov.uk/ukpga/2026/2/2026-03-22' };
const PSRAS = { label: 'PSRAS — Police Station Register Arrangements 2025', href: 'https://www.gov.uk/guidance/police-station-representatives-and-duty-solicitors' };
const BAILII = { label: 'BAILII — free UK case law', href: 'https://www.bailii.org/' };

function dedupe(sources: ContentSource[]): ContentSource[] {
  const seen = new Set<string>();
  return sources.filter((s) => {
    if (seen.has(s.href)) return false;
    seen.add(s.href);
    return true;
  });
}

const WIKI_CATEGORY: Record<string, ContentSource[]> = {
  'Claiming & Billing': [SI_2025_1251, SABC, LAA_MANUAL, SCC_2025],
  'At The Station': [PACE, PACE_ACT, PACE],
  'Dealing with Police': [PACE_ACT, PACE, CJPOA],
  'Interview Techniques': [PACE, CJPOA, CPS_ADVERSE],
  'Common Problems': [PCSC_BAIL, PRECHARGE_BAIL, CJPOA],
  'Client Management': [SCC_2025, LAA_MANUAL],
  'Professional Development': [PSRAS, SCC_2025, PACE],
  'Getting Started': [PSRAS, PACE, SCC_2025],
};

const WIKI_SLUG: Record<string, ContentSource[]> = {
  'rui-vs-bail-guide': [PCSC_BAIL, PRECHARGE_BAIL],
  'police-warrants-guide': [PACE_ACT, { label: 'Magistrates\' Courts Act 1980', href: 'https://www.legislation.gov.uk/ukpga/1980/43/contents' }],
  'reading-disclosure': [CPIA, AG_DISCLOSURE, CPS_DISCLOSURE],
  'digital-evidence-police-station-basics': [CPIA, AG_DISCLOSURE, PACE],
  'adverse-inference-section-34-guide': [CJPOA, CPS_ADVERSE, PACE],
  'no-comment-interviews': [CJPOA, CPS_ADVERSE, PACE],
  'police-caution-explained': [CJPOA, CPS_ADVERSE, PACE],
  'maximizing-legal-aid-claims': [SI_2025_1251, SABC, LAA_MANUAL],
  'legal-aid-guide': [SI_2025_1251, SABC, LAA_MANUAL],
  'claiming-fees-police-station': [SI_2025_1251, SABC, LAA_MANUAL],
  'pace-code-c-custody': [{ label: 'PACE Code C (2023)', href: 'https://www.gov.uk/government/publications/pace-code-c-2023' }, PACE_ACT],
  'pace-codes-quick-reference': [PACE, PACE_ACT],
};

const LEGAL_UPDATE_SLUG: Record<string, ContentSource[]> = {
  'bail-act-2024-changes': [PCSC_BAIL, PRECHARGE_BAIL],
  'threshold-test-charging': [CPS_CHARGING, CPS_CTL, CPIA],
  'body-worn-video-evidence': [CPIA, AG_DISCLOSURE, { label: 'PACE Code F (2018)', href: 'https://www.gov.uk/government/publications/pace-codes-e-and-f-2018/pace-code-f-2018-accessible' }],
  'pace-code-c-updates-2024': [{ label: 'PACE Code C (2023)', href: 'https://www.gov.uk/government/publications/pace-code-c-2023' }, PACE],
  'double-fees-guide': [SI_2025_1251, SCC_2025, SABC],
  'mileage-claims-guide': [HMRC_MILEAGE, LAA_MANUAL],
  'sentencing-act-2026-key-changes': [SENTENCING_ACT_2026, SENTENCING],
  'rasso-interview-strategy': [CPS_DISCLOSURE, AG_DISCLOSURE, PACE],
};

const BLOG_SLUG: Record<string, ContentSource[]> = {
  'sentencing-act-2026-key-changes': [SENTENCING_ACT_2026, SENTENCING],
  'adverse-inference-no-comment-rep-guide': [CJPOA, CPS_ADVERSE],
  'handling-disclosure-police-station': [CPIA, AG_DISCLOSURE, CPS_DISCLOSURE],
  'how-to-review-custody-record': [{ label: 'PACE Code C (2023)', href: 'https://www.gov.uk/government/publications/pace-code-c-2023' }, PACE_ACT],
  'police-station-rep-fee-rates-2026': [SI_2025_1251, SABC, SCC_2025],
};

const CRAWL_SLUG: Record<string, ContentSource[]> = {
  PoliceDisclosureGuide: [CPIA, AG_DISCLOSURE, CPS_DISCLOSURE],
  InterviewUnderCaution: [CJPOA, CPS_ADVERSE, PACE],
  DutySolicitorVsRep: [PSRAS, SCC_2025, PACE],
  WhatDoesRepDo: [PACE, PSRAS, SCC_2025],
  PrepareForCIT: [PSRAS, PACE, SCC_2025],
  BuildPortfolioGuide: [PSRAS, SCC_2025],
  GettingStarted: [PSRAS, PACE],
  CriminalLawCareerGuide: [PSRAS, SCC_2025],
  AccreditedRepresentativeGuide: [PSRAS, SCC_2025],
  HowToBecome: [PSRAS, SCC_2025],
};

const PAGE_PATH: Record<string, ContentSource[]> = {
  '/PACE': [PACE, PACE_ACT],
  '/FAQ': [PSRAS, PACE, SCC_2025],
  '/BeginnersGuide': [PACE_ACT, PACE, CJPOA, SCC_2025, PSRAS],
  '/HowToBecomePoliceStationRep': [PSRAS, SCC_2025, PACE],
  '/DSCCRegistrationGuide': [SCC_2025, SABC, LAA_MANUAL, PACE],
  '/GetWork': [SCC_2025, LAA_MANUAL, { label: 'SRA — Standards and Regulations', href: 'https://www.sra.org.uk/solicitors/standards-regulations/' }],
  '/FindSupervisingSolicitor': [PSRAS, { label: 'SRA — PSRAS guidance', href: 'https://www.sra.org.uk/solicitors/resources/specific-areas-of-practice/police-station-representative-accreditation-scheme/' }],
  '/PoliceStationRates': [SI_2025_1251, SCC_2025, SABC],
  '/PoliceStationRepPay': [SI_2025_1251, SCC_2025, SABC],
  '/EscapeFeeCalculator': [SI_2025_1251, LAA_MANUAL, SABC],
  '/MagistratesCourtFees': [SENTENCING, { label: 'legislation.gov.uk', href: 'https://www.legislation.gov.uk/' }],
  '/CrownCourtFees': [SENTENCING, { label: 'legislation.gov.uk', href: 'https://www.legislation.gov.uk/' }],
  '/RepFAQMaster': [PSRAS, PACE, SCC_2025],
  '/free-legal-advice-police-station': [PACE_ACT, PACE, { label: 'Find legal advice (justice.gov.uk)', href: 'https://find-legal-advice.justice.gov.uk/' }],
  '/police-station-rights-uk': [PACE_ACT, PACE, CJPOA],
  '/CommonOffencesGuide': [SENTENCING, CPS_OAP, BAILII, { label: 'legislation.gov.uk', href: 'https://www.legislation.gov.uk/' }],
  '/Resources': [PACE, PSRAS, SCC_2025, SENTENCING],
  '/InterviewUnderCaution': [CJPOA, CPS_ADVERSE, PACE],
  '/PoliceDisclosureGuide': [CPIA, AG_DISCLOSURE, CPS_DISCLOSURE],
};

const DEFAULT_CONTENT: ContentSource[] = [
  { label: 'legislation.gov.uk', href: 'https://www.legislation.gov.uk/' },
  PACE,
  { label: 'Legal Aid Agency', href: 'https://www.gov.uk/government/organisations/legal-aid-agency' },
  { label: 'CPS prosecution guidance', href: 'https://www.cps.gov.uk/prosecution-guidance' },
];

export type ContentSourceContext =
  | { kind: 'wiki'; slug: string; category: string }
  | { kind: 'blog'; slug: string }
  | { kind: 'legal-update'; slug: string }
  | { kind: 'crawl'; slug: string }
  | { kind: 'page'; path: string };

export function getContentSources(ctx: ContentSourceContext, extra: ContentSource[] = []): ContentSource[] {
  let specific: ContentSource[] = [];
  switch (ctx.kind) {
    case 'wiki':
      specific = [...(WIKI_SLUG[ctx.slug] ?? []), ...(WIKI_CATEGORY[ctx.category] ?? [])];
      break;
    case 'blog':
      specific = BLOG_SLUG[ctx.slug] ?? [SCC_2025, PACE, PSRAS];
      break;
    case 'legal-update':
      specific = LEGAL_UPDATE_SLUG[ctx.slug] ?? [PACE, LAA_MANUAL];
      break;
    case 'crawl':
      specific = CRAWL_SLUG[ctx.slug] ?? [PACE, PSRAS];
      break;
    case 'page':
      specific = PAGE_PATH[ctx.path] ?? DEFAULT_CONTENT;
      break;
  }
  return dedupe([...specific, ...extra, ...DEFAULT_CONTENT]);
}
