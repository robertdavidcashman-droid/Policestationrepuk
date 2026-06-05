/**
 * Site-wide editorial content accuracy inventory + red-flag scan.
 * Run: npm run audit:content-accuracy
 *
 * Outputs:
 *   audit/content-accuracy-register.json
 *   audit/content-accuracy-problems.md
 */
import fs from 'fs';
import path from 'path';
import { getAllBlogArticles } from '../../lib/blog/registry';
import { VERIFIED_CASES } from '../../lib/case-law-registry';
import { hasSlugSpecificSources, type ContentSourceContext } from '../../lib/content-sources';

type ContentType = 'blog' | 'wiki' | 'legal-update' | 'guide' | 'fee-rights';
type FlagSeverity = 'PROBLEM' | 'REVIEW' | 'GAP';

interface RedFlag {
  severity: FlagSeverity;
  code: string;
  message: string;
  excerpt?: string;
}

interface InventoryItem {
  url: string;
  contentType: ContentType;
  sourceFile: string;
  hasReliabilityNotice: boolean;
  hasSourcesFooter: boolean;
  customSourcesInContentSources: boolean;
  auditTier: number | null;
  auditStatus: string;
  redFlags: RedFlag[];
}

const ROOT = process.cwd();
const AUDIT_LOG = path.join(ROOT, 'audit/CONTENT-ACCURACY-REVIEW.md');
const REGISTER_JSON = path.join(ROOT, 'audit/content-accuracy-register.json');
const PROBLEMS_MD = path.join(ROOT, 'audit/content-accuracy-problems.md');

const EDITORIAL_PAGE_PATHS = [
  '/PACE',
  '/FAQ',
  '/BeginnersGuide',
  '/HowToBecomePoliceStationRep',
  '/DSCCRegistrationGuide',
  '/GetWork',
  '/FindSupervisingSolicitor',
  '/PoliceStationRates',
  '/PoliceStationRepPay',
  '/EscapeFeeCalculator',
  '/MagistratesCourtFees',
  '/CrownCourtFees',
  '/RepFAQMaster',
  '/free-legal-advice-police-station',
  '/police-station-rights-uk',
  '/CommonOffencesGuide',
  '/Resources',
  '/InterviewUnderCaution',
  '/PoliceDisclosureGuide',
  '/WhatDoesRepDo',
  '/DutySolicitorVsRep',
  '/PrepareForCIT',
  '/BuildPortfolioGuide',
  '/PrepareForWrittenExam',
  '/GettingStarted',
  '/AccreditedRepresentativeGuide',
  '/HowToBecome',
  '/CriminalLawCareerGuide',
] as const;

const GUIDE_LIB_BY_PATH: Record<string, string> = {
  '/InterviewUnderCaution': 'lib/guide-interview-under-caution.ts',
  '/PoliceDisclosureGuide': 'lib/guide-police-disclosure.ts',
  '/WhatDoesRepDo': 'lib/guide-what-does-rep-do.ts',
  '/DutySolicitorVsRep': 'lib/guide-duty-solicitor-vs-rep.ts',
  '/PrepareForCIT': 'lib/guide-prepare-for-cit.ts',
  '/BuildPortfolioGuide': 'lib/guide-build-portfolio.ts',
  '/PrepareForWrittenExam': 'lib/guide-prepare-for-written-exam.ts',
  '/GettingStarted': 'lib/guide-getting-started.ts',
  '/AccreditedRepresentativeGuide': 'lib/guide-accredited-representative.ts',
  '/HowToBecome': 'lib/guide-how-to-become-short.ts',
  '/CriminalLawCareerGuide': 'lib/guide-criminal-law-career.ts',
};

const FEE_RIGHTS_PATHS = new Set([
  '/PoliceStationRates',
  '/PoliceStationRepPay',
  '/EscapeFeeCalculator',
  '/MagistratesCourtFees',
  '/CrownCourtFees',
  '/free-legal-advice-police-station',
  '/police-station-rights-uk',
  '/PACE',
]);

