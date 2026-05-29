#!/usr/bin/env node
// Sets up a synthetic non-featured rep + mints a session, then calls the
// deployed /api/checkout/featured to obtain a real Lemon Squeezy hosted-
// checkout URL the human can complete in the browser using a test card.
//
// Prints:
//   - the checkout URL
//   - the test email
//   - the test card details
//   - the verification + cleanup commands to run afterwards
//
// Idempotent: if the rep already exists, reuses it.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

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
const BASE = (process.env.BASE || 'https://policestationrepuk.org').replace(/\/$/, '');
const TEST_EMAIL = (process.env.TEST_EMAIL || 'cursor-test+featured@policestationrepuk.org').toLowerCase();

if (!KV_URL || !KV_TOKEN) { console.error('Missing KV creds: set UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN'); process.exit(2); }

async function kvSet(key, value, ttl) {
  const url = new URL(`${KV_URL}/set/${encodeURIComponent(key)}`);
  if (ttl) url.searchParams.set('EX', String(ttl));
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'text/plain' },
    body: typeof value === 'string' ? value : JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`KV set ${key} -> ${res.status} ${await res.text()}`);
}

const NEWREP_KEY = `newrep:${TEST_EMAIL}`;
const sessionToken = crypto.randomUUID();
const SESSION_KEY = `session:${sessionToken}`;
const SESSION_TTL = 60 * 60; // 1 hour

await kvSet(NEWREP_KEY, {
  name: 'Cursor Test Rep (DELETE ME)',
  email: TEST_EMAIL,
  phone: '00000000000',
  accreditation: 'Accredited Representative',
  counties: 'Kent',
  stations: 'Maidstone Police Station',
  availability: '24/7',
  message: 'Synthetic rep for production smoke test. Safe to delete.',
  registeredAt: new Date().toISOString(),
});
await kvSet(SESSION_KEY, JSON.stringify({ email: TEST_EMAIL, created: Date.now() }), SESSION_TTL);

const res = await fetch(`${BASE}/api/checkout/featured`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: `rep_session=${sessionToken}` },
  body: JSON.stringify({ tier: 'monthly' }),
});
const text = await res.text();
if (res.status !== 200) {
  console.error(`/api/checkout/featured -> ${res.status}: ${text}`);
  process.exit(1);
}
const json = JSON.parse(text);
const checkoutUrl = json.url;

console.log('================================================================');
console.log('  PRODUCTION CHECKOUT TEST  (Lemon Squeezy is in TEST MODE)');
console.log('================================================================\n');

console.log('Fake rep created (will be cleaned up at the end):');
console.log(`  email   : ${TEST_EMAIL}`);
console.log(`  newrep  : ${NEWREP_KEY}`);
console.log(`  session : ${sessionToken.slice(0, 8)}…  (expires in ${SESSION_TTL / 60} min)\n`);

console.log('STEP 1 — Open this URL in your browser:\n');
console.log(`  ${checkoutUrl}\n`);

console.log('STEP 2 — Pay with this Stripe test card (no real money):');
console.log('  Card number : 4242 4242 4242 4242');
console.log('  Expiry      : any future date  (e.g. 12 / 30)');
console.log('  CVC         : any 3 digits     (e.g. 123)');
console.log('  Postcode    : any UK postcode  (e.g. SW1A 1AA)\n');

console.log('STEP 3 — After payment succeeds, run:\n');
console.log(`  TEST_EMAIL=${TEST_EMAIL} node scripts/verify-test-checkout.mjs\n`);

console.log('STEP 4 — When done, clean up with:\n');
console.log(`  TEST_EMAIL=${TEST_EMAIL} SESSION_TOKEN=${sessionToken} node scripts/cleanup-test-checkout.mjs\n`);

// Also stash the metadata so the verify/cleanup scripts can find them.
await kvSet(`smoke:cursor-test:meta`, JSON.stringify({
  email: TEST_EMAIL,
  newrepKey: NEWREP_KEY,
  sessionKey: SESSION_KEY,
  sessionToken,
  createdAt: new Date().toISOString(),
}), SESSION_TTL);
