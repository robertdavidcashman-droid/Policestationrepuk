#!/usr/bin/env node
/**
 * Remove stale CustodyNote mirror page and refresh embedded promo copy in crawl data.
 * The live /CustodyNote route is served by app/CustodyNote/page.tsx — mirror entry is obsolete.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const REPLACEMENTS = [
  [/CustodyNote/g, 'Custody Note'],
  [/Version 1\.4\.\d+/g, 'Version 1.9.11'],
  [/Windows 10\+ · From £15\.99\/mo/g, 'Windows 10+ and macOS 11+ · From £15.99/mo'],
  [/No credit card for trial · Windows 10\+ ·/g, 'No credit card for trial · Windows 10+ and macOS 11+ ·'],
  [/in one Windows app/g, 'on Windows and Mac'],
  [/one Windows app/g, 'Windows and Mac desktop apps'],
  [/Mac\/iPad waitlist/g, 'browser/PWA early access'],
  [/Register interest in Custody Note Anywhere/g, 'Learn about Custody Note Anywhere'],
  [
    /Custody Note Anywhere — coming soon/gi,
    'Custody Note Anywhere — early-access browser option',
  ],
  [
    /try Custody Note free for 30 days PSR UK readers £11\.99\/mo · code A2MJY2NQ/g,
    'try Custody Note free for 30 days — download for Windows and Mac at custodynote.com/download',
  ],
  [
    /Write structured PACE custody notes in 3 minutes — try Custody Note free for 30 days/g,
    'Structured custody attendance notes for criminal defence work — try Custody Note free for 30 days',
  ],
];

const DEDICATED_MIRROR_PATHS = new Set(['/CustodyNote', '/custodynote']);

function applyReplacements(text) {
  if (!text || typeof text !== 'string') return text;
  let out = text;
  for (const [pattern, replacement] of REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function deepClean(value) {
  if (typeof value === 'string') return applyReplacements(value);
  if (Array.isArray(value)) return value.map(deepClean);
  if (value && typeof value === 'object') {
    const next = {};
    for (const [k, v] of Object.entries(value)) {
      next[k] = deepClean(v);
    }
    return next;
  }
  return value;
}

function cleanPagesJson() {
  const file = path.join(ROOT, 'data', 'pages.json');
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const before = raw.pages.length;
  raw.pages = raw.pages
    .filter((p) => !DEDICATED_MIRROR_PATHS.has(p.path))
    .map((p) => deepClean(p));
  raw.count = raw.pages.length;
  fs.writeFileSync(file, JSON.stringify(raw));
  console.log(`pages.json: removed ${before - raw.count} CustodyNote mirror page(s); ${raw.count} pages remain`);
}

function cleanPageContentJson() {
  const file = path.join(ROOT, 'data', 'page-content.json');
  if (!fs.existsSync(file)) return;
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const before = raw.pages?.length ?? 0;
  if (Array.isArray(raw.pages)) {
    raw.pages = raw.pages
      .filter((p) => !DEDICATED_MIRROR_PATHS.has(p.path))
      .map((p) => deepClean(p));
    raw.count = raw.pages.length;
  } else {
    Object.assign(raw, deepClean(raw));
  }
  fs.writeFileSync(file, JSON.stringify(raw, null, 2) + '\n');
  console.log(`page-content.json: cleaned (${before} pages before filter)`);
}

function removeCrawlCustodyNote() {
  const file = path.join(ROOT, 'content', 'crawl', 'CustodyNote.json');
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log('Removed content/crawl/CustodyNote.json (obsolete mirror)');
  }
}

function cleanCrawlPagesJson() {
  const file = path.join(ROOT, 'data', 'crawl-pages.json');
  if (!fs.existsSync(file)) return;
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (Array.isArray(raw.pages)) {
    const before = raw.pages.length;
    raw.pages = raw.pages
      .filter((p) => !DEDICATED_MIRROR_PATHS.has(p.path))
      .map((p) => deepClean(p));
    raw.count = raw.pages.length;
    fs.writeFileSync(file, JSON.stringify(raw, null, 2) + '\n');
    console.log(`crawl-pages.json: removed ${before - raw.pages.length} mirror page(s)`);
  }
}

cleanPagesJson();
cleanPageContentJson();
cleanCrawlPagesJson();
removeCrawlCustodyNote();
console.log('Done.');