const RED_FLAG_RULES: Array<{
  code: string;
  severity: 'PROBLEM' | 'REVIEW';
  re: RegExp;
  message: string;
  skip?: RegExp;
}> = [
  {
    code: 'legacy-bail-28-days',
    severity: 'PROBLEM',
    re: /0-28 days.*(?:Initial bail|bail period)|28 days-3 months.*(?:First extension|Inspector)/i,
    message: 'Legacy pre-2022 pre-charge bail limits — use PCSC Act 2022 ABP regime (3/6/9 months + magistrates’ court)',
  },
  {
    code: 'bail-act-2024',
    severity: 'PROBLEM',
    re: /Bail Act 2024/i,
    message: 'Non-existent "Bail Act 2024" — use PCSC Act 2022 Sch. 4',
  },
  {
    code: 'fee-181',
    severity: 'PROBLEM',
    re: /£181\b/,
    message: 'Superseded £181 police-station fee — use SI 2025/1251 harmonised rates',
  },
  {
    code: 'fee-219',
    severity: 'PROBLEM',
    re: /£219\b/,
    message: 'Superseded £219 police-station fee — use SI 2025/1251 harmonised rates',
  },
  {
    code: 'crm6-billing',
    severity: 'PROBLEM',
    re: /\bCRM6\b/,
    message: 'CRM6 is not the police-station billing form — use SaBC/INVC (+ CRM18 escape)',
  },
  {
    code: 'portfolio-min-6',
    severity: 'PROBLEM',
    re: /minimum\s+6\s+(cases|attendances|portfolio|case studies)|6\s*\+\s*10\s+(cases|attendances)|six\s+cases.*ten\s+cases/i,
    skip: /not in PSRA|those numbers are not|Treating portfolio|is nine case|2\+2\+5/i,
    message: 'Incorrect PSRAS portfolio counts — PSRA 2025 requires 2+2+5 (nine cases)',
  },
  {
    code: 'portfolio-min-10',
    severity: 'PROBLEM',
    re: /minimum\s+10\s+(cases|attendances|portfolio|case studies)/i,
    message: 'Incorrect PSRAS portfolio minimum — verify against PSRA 2025 (nine cases total)',
  },
  {
    code: 'exam-pass-60-70',
    severity: 'PROBLEM',
    re: /60[–-]70\s*%\s*(pass|written)|written exam.*60[–-]70/i,
    message: 'Unverified written-exam pass-rate claim — PSRA 2025 requires 50% on four of five questions',
  },
  {
    code: 'live-actor-cit',
    severity: 'PROBLEM',
    re: /\blive actors?\b/i,
    skip: /\blive actors?\s+or\s+audio\b/i,
    message: 'CIT uses audio role-play (Datalaw), not live actors',
  },
  {
    code: 'dscc-duty-rota-rep',
    severity: 'PROBLEM',
    re: /register with the DSCC duty rota|register with the DSCC scheme where you intend to take duty work/i,
    message: 'Reps cannot join the duty solicitor rota — PSRAS + firm instruction only',
  },
  {
    code: 'sqe-written-exempt',
    severity: 'REVIEW',
    re: /SQE.{0,80}exempt.{0,40}written|written exam.{0,40}SQE.{0,40}exempt/i,
    message: 'SQE-only exemption claim — verify against PSRA 2025 (no SQE-only exemption)',
  },
  {
    code: 'fee-320-no-date',
    severity: 'REVIEW',
    re: /£320/,
    skip: /22\s+Dec(?:ember)?\s+2025|SI 2025\/1251|from 22|December 2025|Dec 2025 onwards|harmonised fixed fee/i,
    message: '£320 fee figure without SI 2025/1251 / 22 Dec 2025 effective-date context',
  },
  {
    code: 'fee-650-escape-no-date',
    severity: 'REVIEW',
    re: /£650/,
    skip: /22\s+Dec(?:ember)?\s+2025|SI 2025\/1251|from 22|December 2025|indicative £450|provider timetable|CIT resit|assessment fee|PSRAS/i,
    message: '£650 escape-threshold figure without SI 2025/1251 / 22 Dec 2025 context',
  },
  {
    code: 'si-2025-no-date',
    severity: 'REVIEW',
    re: /SI 2025\/1251/,
    skip: /22\s+Dec(?:ember)?\s+2025|in force from 22/i,
    message: 'SI 2025/1251 cited without in-force date context',
  },
];

