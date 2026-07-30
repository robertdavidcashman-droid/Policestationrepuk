#!/usr/bin/env node
/**
 * Post-deploy production kick for firm outreach (used by GitHub Actions).
 *
 * Usage:
 *   FIRM_OUTREACH_KICK_BASE_URL=https://policestationrepuk.org \
 *   CRON_SECRET=... node scripts/firm-outreach-production-kick.mjs
 *
 * Optionally loads `.env.production` (from `vercel env pull`) via dotenv so
 * bash `source` quoting/expansion cannot drop CRON_SECRET.
 */
import { existsSync, readFileSync } from 'node:fs';
import { parse as parseDotenv } from 'dotenv';
import {
  DEFAULT_PRODUCTION_KICK_STEPS,
  resolveKickAuth,
  runProductionKickSteps,
  waitForVercelProductionDeploy,
} from '../lib/firm-outreach/production-kick.ts';

function loadEnvFileIfPresent(path) {
  if (!existsSync(path)) return { loaded: false, filled: [] };
  const parsed = parseDotenv(readFileSync(path));
  const filled = [];
  for (const [key, value] of Object.entries(parsed)) {
    const current = process.env[key];
    // Fill missing/empty only — never overwrite a non-empty GH secret.
    if (current == null || current === '') {
      process.env[key] = value;
      if (value) filled.push(key);
    }
  }
  return { loaded: true, filled };
}

const envLoad = loadEnvFileIfPresent('.env.production');
if (envLoad.loaded) {
  console.log(
    `Loaded .env.production (filled empty keys: ${envLoad.filled.length}; cron_len=${(process.env.CRON_SECRET || '').length})`,
  );
}

const baseUrl = process.env.FIRM_OUTREACH_KICK_BASE_URL?.trim();
if (!baseUrl) {
  console.error('FIRM_OUTREACH_KICK_BASE_URL is required');
  process.exit(1);
}

const auth = resolveKickAuth(process.env);
if (!auth) {
  const requireAuth = process.env.FIRM_OUTREACH_KICK_REQUIRE_AUTH === '1';
  console.error('No CRON_SECRET or FIRM_OUTREACH_BOOTSTRAP_SECRET after env load');
  if (requireAuth) {
    console.error(
      'Set repository secret CRON_SECRET (same value as Vercel production) or FIRM_OUTREACH_BOOTSTRAP_SECRET.',
    );
    process.exit(1);
  }
  console.log('Skipping kick (auth optional in this context)');
  process.exit(0);
}

const token = process.env.VERCEL_TOKEN?.trim();
const projectId = process.env.VERCEL_PROJECT_ID?.trim();
const teamId = process.env.VERCEL_ORG_ID?.trim();
const commitSha = process.env.FIRM_OUTREACH_KICK_COMMIT_SHA?.trim();

if (token && projectId) {
  console.log('Waiting for Vercel production deploy…');
  const deploy = await waitForVercelProductionDeploy({
    token,
    projectId,
    teamId: teamId || undefined,
    commitSha: commitSha || undefined,
    timeoutMs: Number(process.env.FIRM_OUTREACH_KICK_DEPLOY_WAIT_MS || 600_000),
  });
  if (deploy.ready) {
    console.log('Production deploy ready', deploy.deployment?.url ?? '');
  } else {
    console.warn('Deploy wait timed out — continuing with kick anyway');
  }
}

const { results, failed } = await runProductionKickSteps({
  baseUrl,
  auth,
  steps: DEFAULT_PRODUCTION_KICK_STEPS,
});

for (const r of results) {
  const tag = r.ok ? 'ok' : r.optional ? 'warn' : 'fail';
  console.log(`[${tag}] ${r.label} — HTTP ${r.status}`);
  if (r.body) console.log(r.body.slice(0, 4000));
}

process.exit(failed ? 1 : 0);
