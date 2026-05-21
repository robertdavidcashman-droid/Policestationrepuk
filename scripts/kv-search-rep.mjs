#!/usr/bin/env node
/** One-off KV search — usage: node scripts/kv-search-rep.mjs "george graves" */
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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v.trim();
  }
  return out;
}

const env = { ...readEnvLocal(), ...process.env };
const KV_URL = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
const query = (process.argv.slice(2).join(' ') || '').trim().toLowerCase();

if (!KV_URL || !KV_TOKEN) {
  console.error('[fatal] Missing KV credentials.');
  process.exit(2);
}
if (!query) {
  console.error('Usage: node scripts/kv-search-rep.mjs <search text>');
  process.exit(2);
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
    if (!res.ok) throw new Error(`scan failed: ${res.status} ${JSON.stringify(json)}`);
    keys.push(...(json.result?.[1] || []));
    cursor = json.result?.[0] ?? 0;
    if (cursor === 0) break;
  }
  return keys;
}

async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const json = await res.json();
  if (json.result == null) return null;
  let value = json.result;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      /* keep string */
    }
  }
  return value;
}

function matchesQuery(val) {
  const text = JSON.stringify(val ?? '').toLowerCase();
  const parts = query.split(/\s+/).filter(Boolean);
  return parts.every((p) => text.includes(p));
}

const keyPatterns = ['newrep:*', 'profile:*', 'featured:*'];
const allKeys = new Set();
for (const pattern of keyPatterns) {
  for (const k of await kvScan(pattern)) allKeys.add(k);
}

const hits = [];
for (const key of allKeys) {
  const val = await kvGet(key);
  if (matchesQuery(val) || matchesQuery(key)) hits.push({ key, value: val });
}

const hidden = await kvGet('directory:hidden_listing_emails');
if (hidden && matchesQuery(hidden)) {
  hits.push({ key: 'directory:hidden_listing_emails', value: hidden });
}

console.log(JSON.stringify({ query, matchCount: hits.length, hits }, null, 2));
