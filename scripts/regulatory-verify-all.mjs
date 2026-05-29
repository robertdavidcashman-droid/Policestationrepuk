#!/usr/bin/env node
/**
 * Re-check every rep against SRA / Law Society / DSCC and auto-publish
 * those on a public register or scored low risk.
 *
 * Usage:
 *   npx tsx scripts/regulatory-verify-all.mjs
 *   npx tsx scripts/regulatory-verify-all.mjs --dry-run
 */
import fs from 'node:fs';
import path from 'node:path';

function readEnvLocal() {
  const f = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(f)) return {};
  const out = {};
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    out[m[1]] = v.trim();
  }
  return out;
}

const DRY_RUN = process.argv.includes('--dry-run');
Object.assign(process.env, readEnvLocal());

const { verifyAndPublishAllReps } = await import('../lib/regulatory-auto-pass.ts');

if (DRY_RUN) {
  console.log('Dry run not implemented — use admin API with apply=false for single rep checks.');
  process.exit(0);
}

console.log('Starting regulatory verify + auto-publish sweep…');
const summary = await verifyAndPublishAllReps('script:regulatory-verify-all');

console.log('\n=== Summary ===');
console.log(`Scanned:            ${summary.scanned}`);
console.log(`Published (register): ${summary.publishedRegister}`);
console.log(`Published (low risk): ${summary.publishedLowRisk}`);
console.log(`Refreshed:          ${summary.refreshed}`);
console.log(`Not eligible:       ${summary.notEligible}`);
console.log(`Skipped:            ${summary.skipped}`);
console.log(`Errors:             ${summary.errors}`);
console.log(`DSCC cache:         ${summary.dsccCacheCount}`);
console.log(`Elapsed:            ${(summary.elapsedMs / 1000).toFixed(1)}s`);

const published = summary.items.filter(
  (i) => i.action === 'published-register' || i.action === 'published-low-risk',
);
if (published.length) {
  console.log('\nNewly published:');
  for (const item of published) {
    console.log(`  ${item.email} (${item.action}${item.passSource ? ` / ${item.passSource}` : ''})`);
  }
}

if (summary.errors) {
  console.log('\nErrors:');
  for (const item of summary.items.filter((i) => i.action === 'error')) {
    console.log(`  ${item.email}: ${item.error}`);
  }
  process.exit(1);
}
