import fs from 'fs';
import path from 'path';
import { getAllBlogArticles } from '@/lib/blog/registry';
import { hasSlugSpecificSources, type ContentSourceContext } from '@/lib/content-sources';
import { AUDIT_LOG_PATH, EDITORIAL_PAGE_PATHS, FEE_RIGHTS_PATHS, GUIDE_LIB_BY_PATH } from './constants';
import { scanText } from './rules';
import type { ContentType, InventoryItem, RedFlag } from './types';

const ROOT = process.cwd();

function readText(filePath: string): string {
  const full = path.join(ROOT, filePath);
  if (!fs.existsSync(full)) return '';
  return fs.readFileSync(full, 'utf8');
}

function parseAuditLog(): {
  tiers: Map<string, number>;
  tier8: Set<string>;
  tier8BlogAll: boolean;
  tier8WikiAll: boolean;
  tier8LegalAll: boolean;
} {
  const auditPath = path.join(ROOT, AUDIT_LOG_PATH);
  const md = fs.readFileSync(auditPath, 'utf8');
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
  flags: { tier8BlogAll: boolean; tier8WikiAll: boolean; tier8LegalAll: boolean },
): { tier: number | null; status: string } {
  if (tier8.has(url) || (slug && tier8.has(slug))) return { tier: 8, status: 'verified-tier-8' };
  if (flags.tier8BlogAll && url.startsWith('/Blog/')) return { tier: 8, status: 'verified-tier-8' };
  if (flags.tier8WikiAll && url.startsWith('/Wiki/')) return { tier: 8, status: 'verified-tier-8' };
  if (flags.tier8LegalAll && url.startsWith('/LegalUpdates/'))
    return { tier: 8, status: 'verified-tier-8' };
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

/** Full page-level inventory for offline CI reports. */
export function buildInventory(): InventoryItem[] {
  const { tiers, tier8, tier8BlogAll, tier8WikiAll, tier8LegalAll } = parseAuditLog();
  const tier8Flags = { tier8BlogAll, tier8WikiAll, tier8LegalAll };
  const items: InventoryItem[] = [];

  for (const article of getAllBlogArticles()) {
    const url = `/Blog/${article.slug}`;
    const text = [
      article.bodyMarkdown,
      article.summary,
      ...(article.faqs?.map((f) => `${f.q} ${f.a}`) ?? []),
    ].join('\n');
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
