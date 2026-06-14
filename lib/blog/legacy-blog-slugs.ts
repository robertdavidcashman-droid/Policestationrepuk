/**
 * Crawl-era blog slugs (content/crawl/blog-*.json) removed in favour of the new editorial blog.
 * Middleware 301s these to the new index or the closest new article where that helps users and SEO.
 */

export const NEW_BLOG_SLUGS_LIST = [
  'what-does-a-freelance-police-station-representative-do',
  'how-firms-can-instruct-freelance-police-station-reps',
  'police-station-attendance-checklist',
  'what-to-include-in-a-police-station-brief',
  'freelance-police-station-representative-vs-duty-solicitor',
  'common-mistakes-when-instructing-freelance-police-station-reps',
  'best-practice-handover-notes-after-police-station-attendance',
  'out-of-hours-police-station-cover-for-law-firms',
  'accreditation-and-standards-in-freelance-police-station-work',
  'how-freelance-police-station-reps-win-repeat-instructions',
  'what-makes-a-good-police-station-representative',
  'why-fast-clear-communication-matters-in-police-station-representation',
  'why-firms-need-rep-directory',
  'how-firms-source-emergency-rep-cover',
  'freelance-police-station-rep-career',
  'professional-indemnity-insurance-reps',
  'police-station-rep-fee-rates-2026',
  'pre-interview-consultation-rep-guide',
  'how-to-review-custody-record',
  'handling-disclosure-police-station',
  'adverse-inference-no-comment-rep-guide',
  'sentencing-act-2026-key-changes',
  'police-station-rep-coverage-location-matters',
  'keep-directory-profile-useful',
  'accredited-reps-keep-availability-updated',
] as const;

export const NEW_BLOG_SLUG_SET = new Set<string>(NEW_BLOG_SLUGS_LIST as unknown as string[]);

