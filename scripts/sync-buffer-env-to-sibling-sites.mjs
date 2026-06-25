#!/usr/bin/env node
/**
 * Propagate Buffer credentials + channel IDs from policestationrepuk.org to
 * psrtrain.com and custodynote.com local .env.local files.
 *
 * Usage:
 *   node scripts/sync-buffer-env-to-sibling-sites.mjs
 *   node scripts/sync-buffer-env-to-sibling-sites.mjs --check
 *
 * For full automation (local + Vercel + crons + test): npm run buffer:setup-cross-site
 */
import fs from 'fs';
import path from 'path';
import {
  LOCAL_ENV_MARK_END,
  LOCAL_ENV_MARK_START,
  REPUK_ROOT,
  SIBLING_LOCAL_TARGETS,
} from './lib/buffer-cross-site-config.mjs';

function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return out;
}

function loadSourceSecrets() {
  const local = parseEnvFile(path.join(REPUK_ROOT, '.env.local'));
  const vercel = parseEnvFile(path.join(REPUK_ROOT, '.env.vercel.production'));
  return {
    apiKey: local.BUFFER_API_KEY || vercel.BUFFER_API_KEY || '',
    cron: local.CRON_SECRET || vercel.CRON_SECRET || '',
  };
}

function upsertBlock(existingText, blockLines) {
  const block = [LOCAL_ENV_MARK_START, ...blockLines, LOCAL_ENV_MARK_END].join('\n');
  const re = new RegExp(
    `${LOCAL_ENV_MARK_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${LOCAL_ENV_MARK_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
  );
  if (re.test(existingText)) return existingText.replace(re, block);
  const sep = existingText.endsWith('\n') || existingText.length === 0 ? '' : '\n';
  return `${existingText}${sep}\n${block}\n`;
}

function syncTarget(target, secrets, checkOnly) {
  const envPath = path.join(target.dir, '.env.local');
  const lines = [...target.lines];
  if (secrets.apiKey) lines.unshift(`BUFFER_API_KEY=${secrets.apiKey}`);
  if (secrets.cron) lines.unshift(`CRON_SECRET=${secrets.cron}`);

  const missing = [];
  if (!secrets.apiKey) missing.push('BUFFER_API_KEY (not in REPUK .env.local or .env.vercel.production)');
  if (!fs.existsSync(target.dir)) missing.push(`directory missing: ${target.dir}`);

  if (checkOnly) {
    const cur = parseEnvFile(envPath);
    for (const key of ['BUFFER_API_KEY', 'BUFFER_ORGANIZATION_ID']) {
      if (!cur[key] && !(key === 'BUFFER_API_KEY' && secrets.apiKey)) {
        missing.push(`${target.site}: ${key}`);
      }
    }
    return { site: target.site, envPath, missing, wrote: false };
  }

  if (!secrets.apiKey) {
    return { site: target.site, envPath, missing, wrote: false };
  }

  const prior = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  fs.writeFileSync(envPath, upsertBlock(prior, lines));
  return { site: target.site, envPath, missing, wrote: true };
}

const checkOnly = process.argv.includes('--check');
const secrets = loadSourceSecrets();
const results = SIBLING_LOCAL_TARGETS.map((t) => syncTarget(t, secrets, checkOnly));

console.log(checkOnly ? 'Buffer env check (sibling sites):' : 'Buffer env sync (sibling sites):');
for (const r of results) {
  console.log(`\n${r.site}`);
  console.log(`  path: ${r.envPath}`);
  if (r.wrote) console.log('  status: updated .env.local block');
  else if (checkOnly) console.log('  status: check only');
  else console.log('  status: skipped');
  if (r.missing.length) {
    console.log('  missing:');
    for (const m of r.missing) console.log(`    - ${m}`);
  }
}

if (!secrets.apiKey) {
  console.error('\nCannot sync: BUFFER_API_KEY not found in Policestationrepuk/.env.local');
  process.exit(1);
}

const anyMissing = results.some((r) => r.missing.length > 0);
process.exit(checkOnly && anyMissing ? 1 : 0);
