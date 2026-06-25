#!/usr/bin/env node
/**
 * One-shot four-site Buffer automation (from policestationrepuk.org):
 *
 *  1. Sync Buffer env → psrtrain + custodynote .env.local
 *  2. Push Buffer env → Vercel (REPUK + psrtrain + custodynote production)
 *  3. Set REPUK BUFFER_CONTENT_FEEDS to local-only (no double-posting)
 *  4. Add daily Buffer cron routes to psrtrain + custodynote vercel.json
 *  5. Optional: --test-post (dry-run against production APIs)
 *  6. Optional: --deploy (production deploy on sibling sites)
 *
 * Prerequisites: `npx vercel login`, BUFFER_API_KEY in this repo's .env.local
 *
 * Usage:
 *   node scripts/setup-buffer-cross-site.mjs --dry-run
 *   node scripts/setup-buffer-cross-site.mjs
 *   node scripts/setup-buffer-cross-site.mjs --test-post
 *   node scripts/setup-buffer-cross-site.mjs --deploy --test-post
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REPUK_ROOT,
  SIBLING_LOCAL_TARGETS,
  VERCEL_BUFFER_PROJECTS,
} from './lib/buffer-cross-site-config.mjs';

const DRY = process.argv.includes('--dry-run');
const SKIP_LOCAL = process.argv.includes('--skip-local');
const SKIP_VERCEL = process.argv.includes('--skip-vercel');
const SKIP_CRONS = process.argv.includes('--skip-crons');
const DEPLOY = process.argv.includes('--deploy');
const TEST_POST = process.argv.includes('--test-post');
const LIVE_POST = process.argv.includes('--live-post');

const ENVS = ['production'];

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd ?? REPUK_ROOT,
      stdio: opts.input != null ? ['pipe', opts.inherit ? 'inherit' : 'pipe', 'inherit'] : opts.inherit ? 'inherit' : ['pipe', 'pipe', 'inherit'],
      shell: process.platform === 'win32',
      env: { ...process.env, ...opts.env },
    });
    let out = '';
    if (!opts.inherit && opts.input == null) {
      child.stdout?.on('data', (d) => { out += d; });
    }
    if (opts.input != null) {
      child.stdin.write(opts.input);
      child.stdin.end();
    }
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`${cmd} ${args.join(' ')} failed (exit ${code})`));
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
    out[m[1]] = v.trim();
  }
  return out;
}

function loadSecrets() {
  const local = parseEnvFile(path.join(REPUK_ROOT, '.env.local'));
  const vercel = parseEnvFile(path.join(REPUK_ROOT, '.env.vercel.production'));
  return {
    BUFFER_API_KEY: local.BUFFER_API_KEY || vercel.BUFFER_API_KEY || '',
    CRON_SECRET: local.CRON_SECRET || vercel.CRON_SECRET || '',
  };
}

async function syncLocalEnv() {
  console.log('\n==> Step 1: sync sibling .env.local');
  if (DRY) {
    console.log('[dry-run] would run sync-buffer-env-to-sibling-sites.mjs');
    return;
  }
  await run('node', ['scripts/sync-buffer-env-to-sibling-sites.mjs'], { inherit: true });
}

async function ensureVercelLinked(project) {
  const projectJson = path.join(project.cwd, '.vercel', 'project.json');
  if (fs.existsSync(projectJson)) {
    try {
      const linked = JSON.parse(fs.readFileSync(projectJson, 'utf8'));
      if (linked.projectName === project.project || linked.projectId) return;
    } catch {
      /* relink */
    }
  }
  console.log(`  linking ${project.project} → ${project.cwd}`);
  if (DRY) return;
  await run(
    'npx',
    ['--yes', 'vercel', 'link', '--project', project.project, '--yes'],
    { cwd: project.cwd, inherit: true },
  );
}

async function vercelEnvRm(cwd, name, env) {
  if (DRY) return;
  try {
    await run('npx', ['--yes', 'vercel', 'env', 'rm', name, env, '--yes'], { cwd, inherit: true });
  } catch {
    /* may not exist */
  }
}

async function vercelEnvAdd(cwd, name, value, env) {
  const label = `[${path.basename(cwd)}] ${name} → ${env} (${value.length} chars)`;
  if (DRY) {
    console.log(`  [dry-run] ${label}`);
    return;
  }
  await vercelEnvRm(cwd, name, env);
  const sensitive = name.includes('API_KEY') || name.includes('SECRET');
  const args = ['--yes', 'vercel', 'env', 'add', name, env, '--yes'];
  if (sensitive) args.push('--sensitive');
  await run('npx', args, { cwd, inherit: true, input: value });
  console.log(`  ${label}`);
}