/** Old slug → new article path (pathname only, e.g. /Blog/new-slug) */
export const LEGACY_BLOG_SLUG_TO_PATH: Record<string, string> = {
  'what-is-police-station-representation': '/Blog/what-does-a-freelance-police-station-representative-do',
  'how-police-station-reps-safeguard-your-rights': '/Blog/what-does-a-freelance-police-station-representative-do',
  'what-does-a-criminal-solicitor-do-part-one-police-station-representation-the-initial-job':
    '/Blog/what-does-a-freelance-police-station-representative-do',
  'do-i-need-a-solicitor-at-a-police-station-interview':
    '/Blog/freelance-police-station-representative-vs-duty-solicitor',
  'what-is-a-duty-solicitor': '/Blog/freelance-police-station-representative-vs-duty-solicitor',
  'understanding-the-role-of-a-duty-solicitor-everything-you-need-to-know':
    '/Blog/freelance-police-station-representative-vs-duty-solicitor',
  'police-station-representation-do-i-need-it-i-don-t-do-i':
    '/Blog/freelance-police-station-representative-vs-duty-solicitor',
  'why-you-need-a-criminal-solicitor-in-the-police-station':
    '/Blog/freelance-police-station-representative-vs-duty-solicitor',
  'being-interviewed-by-the-police-why-you-need-a-criminal-solicitor-in-the-police-station':
    '/Blog/freelance-police-station-representative-vs-duty-solicitor',
  'is-legal-advice-free-at-the-police-station':
    '/Blog/freelance-police-station-representative-vs-duty-solicitor',
  'police-station-interview-rights-kent-legal-representation': '/Blog/police-station-attendance-checklist',
  'what-happens-at-a-police-station-interview-in-kent': '/Blog/police-station-attendance-checklist',
  'what-to-expect-during-a-police-station-interview-in-kent-your-rights-and-legal-representation':
    '/Blog/police-station-attendance-checklist',
  'criminal-law-faq-kent-police-station-rights': '/Blog/police-station-attendance-checklist',
  'kent-police-stations-legal-representation-24-7': '/Blog/out-of-hours-police-station-cover-for-law-firms',
  'expert-legal-representation-for-police-stations-in-kent':
    '/Blog/out-of-hours-police-station-cover-for-law-firms',
  'what-police-stations-in-kent-do-you-cover-and-can-send-police-station-reps-or-agents-to':
    '/Blog/out-of-hours-police-station-cover-for-law-firms',
  'police-station-disclosure-by-police-station-agent': '/Blog/what-to-include-in-a-police-station-brief',
  'police-station-rep-disclosure-1': '/Blog/what-to-include-in-a-police-station-brief',
  'the-unseen-errors-navigating-common-pitfalls-in-police-station-interviews':
    '/Blog/common-mistakes-when-instructing-freelance-police-station-reps',
  'no-further-action-after-police-interview': '/Blog/best-practice-handover-notes-after-police-station-attendance',
  'voluntary-interview-no-further-action': '/Blog/best-practice-handover-notes-after-police-station-attendance',
  'released-under-investigation-versus-bail': '/Blog/best-practice-handover-notes-after-police-station-attendance',
  // Wix-era slugs also listed in next.config.ts — centralized here for middleware
  'understanding-police-cautions-and-warnings-what-you-need-to-know': '/Blog',
  'understanding-police-bail-imposition-conditions-breaches-and-legal-implications-explained': '/Blog',
  'police-station-agent-blog': '/Blog',
  'police-station-representation': '/Blog/what-does-a-freelance-police-station-representative-do',
  'what-s-a-voluntary-police-interview': '/Blog',
  'copy-of-what-is-common-assault-in-english-law': '/Blog',
  'whats-happens-at-a-police-station-voluntary-interview-part-2': '/Blog',
  'nofurtheractionafterpoliceinterview': '/Blog/best-practice-handover-notes-after-police-station-attendance',
  'whats-a-voluntary-police-interview': '/Blog',
  'whats-a-duty-solicitor': '/Blog/freelance-police-station-representative-vs-duty-solicitor',
  'what-happens-if-you-don-t-attend-a-voluntary-police-interview-inengland': '/Blog',
  'property-returned-from-police-uk': '/Blog',
  'what-is-a-duty-solicitor-4': '/Blog/freelance-police-station-representative-vs-duty-solicitor',
  'welcome-to-our-blog': '/Blog',
  'have-to-attend-a-police-station-part-2-1': '/Blog',
  'help-the-police-have-contacted-me-1': '/Blog',
  'demystifying-police-bail-understanding-imposition-conditions-breaches-and-legal-implications': '/Blog',
  'navigating-the-legal-system-understanding-the-impact-of-police-cautions-on-employment-criminal-rec': '/Blog',
  'have-to-attend-a-police-station': '/Blog',
  'help-the-police-have-contacted-me': '/Blog',
  'getting-your-property-returned-by-the-police-in-the-uk': '/Blog',
  'what-happens-if-you-don-t-attend-a-voluntary-police-interview-in-england': '/Blog',
  'what-happens-at-a-police-station-voluntary-interview-page-4': '/Blog',
  'what-happens-at-a-police-station-voluntary-interview-part-3': '/Blog',
  'inside-a-voluntary-police-interview-what-to-expect-part-2': '/Blog',
  'voluntary-interview-at-swanley-police-station': '/Blog',
  'voluntaryinterviewwithpolice': '/Blog',
  'police-voluntary-interview-questions-4': '/Blog',
  'the-hidden-risks-of-voluntary-police-interviews-in-the-uk-you-need-to-know': '/Blog',
  'how-digital-evidence-voluntary-police-interview': '/Blog/handling-disclosure-police-station',
  'how-new-sentencing-guidelines-impact-your-rights-at-the-kent-police-station': '/Blog/sentencing-act-2026-key-changes',
  'what-does-a-criminal-solicitor-do-part-2-the-magistrates-court': '/Blog',
  'what-happens-if-charged-criminal-offence-court': '/Blog',
  'what-is-common-assault-in-english-law': '/Blog',
  'what-is-the-sex-offender-register': '/Blog',
  'why-you-need-a-criminal-law-specialist': '/Blog',
  'the-role-of-higher-court-advocates-in-the-uk': '/Blog',
  'understanding-community-resolutions-and-their-impact-on-dbs-checks-and-employment': '/Blog',
  'understanding-police-warrants-and-interviews-in-kent': '/Blog/out-of-hours-police-station-cover-for-law-firms',
  'police-station-reps-and-agents-for-swanley-police-station': '/Blog/out-of-hours-police-station-cover-for-law-firms',
  'complete-guide-to-legal-representation-at-kent-police-stations': '/Blog/out-of-hours-police-station-cover-for-law-firms',
  'arrested-or-have-a-policewarrant-in-kent-here-s-what-you-need-to-know0': '/Blog/police-station-attendance-checklist',
  'i-think-i-may-be-arrested-by-the-police-what-should-i-do': '/Blog/police-station-attendance-checklist',
  'domestic-allegations-police-station-stage': '/Blog/police-station-attendance-checklist',
  'drug-allegations-police-station-interviews': '/Blog/police-station-attendance-checklist',
  'sexual-allegations-police-station-stage': '/Blog/police-station-attendance-checklist',
  'theft-fraud-financial-police-station': '/Blog/police-station-attendance-checklist',
  'violence-public-order-police-station-stage': '/Blog/police-station-attendance-checklist',
  'motoring-driving-allegations-police-station': '/Blog/police-station-attendance-checklist',
  'types-of-offences-police-station-stage': '/Blog/police-station-attendance-checklist',
  'police-caution': '/Blog',
  'police-caution-difference': '/Blog',
  'the-police-caution-means-police-station-agent': '/Blog',
};