const KNOWN_BAD_CITATIONS: Array<{ code: string; re: RegExp; message: string }> = [
  { code: 'citation-ath', re: /\bATH v R\b/i, message: 'Removed hallucinated ATH v R citation' },
  { code: 'citation-dobson-bwv', re: /R v Dobson.*BWV|BWV.*R v Dobson/i, message: 'Misattributed R v Dobson BWV citation' },
  { code: 'citation-dhesi', re: /ex parte Dhesi|Inland Revenue.*Dhesi/i, message: 'Removed unverifiable Dhesi citation' },
  { code: 'citation-ghosh', re: /\bR v Ghosh\b/i, message: 'Ghosh dishonesty test superseded by Ivey v Genting Casinos' },
];

const REGISTERED_NAMES = new Set(VERIFIED_CASES.map((c) => c.name.toLowerCase()));
const REGISTERED_CITATIONS = new Set(VERIFIED_CASES.map((c) => c.citation.replace(/\s+/g, ' ')));

function readText(filePath: string): string {
  const full = path.join(ROOT, filePath);
  if (!fs.existsSync(full)) return '';
  return fs.readFileSync(full, 'utf8');
}

function excerpt(text: string, index: number, len = 80): string {
  const start = Math.max(0, index - 30);
  return text.slice(start, start + len).replace(/\s+/g, ' ').trim();
}

function scanText(text: string): RedFlag[] {
  const flags: RedFlag[] = [];
  for (const rule of RED_FLAG_RULES) {
    const m = rule.re.exec(text);
    if (!m) continue;
    if (rule.skip?.test(text)) continue;
    flags.push({
      severity: rule.severity,
      code: rule.code,
      message: rule.message,
      excerpt: excerpt(text, m.index),
    });
  }
  for (const bad of KNOWN_BAD_CITATIONS) {
    const m = bad.re.exec(text);
    if (m) {
      flags.push({
        severity: 'PROBLEM',
        code: bad.code,
        message: bad.message,
        excerpt: excerpt(text, m.index),
      });
    }
  }
  flags.push(...findUnregisteredCaseCitations(text));
  return flags;
}

function normalizeCaseName(name: string): string {
  return name
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\bex p\b/gi, 'ex parte')
    .trim()
    .toLowerCase();
}

function isRegisteredCase(rawName: string, citation?: string): boolean {
  const key = normalizeCaseName(rawName);
  if (REGISTERED_NAMES.has(key)) return true;
  const normCitation = citation?.replace(/\s+/g, ' ').replace(/\*/g, '');
  if (normCitation && REGISTERED_CITATIONS.has(normCitation)) return true;
  return VERIFIED_CASES.some((c) => {
    const reg = c.name.toLowerCase();
    return reg === key || reg.startsWith(key) || key.startsWith(reg);
  });
}

function findUnregisteredCaseCitations(text: string): RedFlag[] {
  const flags: RedFlag[] = [];
  const re =
    /\*?(R v [A-Z][a-zA-Z'.\-]+(?:\s+(?:and\s+)?[A-Za-z'.\-]+)*|R \(Bright\) v Central Criminal Court|R \(Bright\) v [A-Z][a-zA-Z'.\-]+(?:\s+[A-Za-z'.\-]+)*|DPP v [A-Z][a-zA-Z'.\-]+(?:\s+[A-Za-z'.\-]+)*|R v Manchester Crown Court, ex parte McDonald|R v DPP, ex parte Lee|R v Derby Magistrates' Court, ex parte B)\*?\s*(\[[^\]]+\])?/gi;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = re.exec(text)) !== null) {
    const rawName = m[1].replace(/\*/g, '').trim();
    const key = normalizeCaseName(rawName);
    if (seen.has(key)) continue;
    seen.add(key);
    if (isRegisteredCase(rawName, m[2])) continue;
    if (/R v Smith|R v Jones|R v Example/i.test(rawName)) continue;
    flags.push({
      severity: 'REVIEW',
      code: 'unregistered-case',
      message: `Case citation not in case-law registry: ${rawName}${m[2] ?? ''}`,
      excerpt: excerpt(text, m.index),
    });
  }
  return flags;
}

