#!/usr/bin/env node
// One-shot cleanup: removes the duplicate Steven Gilbert registration that
// shares the slug `steven-gilbert-sdglegal` with the canonical file-based
// listing in data/scraped-reps.json.
//
// Deletes from KV:
//   - newrep:sdglegalservices@outlook.com   (public-form registration)
//   - featured:sdglegalservices@outlook.com (any orphan featured flag)
//   - profile:sdglegalservices@outlook.com  (any user profile overrides)
//
// Usage:
//   node scripts/delete-sdglegal-duplicate.mjs
//
// Reads KV credentials from .env.local (KV_REST_API_URL, KV_REST_API_TOKEN)
// or from the environment.
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
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    out[m[1]] = v.trim();
  }
  return out;
}

const env = { ...readEnvLocal(), ...process.env };
const KV_URL = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
const EMAIL = 'sdglegalservices@outlook.com';

if (!KV_URL || !KV_TOKEN) {
  console.error('[fatal] Missing KV credentials. Need KV_REST_API_URL and KV_REST_API_TOKEN in env or .env.local.');
  process.exit(2);
}

async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!res.ok) return { ok: false, status: res.status, value: null };
  const json = await res.json();
  if (json.result == null) return { ok: true, status: 200, value: null };
  let value = json.result;
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch {} }
  return { ok: true, status: 200, value };
}

async function kvDel(key) {
  const res = await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!res.ok) {
    console.warn(`  !! DEL ${key} -> ${res.status}`);
    return false;
  }
  const json = await res.json().catch(() => ({}));
  console.log(`  -- DEL ${key} -> ${json.result === 1 ? 'removed' : 'no key'}`);
  return true;
}

const KEYS = [
  `newrep:${EMAIL}`,
  `featured:${EMAIL}`,
  `profile:${EMAIL}`,
];

console.log(`[delete-sdglegal-duplicate] Inspecting KV records for ${EMAIL}...`);
for (const key of KEYS) {
  const r = await kvGet(key);
  if (r.value) {
    const preview = JSON.stringify(r.value).slice(0, 200);
    console.log(`  ${key} -> ${preview}${preview.length === 200 ? '…' : ''}`);
  } else {
    console.log(`  ${key} -> (none)`);
  }
}

console.log('[delete-sdglegal-duplicate] Deleting...');
for (const key of KEYS) {
  await kvDel(key);
}

console.log('[delete-sdglegal-duplicate] Done.');