const TOPIC_RULES: { pattern: RegExp; target: string }[] = [
  { pattern: /duty[- ]?solicitor|solicitor.*interview|legal-advice-free/, target: '/Blog/freelance-police-station-representative-vs-duty-solicitor' },
  { pattern: /disclosure|brief|digital-evidence/, target: '/Blog/what-to-include-in-a-police-station-brief' },
  { pattern: /no-further-action|released-under|bail|handover/, target: '/Blog/best-practice-handover-notes-after-police-station-attendance' },
  { pattern: /kent|out-of-hours|24-7|swanley|cover/, target: '/Blog/out-of-hours-police-station-cover-for-law-firms' },
  { pattern: /voluntary|interview|attend|arrested|custody-rights/, target: '/Blog/police-station-attendance-checklist' },
  { pattern: /instruct|firm|mistake|freelance|rep-career|accreditation|fee|rate/, target: '/Blog/how-firms-can-instruct-freelance-police-station-reps' },
  { pattern: /sentencing/, target: '/Blog/sentencing-act-2026-key-changes' },
  { pattern: /representation|what-is-police-station/, target: '/Blog/what-does-a-freelance-police-station-representative-do' },
];

/**
 * Resolve a legacy blog slug to a redirect target, or null if it is a current article slug.
 * Unknown legacy slugs redirect to /Blog rather than 404 — reduces GSC "Not found" noise after Wix migration.
 */
export function resolveLegacyBlogRedirect(slug: string): string | null {
  const normalized = slug.trim();
  if (!normalized || NEW_BLOG_SLUG_SET.has(normalized)) return null;

  const exact = LEGACY_BLOG_SLUG_TO_PATH[normalized];
  if (exact) return exact;

  const lower = normalized.toLowerCase();
  for (const { pattern, target } of TOPIC_RULES) {
    if (pattern.test(lower)) return target;
  }

  if (LEGACY_CRAWL_BLOG_SLUG_SET.has(normalized)) return '/Blog';

  return '/Blog';
}

