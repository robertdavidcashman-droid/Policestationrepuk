#!/usr/bin/env node
/**
 * Aggregates the Playwright audit JSON reporter output (reports/playwright-audit.json)
 * plus the per-spec JSON files (reports/broken-links.json, reports/article-rendering-audit.json)
 * into:
 *   - reports/site-audit.json
 *   - reports/site-audit.md
 *
 * Exit code: 0 if everything passed, 1 otherwise. Always writes the reports first.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const REPORT_DIR = path.join(ROOT, 'reports');

function readJsonSafe(p, fallback) {
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return fallback;
  }
}

const pwReport = readJsonSafe(path.join(REPORT_DIR, 'playwright-audit.json'), null);
const brokenLinks = readJsonSafe(path.join(REPORT_DIR, 'broken-links.json'), { checks: [], pagesVisited: 0 });

// Aggregate per-route article audit JSON files (avoids parallel-write races during tests).
const articleEntries = [];
const perRouteDir = path.join(REPORT_DIR, 'article-rendering');
if (fs.existsSync(perRouteDir)) {
  for (const f of fs.readdirSync(perRouteDir)) {
    if (!f.endsWith('.json')) continue;
    const entry = readJsonSafe(path.join(perRouteDir, f), null);
    if (entry) articleEntries.push(entry);
  }
}
const articleAudit = { entries: articleEntries };
fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(path.join(REPORT_DIR, 'article-rendering-audit.json'), JSON.stringify(articleAudit, null, 2));

function flattenSuites(suite, parentTitle = '') {
  const cases = [];
  const title = [parentTitle, suite.title].filter(Boolean).join(' › ');
  for (const s of suite.suites ?? []) cases.push(...flattenSuites(s, title));
  for (const spec of suite.specs ?? []) {
    for (const result of spec.tests ?? []) {
      const r = result.results?.[result.results.length - 1] || {};
      cases.push({
        suite: title,
        title: spec.title,
        ok: r.status === 'passed',
        status: r.status || 'unknown',
        durationMs: r.duration || 0,
        file: spec.file,
        errors: (r.errors || []).map((e) => (typeof e === 'string' ? e : e?.message || JSON.stringify(e))),
      });
    }
  }
  return cases;
}

const cases = pwReport ? (pwReport.suites ?? []).flatMap((s) => flattenSuites(s)) : [];
const passed = cases.filter((c) => c.ok).length;
const failed = cases.length - passed;

const byCategory = {
  'how-to-become': cases.filter((c) => c.file?.includes('how-to-become')),
  'article-rendering': cases.filter((c) => c.file?.includes('article-rendering')),
  links: cases.filter((c) => c.file?.includes('link-audit')),
  'nav-footer': cases.filter((c) => c.file?.includes('nav-footer')),
  forms: cases.filter((c) => c.file?.includes('forms-cta')),
  console: cases.filter((c) => c.file?.includes('console-errors')),
  responsive: cases.filter((c) => c.file?.includes('responsive')),
  a11y: cases.filter((c) => c.file?.includes('a11y')),
  seo: cases.filter((c) => c.file?.includes('seo')),
};

const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl: brokenLinks.baseUrl || pwReport?.config?.projects?.[0]?.use?.baseURL || null,
  totals: { cases: cases.length, passed, failed },
  categories: Object.fromEntries(
    Object.entries(byCategory).map(([k, v]) => [k, { total: v.length, passed: v.filter((c) => c.ok).length, failed: v.filter((c) => !c.ok).length }]),
  ),
  brokenInternalLinks: brokenLinks.checks.filter((c) => c.status === null || c.status >= 400).length,
  totalLinksChecked: brokenLinks.checks.length || 0,
  articlePagesAudited: articleAudit.entries?.length || 0,
  articlePagesWithIssues: (articleAudit.entries || []).filter((e) => e.issues?.length).length,
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(path.join(REPORT_DIR, 'site-audit.json'), JSON.stringify({ summary, cases, byCategory }, null, 2));

const md = [];
md.push('# Site audit');
md.push('');
md.push(`Generated: ${summary.generatedAt}`);
md.push(`Base URL: ${summary.baseUrl ?? 'unknown'}`);
md.push('');
md.push('## Totals');
md.push('');
md.push(`- Cases: **${summary.totals.cases}** (passed: ${summary.totals.passed}, failed: ${summary.totals.failed})`);
md.push(`- Internal links checked: **${summary.totalLinksChecked}** (broken: ${summary.brokenInternalLinks})`);
md.push(`- Article pages audited: **${summary.articlePagesAudited}** (with issues: ${summary.articlePagesWithIssues})`);
md.push('');
md.push('## By category');
md.push('');
md.push('| Category | Total | Passed | Failed |');
md.push('| --- | --- | --- | --- |');
for (const [k, v] of Object.entries(summary.categories)) {
  md.push(`| ${k} | ${v.total} | ${v.passed} | ${v.failed} |`);
}
md.push('');
const failures = cases.filter((c) => !c.ok);
if (failures.length) {
  md.push('## Failures');
  md.push('');
  for (const f of failures) {
    md.push(`### ${f.suite} › ${f.title}`);
    md.push('');
    md.push(`Status: \`${f.status}\``);
    md.push(`File: \`${f.file}\``);
    md.push('');
    for (const err of f.errors) {
      md.push('```');
      md.push(err.slice(0, 1200));
      md.push('```');
    }
    md.push('');
  }
}
if (articleAudit.entries?.length) {
  const flagged = articleAudit.entries.filter((e) => e.issues?.length);
  if (flagged.length) {
    md.push('## Article rendering issues');
    md.push('');
    md.push('| URL | Issues | Longest paragraph | H1 |');
    md.push('| --- | --- | --- | --- |');
    for (const a of flagged) {
      md.push(`| ${a.url} | ${a.issues.join(', ')} | ${a.longestParagraphChars} | ${a.h1Count} |`);
    }
    md.push('');
  }
}
const broken = brokenLinks.checks.filter((c) => c.status === null || c.status >= 400);
if (broken.length) {
  md.push('## Broken internal links');
  md.push('');
  md.push('| Source | Anchor | href | Status |');
  md.push('| --- | --- | --- | --- |');
  for (const b of broken.slice(0, 200)) {
    md.push(`| ${b.source || ''} | ${(b.anchor || '').replace(/\|/g, ' ')} | ${b.href || b.resolved} | ${b.status ?? 'ERR'} |`);
  }
  md.push('');
}

fs.writeFileSync(path.join(REPORT_DIR, 'site-audit.md'), md.join('\n'));

console.log(`Site audit summary written to ${path.join('reports', 'site-audit.md')}`);
console.log(`  Passed: ${summary.totals.passed}/${summary.totals.cases}`);
console.log(`  Broken internal links: ${summary.brokenInternalLinks}`);
console.log(`  Article pages with issues: ${summary.articlePagesWithIssues}`);

const exitCode = failed > 0 || summary.brokenInternalLinks > 0 || summary.articlePagesWithIssues > 0 ? 1 : 0;
process.exit(exitCode);
