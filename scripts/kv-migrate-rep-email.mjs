#!/usr/bin/env node
// Migrates a KV-registered rep from one login email to another:
//   - newrep:<old> -> newrep:<new> (updates row.email; preserves public slug)
//   - profile:<old> -> profile:<new> if present
//   - featured:<old> -> featured:<new> if present (updates meta.email)
//   - directory:hidden_listing_emails: swaps old for new if listed
//
// Slug must stay stable when the email changes (shortId is derived from email).
// The script writes `slug` on the newrep row; lib/data registrationToRep honours row.slug.
//
// Usage:
//   node scripts/kv-migrate-rep-email.mjs <oldEmail> <newEmail>
//   OLD_EMAIL=... NEW_EMAIL=... node scripts/kv-migrate-rep-email.mjs
//
// Credentials: KV_REST_API_URL + KV_REST_API_TOKEN (or .env.local), or UPSTASH_* equivalents.

import fs from 'node:fs';
import path from 'node:path';

const KV_HIDDEN_LISTING_EMAILS = 'directory:hidden_listing_emails';

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

function trimField(s) {
  if (s == null) return '';
  return String(s).trim();
}

/** Mirrors lib/data.ts registrationToRep slug computation for the given name + email. */
function computedSlugFromRegistration(name, email) {
  const n = trimField(name);
  const e = trimField(email).toLowerCase();
  if (!n || !e) return null;
  const baseSlug =
    n
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'rep';
  const shortId = e.replace(/[^a-z0-9]/gi, '').slice(0, 8);
  return `${baseSlug}-${shortId}`;
}

const env = { ...readEnvLocal(), ...process.env };
const KV_URL = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;

const argOld = process.argv[2];
const argNew = process.argv[3];
const OLD_EMAIL = (env.OLD_EMAIL || argOld || '').trim().toLowerCase();
const NEW_EMAIL = (env.NEW_EMAIL || argNew || '').trim().toLowerCase();

if (!KV_URL || !KV_TOKEN) {
  console.error('[fatal] Missing KV credentials (KV_REST_API_URL / KV_REST_API_TOKEN or UPSTASH_*).');
  process.exit(2);
}

if (!OLD_EMAIL || !NEW_EMAIL) {
  console.error('Usage: node scripts/kv-migrate-rep-email.mjs <oldEmail> <newEmail>');
  process.exit(2);
}

if (OLD_EMAIL === NEW_EMAIL) {
  console.error('[fatal] Old and new email are the same.');
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
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      /* leave as string */
    }
  }
  return { ok: true, status: 200, value };
}

async function kvSet(key, value) {
  const url = new URL(`${KV_URL}/set/${encodeURIComponent(key)}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'text/plain' },
    body: typeof value === 'string' ? value : JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`KV set ${key} -> ${res.status} ${await res.text()}`);
}

async function kvDel(key) {
  const res = await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!res.ok) return false;
  const json = await res.json().catch(() => ({}));
  return json.result === 1;
}

console.log(`[kv-migrate-rep-email] ${OLD_EMAIL} -> ${NEW_EMAIL}`);

const newrepKeyOld = `newrep:${OLD_EMAIL}`;
const newrepKeyNew = `newrep:${NEW_EMAIL}`;
const profileKeyOld = `profile:${OLD_EMAIL}`;
const profileKeyNew = `profile:${NEW_EMAIL}`;
const featuredKeyOld = `featured:${OLD_EMAIL}`;
const featuredKeyNew = `featured:${NEW_EMAIL}`;

const existingNew = await kvGet(newrepKeyNew);
if (existingNew.value) {
  console.error(`[fatal] Target already exists: ${newrepKeyNew}. Remove or merge manually first.`);
  process.exit(1);
}

const newrepRow = (await kvGet(newrepKeyOld)).value;
if (!newrepRow || typeof newrepRow !== 'object') {
  console.error(`[fatal] No registration at ${newrepKeyOld}. Nothing to migrate.`);
  process.exit(1);
}

const nameForSlug = newrepRow.name;
const slugPreserve =
  trimField(newrepRow.slug) || computedSlugFromRegistration(nameForSlug, OLD_EMAIL);

const migratedRep = {
  ...newrepRow,
  email: NEW_EMAIL,
  slug: slugPreserve,
};

await kvSet(newrepKeyNew, migratedRep);
console.log(`  SET ${newrepKeyNew} (slug preserved: ${slugPreserve})`);

const profileVal = (await kvGet(profileKeyOld)).value;
if (profileVal && typeof profileVal === 'object') {
  await kvSet(profileKeyNew, profileVal);
  console.log(`  SET ${profileKeyNew} (copied from profile)`);
  await kvDel(profileKeyOld);
  console.log(`  DEL ${profileKeyOld}`);
}

const featuredVal = (await kvGet(featuredKeyOld)).value;
if (featuredVal && typeof featuredVal === 'object') {
  const updatedFeatured = { ...featuredVal, email: NEW_EMAIL };
  await kvSet(featuredKeyNew, updatedFeatured);
  console.log(`  SET ${featuredKeyNew} (featured meta)`);
  await kvDel(featuredKeyOld);
  console.log(`  DEL ${featuredKeyOld}`);
}

await kvDel(newrepKeyOld);
console.log(`  DEL ${newrepKeyOld}`);

const hiddenRes = await kvGet(KV_HIDDEN_LISTING_EMAILS);
const hiddenArr = hiddenRes.value;
if (Array.isArray(hiddenArr)) {
  const lower = hiddenArr.map((e) => String(e).toLowerCase());
  const idx = lower.indexOf(OLD_EMAIL);
  if (idx !== -1) {
    const next = hiddenArr.map((e) => String(e).toLowerCase());
    next[idx] = NEW_EMAIL;
    await kvSet(KV_HIDDEN_LISTING_EMAILS, next);
    console.log(`  Updated ${KV_HIDDEN_LISTING_EMAILS} (replaced hidden email)`);
  }
}

console.log('');
console.log('[kv-migrate-rep-email] Done.');
console.log(`  Profile URL: https://policestationrepuk.org/rep/${slugPreserve}`);
console.log(`  Sign-in email: ${NEW_EMAIL}`);
