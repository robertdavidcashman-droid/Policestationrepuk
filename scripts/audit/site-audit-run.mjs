#!/usr/bin/env node
/**
 * Orchestrator: runs the Playwright audit suite against a local production build, then
 * runs the report aggregator. Both steps must succeed for the audit to pass.
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const REPORT_DIR = path.join(ROOT, 'reports');

fs.mkdirSync(REPORT_DIR, { recursive: true });
// Clear stale per-spec reports so a stale file from a previous run doesn't poison the new one.
for (const stale of ['broken-links.json', 'article-rendering-audit.json', 'playwright-audit.json', 'site-audit.json', 'site-audit.md']) {
  const p = path.join(REPORT_DIR, stale);
  if (fs.existsSync(p)) {
    try { fs.unlinkSync(p); } catch { /* ignore */ }
  }
}
const perRoute = path.join(REPORT_DIR, 'article-rendering');
if (fs.existsSync(perRoute)) {
  for (const f of fs.readdirSync(perRoute)) {
    if (f.endsWith('.json')) {
      try { fs.unlinkSync(path.join(perRoute, f)); } catch { /* ignore */ }
    }
  }
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { stdio: 'inherit', shell: true, cwd: ROOT, ...opts });
    proc.on('exit', (code) => resolve(code ?? 0));
  });
}

const args = process.argv.slice(2);
const grep = args.find((a) => a.startsWith('--grep='));
const playwrightArgs = ['playwright', 'test', '--config=playwright.audit.config.ts'];
if (grep) playwrightArgs.push(`--grep`, grep.slice('--grep='.length));

console.log('› Ensuring Playwright browsers (chromium, webkit)...');
const install = await run('npx', ['playwright', 'install', 'chromium', 'webkit']);
if (install !== 0) process.exit(install);

console.log('› Running Playwright audit suite...');
const audit = await run('npx', playwrightArgs);
console.log('› Aggregating site audit report...');
const report = await run('node', ['scripts/audit/site-audit-report.mjs']);

const code = audit || report;
process.exit(code);
