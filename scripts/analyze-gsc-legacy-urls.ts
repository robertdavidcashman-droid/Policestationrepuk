#!/usr/bin/env npx tsx
/**
 * Classify legacy URLs from docs/live-site-map.json for GSC 404/redirect triage.
 * Run: npx tsx scripts/analyze-gsc-legacy-urls.ts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NEW_BLOG_SLUG_SET, resolveLegacyBlogRedirect } from '../lib/blog/legacy-blog-slugs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapPath = path.join(root, 'docs/live-site-map.json');

const map = JSON.parse(fs.readFileSync(mapPath, 'utf8')) as { urls: { path: string }[] };

const blogPaths = map.urls
  .map((u) => u.path)
  .filter((p) => /^\/blog\//i.test(p) || /^\/Blog\//i.test(p));

const slugFrom = (p: string) => p.replace(/^\/blog\//i, '').replace(/^\/Blog\//, '');

const buckets = {
  currentArticle: [] as string[],
  redirectSpecific: [] as { from: string; to: string }[],
  redirectHub: [] as { from: string; to: string }[],
};

for (const p of blogPaths) {
  const slug = slugFrom(p);
  if (NEW_BLOG_SLUG_SET.has(slug)) {
    buckets.currentArticle.push(p);
    continue;
  }
  const target = resolveLegacyBlogRedirect(slug);
  if (target === '/Blog') buckets.redirectHub.push({ from: p, to: target });
  else if (target) buckets.redirectSpecific.push({ from: p, to: target });
}

console.log('GSC legacy blog URL audit (from live-site-map.json)\n');
console.log(`Blog paths in crawl map: ${blogPaths.length}`);
console.log(`  Current editorial articles: ${buckets.currentArticle.length}`);
console.log(`  Redirect to specific article: ${buckets.redirectSpecific.length}`);
console.log(`  Redirect to /Blog hub: ${buckets.redirectHub.length}`);
console.log('\nSample specific redirects:');
buckets.redirectSpecific.slice(0, 8).forEach(({ from, to }) => console.log(`  ${from} → ${to}`));
console.log('\nNote: Any /Blog/{slug} not in the editorial set now 301s via middleware — no 404.');