async function syncVercelProject(project, secrets) {
  console.log(`\n  ${project.site} (${project.project})`);
  await ensureVercelLinked(project);

  const vars = { ...project.env };
  for (const key of project.secretKeys) {
    if (secrets[key]) vars[key] = secrets[key];
  }

  for (const [name, value] of Object.entries(vars)) {
    if (!value) {
      console.warn(`  skip ${name}: empty`);
      continue;
    }
    for (const env of ENVS) {
      await vercelEnvAdd(project.cwd, name, value, env);
    }
  }
}

async function syncVercelEnv(secrets) {
  console.log('\n==> Step 2: push Buffer env to Vercel (production)');
  if (!secrets.BUFFER_API_KEY) {
    throw new Error('BUFFER_API_KEY missing — add to Policestationrepuk/.env.local');
  }
  for (const project of VERCEL_BUFFER_PROJECTS) {
    await syncVercelProject(project, secrets);
  }
}

function ensureCronInVercelJson(cwd, cronEntry) {
  const vercelPath = path.join(cwd, 'vercel.json');
  if (!fs.existsSync(vercelPath)) {
    console.warn(`  skip cron: no vercel.json in ${cwd}`);
    return false;
  }
  const config = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  config.crons = config.crons ?? [];
  const exists = config.crons.some((c) => c.path === cronEntry.path);
  if (exists) {
    console.log(`  cron already present: ${cronEntry.path}`);
    return false;
  }
  config.crons.push(cronEntry);
  if (!DRY) {
    fs.writeFileSync(vercelPath, `${JSON.stringify(config, null, 2)}\n`);
  }
  console.log(`  ${DRY ? '[dry-run] would add' : 'added'} cron ${cronEntry.path} (${cronEntry.schedule})`);
  return true;
}

async function addBufferCrons() {
  console.log('\n==> Step 3: add Buffer cron routes (psrtrain + custodynote vercel.json)');
  let changed = false;
  for (const project of VERCEL_BUFFER_PROJECTS) {
    if (!project.cron) continue;
    if (ensureCronInVercelJson(project.cwd, project.cron)) changed = true;
  }
  if (changed && !DRY) {
    console.log('\n  Commit + deploy psrtrain/custodynote for crons to take effect on Vercel.');
  }
}

async function deployProjects() {
  console.log('\n==> Step 4: production deploy (sibling sites with new Buffer route)');
  for (const project of VERCEL_BUFFER_PROJECTS) {
    if (!project.cron) continue;
    console.log(`  deploying ${project.site}…`);
    if (DRY) {
      console.log(`  [dry-run] vercel --prod --yes --cwd ${project.cwd}`);
      continue;
    }
    await run('npx', ['--yes', 'vercel', 'deploy', '--prod', '--yes'], {
      cwd: project.cwd,
      inherit: true,
    });
  }
}

async function testBufferPosts(secrets) {
  console.log(`\n==> Step 5: ${LIVE_POST ? 'live' : 'dry-run'} test post via production API`);
  if (!secrets.CRON_SECRET) {
    throw new Error('CRON_SECRET missing — needed for /api/buffer/schedule');
  }

  for (const project of VERCEL_BUFFER_PROJECTS) {
    if (!project.testSlug) continue;
    const params = new URLSearchParams({ slug: project.testSlug });
    if (!LIVE_POST) params.set('dryRun', '1');
    else params.set('limit', '1');
    const url = `${project.productionUrl}/api/buffer/schedule?${params}`;
    console.log(`  GET ${url}`);

    if (DRY) continue;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${secrets.CRON_SECRET}` },
    });
    const body = await res.text();
    let json;
    try {
      json = JSON.parse(body);
    } catch {
      json = { raw: body.slice(0, 500) };
    }
    console.log(`  → ${res.status}`, JSON.stringify(json, null, 2));
    if (!res.ok || json.ok === false) {
      throw new Error(`Test post failed for ${project.site} (${res.status})`);
    }
  }
}

async function main() {
  console.log(DRY ? 'Buffer cross-site setup (DRY RUN)' : 'Buffer cross-site setup');
  const secrets = loadSecrets();

  if (!SKIP_VERCEL) await syncVercelEnv(secrets);
  if (!SKIP_LOCAL) await syncLocalEnv();
  if (!SKIP_CRONS) await addBufferCrons();
  if (DEPLOY) await deployProjects();
  if (TEST_POST || LIVE_POST) await testBufferPosts(secrets);

  console.log('\nDone.');
  if (!DRY && !DEPLOY && !SKIP_CRONS) {
    console.log('Next: deploy psrtrain + custodynote, then: npm run buffer:setup-cross-site -- --test-post');
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
