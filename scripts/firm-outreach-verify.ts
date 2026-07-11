#!/usr/bin/env npx tsx
/**
 * Verify firm outreach repo + production HTTP checks.
 * Usage: npm run firm-outreach:verify
 *        npm run firm-outreach:verify -- --url https://policestationrepuk.org
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  runHttpChecks,
  runRepoChecks,
  runSendHealthChecks,
  summarizeResults,
} from '../lib/firm-outreach/verify-checks';

function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile('.env.local');

async function main() {
  const urlArg = process.argv.find((a) => a.startsWith('--url='))?.slice(6);
  const baseUrl = urlArg || process.env.FIRM_OUTREACH_VERIFY_URL || 'https://policestationrepuk.org';

  const repoResults = runRepoChecks();
  const repoSummary = summarizeResults(repoResults);
  console.log('\n==> Repo checks');
  for (const r of repoResults) {
    console.log(r.ok ? '  OK' : '  FAIL', r.name, r.detail ?? '');
  }

  const sendHealthResults = await runSendHealthChecks();
  const sendHealthSummary = summarizeResults(sendHealthResults);
  console.log('\n==> Send health checks (Resend live when API key set)');
  for (const r of sendHealthResults) {
    console.log(r.ok ? '  OK' : '  FAIL', r.name, r.detail ?? '');
  }

  console.log('\n==> HTTP checks against', baseUrl);
  const httpResults = await runHttpChecks(baseUrl, {
    cronSecret: process.env.CRON_SECRET,
  });
  const httpSummary = summarizeResults(httpResults);
  for (const r of httpResults) {
    console.log(r.ok ? '  OK' : '  FAIL', r.name, r.status ?? '', r.detail ?? '');
  }

  const totalFailed = repoSummary.failed + sendHealthSummary.failed + httpSummary.failed;
  console.log('\nSummary:', repoSummary.passed + sendHealthSummary.passed + httpSummary.passed, 'passed,', totalFailed, 'failed');
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
