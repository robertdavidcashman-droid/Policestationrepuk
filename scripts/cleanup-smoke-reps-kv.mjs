#!/usr/bin/env node
/**
 * Removes smoke / E2E test registrations from KV.
 * Keeps the canonical test rep: test.rep@policestationrepuk.co.uk
 *
 * Usage:
 *   node scripts/cleanup-smoke-reps-kv.mjs
 *   node scripts/cleanup-smoke-reps-kv.mjs --dry-run
 */
import fs from 'node:fs';
import path from 'node:path';

const KEPT = 'test.rep@policestationrepuk.co.uk';
const DRY_RUN = process.argv.includes('--dry-run');

function readEnvLocal() {
  const f = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(f)) return {};
  const out = {};
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    out[m[1]] = v.trim();
  }
  return out;
}

const env = { ...readEnvLocal(), ...process.env };
const KV_URL = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
const KV_TOKEN = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;

if (!KV_URL || !KV_TOKEN) {
  console.error(
    'Missing KV creds: set UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN',
  );
  process.exit(2);
}

const RESERVED_SUFFIXES = [
  '@example.com',
  '@example.org',
  '@example.net',
  '@example.co.uk',
  '@policestationrepuk.test',
];
const SMOKE_LOCAL_PREFIXES = ['smoketest', 'cursor-test', 'audit-test'];

function isSmokeRecord({ email, name, slug, notes }) {
  const e = (email ?? '').toLowerCase().trim();
  if (!e || e === KEPT) return false;
  if (RESERVED_SUFFIXES.some((s) => e.endsWith(s))) return true;
  const local = e.split('@')[0] ?? '';
  if (SMOKE_LOCAL_PREFIXES.some((p) => local === p || local.startsWith(`${p}+`))) return true;

  const n = (name ?? '').trim();
  if (/^playwright test\b/i.test(n)) return true;
  if (/^api test\b/i.test(n)) return true;
  if (/^dup test\b/i.test(n)) return true;
  if (/^smoke test\b/i.test(n)) return true;
  if (/^cursor test rep\b/i.test(n)) return true;
  if (/\(DELETE ME\)/i.test(n)) return true;

  const noteText = (notes ?? '').toLowerCase();
  if (noteText.includes('automated playwright test submission')) return true;
  if (noteText.includes('playwright api test')) return true;
  if (noteText.includes('synthetic rep for production smoke test')) return true;
  if (noteText.includes('synthetic smoke-test rep')) return true;
  if (noteText.includes('safe to delete')) return true;

  const s = (slug ?? '').toLowerCase();
  if (s.startsWith('playwright-test-')) return true;
  if (s.startsWith('api-test-')) return true;
  if (s.startsWith('dup-test-')) return true;
  if (s.startsWith('smoke-test-')) return true;

  return false;
}

async function kvScan(pattern) {
  const keys = [];
  let cursor = 0;
  for (;;) {
    const url = new URL(`${KV_URL}/scan/${cursor}`);
    url.searchParams.set('match', pattern);
    url.searchParams.set('count', '500');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
    const json = await res.json();
    if (!res.ok) throw new Error(`scan ${pattern} -> ${res.status} ${JSON.stringify(json)}`);
    keys.push(...(json.result?.[1] || []));
    const nextCursor = json.result?.[0];
    if (nextCursor == null || nextCursor === 0 || nextCursor === '0') break;
    cursor = nextCursor;
  }
  return keys;
}

async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (json.result == null) return null;
  if (typeof json.result === 'string') {
    try {
      return JSON.parse(json.result);
    } catch {
      return json.result;
    }
  }
  return json.result;
}

async function kvDel(key) {
  if (DRY_RUN) {
    console.log(`[dry-run] del ${key}`);
    return;
  }
  const res = await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!res.ok) console.warn(`!! del ${key} -> ${res.status}`);
  else console.log(`del ${key}`);
}

function emailFromKey(key) {
  const idx = key.indexOf(':');
  return idx === -1 ? key : key.slice(idx + 1);
}

/** True when the email suffix alone is enough to classify as smoke junk. */
function isSmokeEmail(email) {
  return isSmokeRecord({ email, name: '', slug: '', notes: '' });
}

async function main() {
  const patterns = [
    'newrep:*',
    'featured:*',
    'repreview:*',
    'profile:*',
    'verification:*',
    'enquiry:*',
    'enquiry:email:*',
    'smoke:*',
  ];

  const allKeys = new Set();
  for (const pattern of patterns) {
    process.stdout.write(`Scanning ${pattern}… `);
    const found = await kvScan(pattern);
    for (const k of found) allKeys.add(k);
    console.log(`${found.length} key(s)`);
  }

  const toDelete = new Set();
  const smokeEmails = new Set();
  const needsBodyCheck = [];

  for (const key of allKeys) {
    if (key.startsWith('smoke:')) {
      toDelete.add(key);
      continue;
    }

    const suffix = emailFromKey(key).toLowerCase();
    if (suffix === KEPT) continue;

    if (suffix.includes('@')) {
      if (isSmokeEmail(suffix)) {
        smokeEmails.add(suffix);
        toDelete.add(key);
      }
      continue;
    }

    // enquiry:{ulid} etc. — need the stored body to read email/name
    if (key.startsWith('enquiry:') && !key.startsWith('enquiry:email:')) {
      needsBodyCheck.push(key);
    }
  }

  if (needsBodyCheck.length > 0) {
    console.log(`Checking ${needsBodyCheck.length} enquiry record(s) for smoke markers…`);
    for (const key of needsBodyCheck) {
      const val = await kvGet(key);
      const row = val && typeof val === 'object' ? val : {};
      const email = (row.email ?? '').toLowerCase();
      if (!email || email === KEPT) continue;
      const name = row.fullName ?? row.name ?? '';
      const notes = row.shortMessage ?? row.message ?? '';
      if (isSmokeRecord({ email, name, slug: '', notes })) {
        smokeEmails.add(email);
        toDelete.add(key);
      }
    }
  }

  // Delete all KV rows tied to smoke emails
  for (const email of smokeEmails) {
    for (const prefix of ['newrep', 'featured', 'repreview', 'profile', 'verification']) {
      toDelete.add(`${prefix}:${email}`);
    }
    toDelete.add(`enquiry:email:${email}`);
  }

  console.log(`\n${DRY_RUN ? '[dry-run] ' : ''}Removing ${toDelete.size} KV key(s) for ${smokeEmails.size} smoke email(s)…`);
  if (smokeEmails.size > 0) {
    console.log('Smoke emails:', [...smokeEmails].sort().join(', '));
  }
  for (const key of [...toDelete].sort()) {
    await kvDel(key);
  }
  console.log(`\nDone. Kept canonical test rep: ${KEPT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