function parseAuditLog(): {
  tiers: Map<string, number>;
  tier8: Set<string>;
  tier8BlogAll: boolean;
  tier8WikiAll: boolean;
  tier8LegalAll: boolean;
} {
  const md = fs.readFileSync(AUDIT_LOG, 'utf8');
  const tiers = new Map<string, number>();
  const tier8 = new Set<string>();
  let tier8BlogAll = false;
  let tier8WikiAll = false;
  let tier8LegalAll = false;
  let currentTier: number | null = null;
  for (const line of md.split('\n')) {
    const tierMatch = line.match(/^## Tier (\d+)/);
    if (tierMatch) currentTier = Number(tierMatch[1]);
    if (currentTier === 8) {
      if (/blog \(26\)|all 26 blog|26 blog articles/i.test(line)) tier8BlogAll = true;
      if (/wiki \(49\)|all 49 wiki|49 wiki articles/i.test(line)) tier8WikiAll = true;
      if (/legal updates \(8\)|all 8 legal/i.test(line)) tier8LegalAll = true;
    }
    if (!currentTier) continue;

    for (const m of line.matchAll(/`(\/[^`]+)`/g)) {
      tiers.set(m[1], currentTier);
      if (currentTier === 8) tier8.add(m[1]);
    }

    for (const m of line.matchAll(/\*\*`([^`/]+)`\*\*/g)) {
      tiers.set(m[1], currentTier);
    }

    const slugOnly = line.match(/^#### `([^`]+)`/);
    if (slugOnly && !slugOnly[1].includes('/')) {
      tiers.set(slugOnly[1], currentTier);
    }

    const headingSlug = line.match(/^### `([^`/]+)`/);
    if (headingSlug) {
      tiers.set(headingSlug[1], currentTier);
    }
  }
  return { tiers, tier8, tier8BlogAll, tier8WikiAll, tier8LegalAll };
}

function auditStatusFor(
  url: string,
  slug: string | null,
  tiers: Map<string, number>,
  tier8: Set<string>,
  flags: { tier8BlogAll: boolean; tier8WikiAll: boolean; tier8LegalAll: boolean }
): {
  tier: number | null;
  status: string;
} {
  if (tier8.has(url) || (slug && tier8.has(slug))) return { tier: 8, status: 'verified-tier-8' };
  if (flags.tier8BlogAll && url.startsWith('/Blog/')) return { tier: 8, status: 'verified-tier-8' };
  if (flags.tier8WikiAll && url.startsWith('/Wiki/')) return { tier: 8, status: 'verified-tier-8' };
  if (flags.tier8LegalAll && url.startsWith('/LegalUpdates/')) return { tier: 8, status: 'verified-tier-8' };
  const byUrl = tiers.get(url);
  if (byUrl) return { tier: byUrl, status: `verified-tier-${byUrl}` };
  const pathKey = url.replace(/^\//, '');
  const byPathKey = tiers.get(pathKey);
  if (byPathKey) return { tier: byPathKey, status: `verified-tier-${byPathKey}` };
  if (slug) {
    const bySlug = tiers.get(slug);
    if (bySlug) return { tier: bySlug, status: `verified-tier-${bySlug}` };
  }
  return { tier: null, status: 'not-in-audit-log' };
}

function pageCompliance(pagePath: string): { notice: boolean; sources: boolean; sourceFile: string } {
  const segment = pagePath.replace(/^\//, '');
  const candidates = [
    path.join(ROOT, 'app', segment, 'page.tsx'),
    path.join(ROOT, 'app', segment, '[slug]', 'page.tsx'),
  ];
  const filePath = candidates.find((p) => fs.existsSync(p));
  if (!filePath) {
    return { notice: false, sources: false, sourceFile: `app/${segment}/page.tsx (missing)` };
  }
  const src = fs.readFileSync(filePath, 'utf8');
  return {
    notice: /ContentReliabilityNotice|StructuredGuideShell/.test(src),
    sources: /ResolvedContentSources|StructuredGuideShell|getContentSources\(/.test(src),
    sourceFile: path.relative(ROOT, filePath),
  };
}

function complianceGaps(item: InventoryItem): RedFlag[] {
  const gaps: RedFlag[] = [];
  if (!item.hasReliabilityNotice) {
    gaps.push({
      severity: 'GAP',
      code: 'missing-reliability-notice',
      message: 'Missing ContentReliabilityNotice (or StructuredGuideShell)',
    });
  }
  if (!item.hasSourcesFooter) {
    gaps.push({
      severity: 'GAP',
      code: 'missing-sources-footer',
      message: 'Missing ResolvedContentSources / getContentSources footer',
    });
  }
  if (!item.customSourcesInContentSources) {
    gaps.push({
      severity: 'GAP',
      code: 'generic-content-sources',
      message: 'No page-specific mapping in lib/content-sources.ts (BLOG_SLUG / WIKI_SLUG / PAGE_PATH)',
    });
  }
  if (item.auditTier === null) {
    gaps.push({
      severity: 'GAP',
      code: 'not-in-audit-log',
      message: 'No entry in audit/CONTENT-ACCURACY-REVIEW.md',
    });
  }
  return gaps;
}

function buildInventory(): InventoryItem[] {
  const { tiers, tier8, tier8BlogAll, tier8WikiAll, tier8LegalAll } = parseAuditLog();
  const tier8Flags = { tier8BlogAll, tier8WikiAll, tier8LegalAll };
  const items: InventoryItem[] = [];

  for (const article of getAllBlogArticles()) {
    const url = `/Blog/${article.slug}`;
    const text = [article.bodyMarkdown, article.summary, ...(article.faqs?.map((f) => `${f.q} ${f.a}`) ?? [])].join('\n');
    const ctx: ContentSourceContext = { kind: 'blog', slug: article.slug };
    const audit = auditStatusFor(url, article.slug, tiers, tier8, tier8Flags);
    const item: InventoryItem = {
      url,
      contentType: 'blog',
      sourceFile: 'lib/blog/articles-batch-*.ts',
      hasReliabilityNotice: true,
      hasSourcesFooter: true,
      customSourcesInContentSources: hasSlugSpecificSources(ctx),
      auditTier: audit.tier,
      auditStatus: audit.status,
      redFlags: scanText(text),
    };
    item.redFlags.push(...complianceGaps(item));
    items.push(item);
  }

  const wikiArticles = JSON.parse(readText('data/wiki-articles.json')) as Array<{
    slug: string;
    category: string;
    content: string;
  }>;
  for (const article of wikiArticles) {
    const url = `/Wiki/${article.slug}`;
    const ctx: ContentSourceContext = { kind: 'wiki', slug: article.slug, category: article.category };
    const audit = auditStatusFor(url, article.slug, tiers, tier8, tier8Flags);
    const item: InventoryItem = {
      url,
      contentType: 'wiki',
      sourceFile: 'data/wiki-articles.json',
      hasReliabilityNotice: true,
      hasSourcesFooter: true,
      customSourcesInContentSources: hasSlugSpecificSources(ctx),
      auditTier: audit.tier,
      auditStatus: audit.status,
      redFlags: scanText(article.content),
    };
    item.redFlags.push(...complianceGaps(item));
    items.push(item);
  }

  const legalUpdates = JSON.parse(readText('data/legal-updates.json')) as Array<{ slug: string; content: string }>;
  for (const article of legalUpdates) {
    const url = `/LegalUpdates/${article.slug}`;
    const ctx: ContentSourceContext = { kind: 'legal-update', slug: article.slug };
    const audit = auditStatusFor(url, article.slug, tiers, tier8, tier8Flags);
    const item: InventoryItem = {
      url,
      contentType: 'legal-update',
      sourceFile: 'data/legal-updates.json',
      hasReliabilityNotice: true,
      hasSourcesFooter: true,
      customSourcesInContentSources: hasSlugSpecificSources(ctx),
      auditTier: audit.tier,
      auditStatus: audit.status,
      redFlags: scanText(article.content),
    };
    item.redFlags.push(...complianceGaps(item));
    items.push(item);
  }

  for (const pagePath of EDITORIAL_PAGE_PATHS) {
    const compliance = pageCompliance(pagePath);
    const libFile = GUIDE_LIB_BY_PATH[pagePath];
    const pageSrc = readText(compliance.sourceFile);
    const libSrc = libFile ? readText(libFile) : '';
    const text = `${pageSrc}\n${libSrc}`;
    const ctx: ContentSourceContext = { kind: 'page', path: pagePath };
    const audit = auditStatusFor(pagePath, null, tiers, tier8, tier8Flags);
    const contentType: ContentType = FEE_RIGHTS_PATHS.has(pagePath) ? 'fee-rights' : 'guide';
    const item: InventoryItem = {
      url: pagePath,
      contentType,
      sourceFile: libFile ?? compliance.sourceFile,
      hasReliabilityNotice: compliance.notice,
      hasSourcesFooter: compliance.sources,
      customSourcesInContentSources: hasSlugSpecificSources(ctx),
      auditTier: audit.tier,
      auditStatus: audit.status,
      redFlags: scanText(text),
    };
    item.redFlags.push(...complianceGaps(item));
    items.push(item);
  }

  return items;
}

function writeProblemsMd(items: InventoryItem[], generatedAt: string): void {
  const critical = items.flatMap((i) =>
    i.redFlags.filter((f) => f.severity === 'PROBLEM').map((f) => ({ ...f, item: i }))
  );
  const review = items.flatMap((i) =>
    i.redFlags.filter((f) => f.severity === 'REVIEW').map((f) => ({ ...f, item: i }))
  );
  const gaps = items.flatMap((i) =>
    i.redFlags.filter((f) => f.severity === 'GAP').map((f) => ({ ...f, item: i }))
  );
  const ok = items.filter(
    (i) =>
      i.auditStatus === 'verified-tier-8' &&
      !i.redFlags.some((f) => f.severity === 'PROBLEM' || f.severity === 'REVIEW')
  );

  const row = (entry: { item: InventoryItem; code: string; message: string; excerpt?: string }) =>
    `- **${entry.item.url}** · \`${entry.item.sourceFile}\` · ${entry.message}${entry.excerpt ? ` · _"${entry.excerpt}"_` : ''}`;

  const md = `# Content accuracy problem register

Generated: ${generatedAt} by \`npm run audit:content-accuracy\`

## Honest limits

- Rep profile text, \`stations.json\`, and legal directory listings are **out of scope** (operational data).
- Future LAA fee changes require re-audit when SI/contracts update.
- Automation catches known bad patterns and missing footers; nuanced legal prose still needs human judgment.

## Summary

| Severity | Count |
|---|---|
| Critical (PROBLEM) | ${critical.length} |
| Review | ${review.length} |
| Compliance gap (GAP) | ${gaps.length} |
| OK (verified Tier 8) | ${ok.length} |
| Total editorial URLs | ${items.length} |

## Critical (factual error — fix before rely)

${critical.length ? critical.map(row).join('\n') : '_None — scan clean._'}

## Review (unverified or ambiguous)

${review.length ? review.map(row).join('\n') : '_None — scan clean._'}

## Compliance gap (missing sources footer / notice / audit log)

${gaps.length ? gaps.map(row).join('\n') : '_None._'}

## OK (verified Tier 8)

${ok.length ? ok.map((i) => `- ${i.url} · ${i.sourceFile}`).join('\n') : '_Tier 8 verification in progress — run manual pass and update CONTENT-ACCURACY-REVIEW.md._'}
`;

  fs.writeFileSync(PROBLEMS_MD, md);
}

function main(): void {
  const items = buildInventory();
  const generatedAt = new Date().toISOString();
  const summary = {
    generatedAt,
    totalItems: items.length,
    critical: items.filter((i) => i.redFlags.some((f) => f.severity === 'PROBLEM')).length,
    review: items.filter((i) => i.redFlags.some((f) => f.severity === 'REVIEW')).length,
    gaps: items.filter((i) => i.redFlags.some((f) => f.severity === 'GAP')).length,
    byContentType: items.reduce<Record<string, number>>((acc, i) => {
      acc[i.contentType] = (acc[i.contentType] ?? 0) + 1;
      return acc;
    }, {}),
    items,
  };

  fs.mkdirSync(path.dirname(REGISTER_JSON), { recursive: true });
  fs.writeFileSync(REGISTER_JSON, JSON.stringify(summary, null, 2));
  writeProblemsMd(items, generatedAt);

  console.log(`Content accuracy scan: ${items.length} editorial URLs`);
  console.log(`  Critical (PROBLEM): ${summary.critical}`);
  console.log(`  Review: ${summary.review}`);
  console.log(`  Compliance gaps: ${summary.gaps}`);
  console.log(`Wrote ${path.relative(ROOT, REGISTER_JSON)}`);
  console.log(`Wrote ${path.relative(ROOT, PROBLEMS_MD)}`);

  if (summary.critical > 0) {
    console.error('\nCritical factual red flags found — fix before relying on content.');
    process.exit(1);
  }
}

main();