/** Every slug that previously had a crawl JSON under content/crawl/blog-*.json */
export const ALL_LEGACY_CRAWL_BLOG_SLUGS: string[] = [
  'arrested-or-have-a-policewarrant-in-kent-here-s-what-you-need-to-know0',
  'being-interviewed-by-the-police-why-you-need-a-criminal-solicitor-in-the-police-station',
  'complete-guide-to-legal-representation-at-kent-police-stations',
  'criminal-law-faq-kent-police-station-rights',
  'demystifying-police-bail-understanding-imposition-conditions-breaches-and-legal-implications',
  'do-i-need-a-solicitor-at-a-police-station-interview',
  'domestic-allegations-police-station-stage',
  'drug-allegations-police-station-interviews',
  'expert-legal-representation-for-police-stations-in-kent',
  'getting-your-property-returned-by-the-police-in-the-uk',
  'have-to-attend-a-police-station',
  'have-to-attend-a-police-station-part-2',
  'help-the-police-have-contacted-me',
  'how-digital-evidence-voluntary-police-interview',
  'how-new-sentencing-guidelines-impact-your-rights-at-the-kent-police-station',
  'how-police-station-reps-safeguard-your-rights',
  'inside-a-voluntary-police-interview-what-to-expect-part-2',
  'is-legal-advice-free-at-the-police-station',
  'i-think-i-may-be-arrested-by-the-police-what-should-i-do',
  'kent-police-stations-legal-representation-24-7',
  'motoring-driving-allegations-police-station',
  'navigating-the-legal-system-understanding-the-impact-of-police-cautions-on-employment-criminal-rec',
  'no-further-action-after-police-interview',
  'police-caution',
  'police-caution-difference',
  'police-station-disclosure-by-police-station-agent',
  'police-station-interview-rights-kent-legal-representation',
  'police-station-rep-disclosure-1',
  'police-station-representation-do-i-need-it-i-don-t-do-i',
  'police-station-reps-and-agents-for-swanley-police-station',
  'police-voluntary-interview-questions-4',
  'released-under-investigation-versus-bail',
  'sexual-allegations-police-station-stage',
  'theft-fraud-financial-police-station',
  'the-hidden-risks-of-voluntary-police-interviews-in-the-uk-you-need-to-know',
  'the-police-caution-means-police-station-agent',
  'the-role-of-higher-court-advocates-in-the-uk',
  'the-unseen-errors-navigating-common-pitfalls-in-police-station-interviews',
  'types-of-offences-police-station-stage',
  'understanding-community-resolutions-and-their-impact-on-dbs-checks-and-employment',
  'understanding-police-warrants-and-interviews-in-kent',
  'understanding-the-role-of-a-duty-solicitor-everything-you-need-to-know',
  'violence-public-order-police-station-stage',
  'voluntary-interview-at-swanley-police-station',
  'voluntary-interview-no-further-action',
  'voluntaryinterviewwithpolice',
  'what-does-a-criminal-solicitor-do-part-2-the-magistrates-court',
  'what-does-a-criminal-solicitor-do-part-one-police-station-representation-the-initial-job',
  'what-happens-at-a-police-station-interview-in-kent',
  'what-happens-at-a-police-station-voluntary-interview-page-4',
  'what-happens-at-a-police-station-voluntary-interview-part-3',
  'what-happens-if-charged-criminal-offence-court',
  'what-happens-if-you-don-t-attend-a-voluntary-police-interview-in-england',
  'what-is-a-duty-solicitor',
  'what-is-common-assault-in-english-law',
  'what-is-police-station-representation',
  'what-is-the-sex-offender-register',
  'what-police-stations-in-kent-do-you-cover-and-can-send-police-station-reps-or-agents-to',
  'what-to-expect-during-a-police-station-interview-in-kent-your-rights-and-legal-representation',
  'why-you-need-a-criminal-law-specialist',
  'why-you-need-a-criminal-solicitor-in-the-police-station',
];

export const LEGACY_CRAWL_BLOG_SLUG_SET = new Set(ALL_LEGACY_CRAWL_BLOG_SLUGS);
