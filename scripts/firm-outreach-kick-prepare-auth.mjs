#!/usr/bin/env node
/**
 * Prepare auth for firm-outreach production kick (GitHub Actions).
 *
 * 1. Load CRON_SECRET / FIRM_OUTREACH_BOOTSTRAP_SECRET via Vercel env API (decrypt=true)
 * 2. If both empty, provision FIRM_OUTREACH_BOOTSTRAP_SECRET on production
 * 3. If FIRM_OUTREACH_REQUIRE_APPROVAL is true, set it to false
 * 4. Redeploy production when env changed, wait until READY
 * 5. Write non-empty secrets to GITHUB_ENV (lengths only in logs)
 *
 * Env: VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_ORG_ID (optional team)
 */
import { appendFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const token = process.env.VERCEL_TOKEN?.trim();
const projectId = process.env.VERCEL_PROJECT_ID?.trim();
const teamId = process.env.VERCEL_ORG_ID?.trim();
const vercelEnabled = Boolean(token && projectId);

function apiUrl(path, query = {}) {
  const u = new URL(`https://api.vercel.com${path}`);
  if (teamId) u.searchParams.set('teamId', teamId);
  for (const [k, v] of Object.entries(query)) {
    if (v != null) u.searchParams.set(k, String(v));
  }
  return u.toString();
}

async function vercelJson(path, opts = {}) {
  if (!token) {
    throw new Error('VERCEL_TOKEN is required for Vercel API requests');
  }
  const res = await fetch(apiUrl(path, opts.query), {
    method: opts.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = typeof data?.error?.message === 'string' ? data.error.message : text.slice(0, 500);
    throw new Error(`Vercel API ${opts.method || 'GET'} ${path} → HTTP ${res.status}: ${msg}`);
  }
  return data;
}

function pickEnvValue(envs, key) {
  const matches = (envs || []).filter(
    (e) => e.key === key && (!e.target || e.target.includes('production') || e.target.length === 0),
  );
  // Prefer production-targeted entries with a non-empty value.
  const ranked = matches.sort((a, b) => {
    const aProd = a.target?.includes('production') ? 0 : 1;
    const bProd = b.target?.includes('production') ? 0 : 1;
    if (aProd !== bProd) return aProd - bProd;
    return String(b.value || '').length - String(a.value || '').length;
  });
  const hit = ranked[0];
  const value = hit?.value?.trim?.() ? hit.value.trim() : '';
  return { value, id: hit?.id || null, entries: matches };
}

function writeGithubEnv(pairs) {
  const githubEnv = process.env.GITHUB_ENV;
  if (!githubEnv) return;
  let block = '';
  for (const [key, value] of Object.entries(pairs)) {
    if (!value) continue;
    // Delimiter form avoids multiline/special-char issues.
    const delim = `EOF_${key}_${randomBytes(4).toString('hex')}`;
    block += `${key}<<${delim}\n${value}\n${delim}\n`;
  }
  if (block) appendFileSync(githubEnv, block);
}

async function upsertProductionEnv(key, value, existingIds) {
  for (const id of existingIds) {
    console.log(`Removing existing ${key} env id ${id}`);
    await vercelJson(`/v9/projects/${projectId}/env/${id}`, { method: 'DELETE' });
  }
  console.log(`Creating production ${key} (${value.length} chars)`);
  await vercelJson(`/v10/projects/${projectId}/env`, {
    method: 'POST',
    body: {
      key,
      value,
      type: 'encrypted',
      target: ['production'],
    },
  });
}

async function getProjectName() {
  const project = await vercelJson(`/v9/projects/${projectId}`);
  return project.name || projectId;
}

async function redeployLatestProduction() {
  const list = await vercelJson('/v6/deployments', {
    query: { projectId, target: 'production', limit: 5 },
  });
  const deployments = list.deployments || [];
  const ready = deployments.find((d) => d.readyState === 'READY') || deployments[0];
  if (!ready?.uid && !ready?.id) {
    throw new Error('No production deployment found to redeploy');
  }
  const id = ready.uid || ready.id;
  const name = await getProjectName();
  console.log(`Redeploying production deployment ${id} (project=${name})`);
  // Correct redeploy path: POST /v13/deployments with deploymentId (+ forceNew).
  const redeploy = await vercelJson('/v13/deployments', {
    method: 'POST',
    query: { forceNew: '1' },
    body: {
      name,
      deploymentId: id,
      target: 'production',
      project: projectId,
    },
  });
  const newId = redeploy.id || redeploy.uid;
  if (!newId) {
    throw new Error('Redeploy response missing deployment id');
  }
  const deadline = Date.now() + 12 * 60_000;
  while (Date.now() < deadline) {
    const dep = await vercelJson(`/v13/deployments/${newId}`);
    const state = dep.readyState || dep.status;
    console.log(`Redeploy state=${state}`);
    if (state === 'READY') return;
    if (state === 'ERROR' || state === 'CANCELED') {
      throw new Error(`Redeploy failed: ${state}`);
    }
    await new Promise((r) => setTimeout(r, 15_000));
  }
  throw new Error('Redeploy wait timed out');
}

async function productionAcceptsBootstrap(secret) {
  const base = (process.env.FIRM_OUTREACH_KICK_BASE_URL || 'https://policestationrepuk.org').replace(
    /\/$/,
    '',
  );
  try {
    const res = await fetch(`${base}/api/cron/firm-outreach-status`, {
      headers: { 'x-firm-outreach-bootstrap-secret': secret },
    });
    return res.status !== 401;
  } catch {
    return false;
  }
}

async function main() {
  // Prefer non-empty values already in the process env (GH secrets / env pull).
  let cron = process.env.CRON_SECRET?.trim() || '';
  let bootstrap = process.env.FIRM_OUTREACH_BOOTSTRAP_SECRET?.trim() || '';
  let needsRedeploy = false;

  if (vercelEnabled) {
    console.log('Fetching Vercel production env (decrypt=true)…');
    const envJson = await vercelJson(`/v9/projects/${projectId}/env`, {
      query: { decrypt: 'true' },
    });
    const envs = envJson.envs || [];

    const cronPick = pickEnvValue(envs, 'CRON_SECRET');
    const bootstrapPick = pickEnvValue(envs, 'FIRM_OUTREACH_BOOTSTRAP_SECRET');
    const approvalPick = pickEnvValue(envs, 'FIRM_OUTREACH_REQUIRE_APPROVAL');

    if (!cron && cronPick.value) cron = cronPick.value;
    if (!bootstrap && bootstrapPick.value) bootstrap = bootstrapPick.value;

    console.log(
      `Decrypt load: cron_len=${cron.length} bootstrap_len=${bootstrap.length} require_approval=${JSON.stringify(approvalPick.value || '')}`,
    );

    if (!cron && !bootstrap) {
      bootstrap = randomBytes(32).toString('hex');
      const ids = bootstrapPick.entries.map((e) => e.id).filter(Boolean);
      await upsertProductionEnv('FIRM_OUTREACH_BOOTSTRAP_SECRET', bootstrap, ids);
      needsRedeploy = true;
      console.log('Provisioned FIRM_OUTREACH_BOOTSTRAP_SECRET on production');
    }

    const approvalRaw = (approvalPick.value || '').toLowerCase();
    if (approvalRaw === 'true' || approvalRaw === '1' || approvalRaw === 'yes') {
      const ids = approvalPick.entries.map((e) => e.id).filter(Boolean);
      await upsertProductionEnv('FIRM_OUTREACH_REQUIRE_APPROVAL', 'false', ids);
      needsRedeploy = true;
      console.log('Ungated FIRM_OUTREACH_REQUIRE_APPROVAL → false');
    }

    // Bootstrap may already exist in Vercel from a prior kick that failed before redeploy.
    if (!needsRedeploy && !cron && bootstrap) {
      const ok = await productionAcceptsBootstrap(bootstrap);
      if (!ok) {
        console.log('Production does not accept bootstrap yet — redeploying to pick up env');
        needsRedeploy = true;
      }
    }

    if (needsRedeploy) {
      await redeployLatestProduction();
    }
  } else {
    console.log('VERCEL_TOKEN / VERCEL_PROJECT_ID not set — skipping Vercel decrypt / provision / ungate');
  }

  process.env.CRON_SECRET = cron;
  process.env.FIRM_OUTREACH_BOOTSTRAP_SECRET = bootstrap;
  writeGithubEnv({
    CRON_SECRET: cron,
    FIRM_OUTREACH_BOOTSTRAP_SECRET: bootstrap,
  });

  console.log(
    `Kick auth ready: cron=${cron ? 'yes' : 'no'} bootstrap=${bootstrap ? 'yes' : 'no'} redeployed=${needsRedeploy}`,
  );

  if (!cron && !bootstrap) {
    console.error('Still no cron/bootstrap auth after prepare');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
