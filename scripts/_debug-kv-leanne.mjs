#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function readEnvLocal() {
  const f = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(f)) return {};
  const out = {};
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)/);
    if (!m) continue;
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    out[m[1]] = v.trim();
  }
  return out;
}

const env = { ...readEnvLocal(), ...process.env };
const KV_URL = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;

const key = 'newrep:llt.law@outlook.com';
const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
  headers: { Authorization: `Bearer ${KV_TOKEN}` },
});
const j = await r.json();
console.log('result type:', typeof j.result);
console.log('raw:', JSON.stringify(j.result).slice(0, 600));

let parsed = j.result;
if (typeof j.result === 'string') {
  try { parsed = JSON.parse(j.result); } catch {}
}

if (parsed && typeof parsed === 'object') {
  console.log('\nParsed object:');
  console.log('  email:', parsed.email);
  console.log('  slug:', parsed.slug);
  console.log('  name:', parsed.name);
  console.log('  registeredAt:', parsed.registeredAt);
}

// Also check hidden list
const r2 = await fetch(`${KV_URL}/get/${encodeURIComponent('directory:hidden_listing_emails')}`, {
  headers: { Authorization: `Bearer ${KV_TOKEN}` },
});
const j2 = await r2.json();
console.log('\nhidden_listing_emails:', JSON.stringify(j2.result));
