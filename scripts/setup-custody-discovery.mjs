#!/usr/bin/env node
/**
 * One-shot custody discovery automation:
 * 1. Load .env.local (+ optional pulled Vercel production env)
 * 2. Bootstrap custody suites into KV
 * 3. Run first discovery batch (official-page fallback works without Serper)
 * 4. Sync custody env vars to Vercel (if present locally)
 * 5. Deploy production (optional --skip-deploy)
 * 6. Trigger production cron endpoint
 *
 * Usage:
 *   node scripts/setup-custody-discovery.mjs
 *   node scripts/setup-custody-discovery.mjs --skip-deploy
 *   node scripts/setup-custody-discovery.mjs --limit=10
 */
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ENV_LOCAL = path.join(ROOT, '.env.local');
const ENV_PULLED = path.join(ROOT, '.env.vercel.production');
const SITE = 'https://policestationrepuk.org';
const SKIP_DEPLOY = process.argv.includes('--skip-deploy');
const LIMIT = (() => {
  const hit = process.argv.find((a) => a.startsWith('--limit='));
  return hit ? Number(hit.split('=')[1]) : 10;
})();

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: opts.input != null ? ['pipe', opts.inherit ? 'inherit' : 'pipe', 'inherit'] : opts.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      cwd: ROOT,
      env: { ...process.env, ...opts.env },
    });
    let out = '';
    let err = '';
    if (!opts.inherit && opts.input == null) {
      child.stdout?.on('data', (d) => { out += d; });
      child.stderr?.on('data', (d) => { err += d; });
    }
    if (opts.input != null) {
      child.stdin.write(opts.input);
      child.stdin.end();
    }
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ out, err });
      else reject(new Error(`${cmd} ${args.join(' ')} failed (${code}): ${err || out}`));
    });
  });
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

function hasKv(env) {
  return Boolean(
    (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) ||
      (env.KV_REST_API_URL && env.KV_REST_API_TOKEN),
  );
}

async function pullProductionEnv() {
  console.log('==> Pulling Vercel production env (for CRON_SECRET)…');
  try {
    await run('npx', ['--yes', 'vercel', 'env', 'pull', ENV_PULLED, '--environment=production', '--yes'], {
      inherit: true,
    });
    return parseEnvFile(ENV_PULLED);
  } catch (err) {
    console.warn('  Could not pull Vercel env:', err.message);
    return {};
  }
}

async function syncVercelVar(name, value, envs = ['production', 'preview', 'development']) {
  if (!value) {
    console.log(`  skip ${name}: not set locally`);
    return;
  }
  console.log(`==> Syncing ${name} to Vercel…`);
  for (const env of envs) {
    try {
      await run('npx', ['--yes', 'vercel', 'env', 'rm', name, env, '--yes'], { inherit: true });
    } catch {
      /* may not exist */
    }
    await run('npx', ['--yes', 'vercel', 'env', 'add', name, env], { inherit: true, input: value });
  }
}

async function ensureCronSecret(localEnv) {
  if (localEnv.CRON_SECRET?.trim()) return localEnv.CRON_SECRET.trim();
  const generated = crypto.randomBytes(32).toString('hex');
  const line = `\nCRON_SECRET=${generated}\n`;
  fs.appendFileSync(ENV_LOCAL, line);
  console.log('==> Generated CRON_SECRET in .env.local (sync to Vercel manually if needed)');
  return generated;
}

async function main() {
  const local = parseEnvFile(ENV_LOCAL);
  const pulled = await pullProductionEnv();
  const merged = { ...local, ...pulled };

  if (!hasKv(merged)) {
    console.error('ABORT: KV not configured. Set KV_REST_API_URL/TOKEN in .env.local');
    process.exit(1);
  }

  const cronSecret = merged.CRON_SECRET?.trim() || (await ensureCronSecret(local));

  // Sync optional custody vars when present locally
  const toSync = [
    ['SERPER_API_KEY', merged.SERPER_API_KEY],
    ['CUSTODY_DISCOVERY_BATCH_LIMIT', merged.CUSTODY_DISCOVERY_BATCH_LIMIT || '25'],
    ['CUSTODY_DISCOVERY_CACHE_SECONDS', merged.CUSTODY_DISCOVERY_CACHE_SECONDS || '300'],
  ];
  for (const [name, value] of toSync) {
    if (!value) continue;
    await syncVercelVar(name, value, ['production']).catch((e) => console.warn(`  ${name}: ${e.message}`));
  }

  if (!merged.SERPER_API_KEY) {
    console.log('\nNote: SERPER_API_KEY not set — crawler uses official force page fetching only.');
    console.log('  Get a free key at https://serper.dev and add SERPER_API_KEY to .env.local, then re-run.\n');
  }

  console.log('==> Seeding findings from official JSON sources…');
  await run('npx', ['tsx', 'scripts/seed-custody-discovery.ts'], {
    inherit: true,
    env: {
      ...process.env,
      KV_REST_API_URL: merged.KV_REST_API_URL || merged.UPSTASH_REDIS_REST_URL,
      KV_REST_API_TOKEN: merged.KV_REST_API_TOKEN || merged.UPSTASH_REDIS_REST_TOKEN,
    },
  });

  console.log(`==> Running local discovery batch (limit=${LIMIT})…`);
  await run('npx', ['tsx', 'scripts/run-custody-discovery.ts', `--limit=${LIMIT}`], {
    inherit: true,
    env: {
      ...process.env,
      KV_REST_API_URL: merged.KV_REST_API_URL || merged.UPSTASH_REDIS_REST_URL,
      KV_REST_API_TOKEN: merged.KV_REST_API_TOKEN || merged.UPSTASH_REDIS_REST_TOKEN,
      OPENAI_API_KEY: merged.OPENAI_API_KEY || '',
      SERPER_API_KEY: merged.SERPER_API_KEY || '',
    },
  });

  if (!SKIP_DEPLOY) {
    console.log('==> Deploying to Vercel production…');
    await run('npx', ['--yes', 'vercel', 'deploy', '--prod', '--yes'], { inherit: true });
  }

  console.log('==> Triggering production cron…');
  const res = await fetch(`${SITE}/api/cron/custody-number-discovery?limit=${LIMIT}`, {
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      'x-cron-secret': cronSecret,
    },
  });
  const body = await res.text();
  console.log(`  Cron status ${res.status}: ${body.slice(0, 500)}`);

  console.log('\nDone.');
  console.log(`  Admin review: ${SITE}/admin/custody-number-review`);
  console.log('  Sign in as admin, then approve findings with source evidence before they publish.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
