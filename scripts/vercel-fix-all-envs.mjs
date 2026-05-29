#!/usr/bin/env node
// One-shot env hygiene + missing-vars adder. Reads cleaned values from
// .env.local for Lemon Squeezy vars, plus inline literals for non-secret
// vars (NEXT_PUBLIC_SITE_URL, APP_BASE_URL, ADMIN_EMAILS).
//
// Usage:
//   node scripts/vercel-fix-all-envs.mjs           # apply
//   node scripts/vercel-fix-all-envs.mjs --dry-run # show plan
//
// Safe to re-run; each var is rm'd then re-added per environment.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry-run');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL_OVERRIDE || 'robertdavidcashman@gmail.com';
const SITE_URL = 'https://policestationrepuk.org';

const ENVS = ['production', 'preview', 'development'];

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    // Windows spawn requires shell: true to run .cmd shims like npx.cmd
    const child = spawn(cmd, args, {
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: process.platform === 'win32',
    });
    if (opts.input != null) {
      child.stdin.write(opts.input);
      child.stdin.end();
    } else {
      child.stdin.end();
    }
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
  });
}

const npxBin = 'npx';

async function rm(name, env) {
  if (DRY) return console.log(`[dry] rm ${name} ${env}`);
  try {
    await run(npxBin, ['--yes', 'vercel', 'env', 'rm', name, env, '--yes']);
  } catch (err) {
    console.warn(`  rm ${name} ${env}: ${err.message} (continuing)`);
  }
}

async function add(name, env, value) {
  if (DRY) return console.log(`[dry] add ${name} ${env} (${value.length} chars)`);
  await run(npxBin, ['--yes', 'vercel', 'env', 'add', name, env], { input: value });
}

function parseEnvLocal() {
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) {
    throw new Error('.env.local not found; run `vercel env pull .env.local --environment=development --yes` first.');
  }
  const raw = fs.readFileSync(file, 'utf8');
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let [, k, v] = m;
    if (v.startsWith('"') && v.endsWith('"')) {
      v = v.slice(1, -1).replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    }
    out[k] = v.trim();
  }
  return out;
}

async function setVar(name, value, envs = ENVS) {
  if (!value) {
    console.warn(`skip ${name}: empty`);
    return;
  }
  console.log(`==> ${name} (${value.length} chars)`);
  for (const env of envs) {
    await rm(name, env);
    await add(name, env, value);
  }
}

async function main() {
  const env = parseEnvLocal();
  const ls = [
    'LEMONSQUEEZY_API_KEY',
    'LEMONSQUEEZY_STORE_ID',
    'LEMONSQUEEZY_WEBHOOK_SECRET',
    'LEMONSQUEEZY_VARIANT_MONTHLY',
    'LEMONSQUEEZY_VARIANT_3MONTH',
    'LEMONSQUEEZY_VARIANT_6MONTH',
    'LEMONSQUEEZY_VARIANT_YEARLY',
  ];
  for (const name of ls) {
    await setVar(name, env[name]);
  }
  await setVar('NEXT_PUBLIC_SITE_URL', SITE_URL, ['production', 'preview']);
  await setVar('APP_BASE_URL', SITE_URL, ['production', 'preview']);
  await setVar('ADMIN_EMAILS', ADMIN_EMAIL, ENVS);
  const adminPassword = process.env.ADMIN_PASSWORD_OVERRIDE || env.ADMIN_PASSWORD;
  if (adminPassword) {
    await setVar('ADMIN_PASSWORD', adminPassword, ENVS);
  } else {
    console.warn('skip ADMIN_PASSWORD: set ADMIN_PASSWORD in .env.local or ADMIN_PASSWORD_OVERRIDE when running this script');
  }
  const adminPassword = process.env.ADMIN_PASSWORD_OVERRIDE || env.ADMIN_PASSWORD;
  if (adminPassword) {
    await setVar('ADMIN_PASSWORD', adminPassword, ENVS);
  } else {
    console.warn('skip ADMIN_PASSWORD: set ADMIN_PASSWORD in .env.local or ADMIN_PASSWORD_OVERRIDE');
  }
  console.log('\nDone. Trigger a production redeploy: npx vercel --prod --yes');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
