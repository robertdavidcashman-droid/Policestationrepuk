#!/usr/bin/env node
// Tears down the synthetic rep created by setup-test-checkout.mjs.
// Removes:
//   - newrep:<email>
//   - featured:<email>
//   - session:<token>  (if SESSION_TOKEN env is set)
//   - smoke:cursor-test:meta
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
const KV_URL = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
const KV_TOKEN = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
const TEST_EMAIL = (process.env.TEST_EMAIL || 'cursor-test+featured@policestationrepuk.org').toLowerCase();
const SESSION_TOKEN = process.env.SESSION_TOKEN;
if (!KV_URL || !KV_TOKEN) { console.error('Missing KV creds: set UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN'); process.exit(2); }

async function kvDel(key) {
  const res = await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!res.ok) console.warn(`!! del ${key} -> ${res.status}`);
  else console.log(`del ${key}`);
}
async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (json.result == null) return null;
  if (typeof json.result === 'string') {
    try { return JSON.parse(json.result); } catch { return json.result; }
  }
  return json.result;
}

await kvDel(`newrep:${TEST_EMAIL}`);
await kvDel(`featured:${TEST_EMAIL}`);
if (SESSION_TOKEN) await kvDel(`session:${SESSION_TOKEN}`);

// Recover meta if SESSION_TOKEN wasn't supplied
const meta = await kvGet('smoke:cursor-test:meta');
if (meta?.sessionKey) await kvDel(meta.sessionKey);
await kvDel('smoke:cursor-test:meta');

// Verify
const left = [];
if (await kvGet(`newrep:${TEST_EMAIL}`)) left.push(`newrep:${TEST_EMAIL}`);
if (await kvGet(`featured:${TEST_EMAIL}`)) left.push(`featured:${TEST_EMAIL}`);
if (left.length) {
  console.error('!! cleanup left behind:', left);
  process.exit(3);
}
console.log('\nPASS — all test KV records removed.');
