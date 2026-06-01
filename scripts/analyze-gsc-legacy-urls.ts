#!/usr/bin/env npx tsx
/**
 * Classify legacy URLs for GSC 404/redirect triage.
 *
 * Run:
 *   npx tsx scripts/analyze-gsc-legacy-urls.ts
 *   npx tsx scripts/analyze-gsc-legacy-urls.ts path/to/gsc-export.csv
 *
 * CSV: first column URL or path (Google Search Console Pages export).
 * Without CSV, uses docs/live-site-map.json blog paths.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NEW_BLOG_SLUG_SET, resolveLegacyBlogRedirect } from '../lib/blog/legacy-blog-slugs';
import { LEGACY_EXACT_REDIRECTS } from '../lib/legacy-exact-redirects';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapPath = path.join(root, 'docs/live-site-map.json');

function pathFromInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.startsWith('http')) {
      return new URL(trimmed).pathname;
    }
  } catch {
    /* fall through */
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function readCsvPaths(filePath: string): string[] {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  const paths: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && /^url/i.test(line)) continue;
    const col = line.split(',')[0]?.replace(/^"/, '').replace(/"$/, '') ?? '';
    const p = pathFromInput(col);
    if (p) paths.push(p);
  }
  return paths;
}

function readMapBlogPaths(): string[] {
  const map = JSON.parse(fs.readFileSync(mapPath, 'utf8')) as { urls: { path: string }[] };
  return map.urls
    .map((u) => u.path)
    .filter((p) => /^\/blog\//i.test(p) || /^\/Blog\//i.test(p));
}

const csvArg = process.argv[2];
const inputPaths = csvArg ? readCsvPaths(path.resolve(csvArg)) : readMapBlogPaths();

const slugFrom = (p: string) => p.replace(/^\/blog\//i, '').replace(/^\/Blog\//, '');

const buckets = {
  currentArticle: [] as string[],
  redirectSpecific: [] as { from: string; to: string }[],
  redirectHub: [] as { from: string; to: string }[],
  exactLegacy: [] as { from: string; to: string }[],
  unclassified: [] as string[],
};

for (const p of inputPaths) {
  const key = p.toLowerCase();
  const exact = LEGACY_EXACT_REDIRECTS[key];
  if (exact && p !== exact) {
    buckets.exactLegacy.push({ from: p, to: exact });
    continue;
  }

  if (!/^\/blog\//i.test(p) && !/^\/Blog\//i.test(p)) {
    buckets.unclassified.push(p);
    continue;
  }

  const slug = slugFrom(p);
  if (NEW_BLOG_SLUG_SET.has(slug)) {
    buckets.currentArticle.push(p);
    continue;
  }
  const target = resolveLegacyBlogRedirect(slug);
  if (target === '/Blog') buckets.redirectHub.push({ from: p, to: target });
  else if (target) buckets.redirectSpecific.push({ from: p, to: target });
  else buckets.unclassified.push(p);
}

console.log(`GSC legacy URL audit${csvArg ? ` (CSV: ${csvArg})` : ' (live-site-map blog paths)'}\n`);
console.log(`Input paths: ${inputPaths.length}`);
console.log(`  Exact legacy redirects: ${buckets.exactLegacy.length}`);
console.log(`  Current editorial articles: ${buckets.currentArticle.length}`);
console.log(`  Redirect to specific article: ${buckets.redirectSpecific.length}`);
console.log(`  Redirect to /Blog hub: ${buckets.redirectHub.length}`);
console.log(`  Unclassified / no rule: ${buckets.unclassified.length}`);
console.log('\nSample exact legacy:');
buckets.exactLegacy.slice(0, 5).forEach(({ from, to }) => console.log(`  ${from} → ${to}`));
console.log('\nSample specific redirects:');
buckets.redirectSpecific.slice(0, 8).forEach(({ from, to }) => console.log(`  ${from} → ${to}`));
console.log('\nNote: Any /Blog/{slug} not in the editorial set now 301s via middleware — no 404.');
