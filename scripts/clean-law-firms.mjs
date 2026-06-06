#!/usr/bin/env node
// DEPRECATED: legacy Base44 law-firms dataset archived at data/archive/law-firms.json.
// The /Firms page was retired in favour of /legal-services-directory/category/solicitors.
//
// Clean data/archive/law-firms.json down to genuine, verifiable English & Welsh
// criminal defence firms with real, reachable websites.
//
// Filters applied (order matters):
//   1. SRA number must be 4-7 digits and not an obvious fake pattern
//      (sequential 12345, 54321, 67890, runs of identical digits, all-zero
//      tails like 650000, 100000).
//   2. Region must be England or Wales.
//   3. criminalLawPractice must be true.
//   4. Address must look real (no "Not specified", "Not available", N/A...).
//   5. Website must be a parseable absolute URL.
//   6. The website must actually respond on the network.
//   7. Dedupe by SRA number, then by registered domain.
//
// Usage:
//   node scripts/clean-law-firms.mjs              # dry run (default)
//   node scripts/clean-law-firms.mjs --write      # write cleaned JSON
//
// Skipping the network probe (e.g. for offline testing):
//   node scripts/clean-law-firms.mjs --no-probe   # keep all that pass
//                                                   structural filters,
//                                                   but dedupe.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(__dirname, '..', 'data', 'archive', 'law-firms.json');

const args = new Set(process.argv.slice(2));
const WRITE = args.has('--write');
const PROBE = !args.has('--no-probe');

const PLACEHOLDER = /^(not available|not specified|n\/?a|none|unknown|-+|\.+|tbd|tba)$/i;
const PROBE_TIMEOUT_MS = 8000;
const PROBE_CONCURRENCY = 10;

function isPlaceholder(v) {
  if (v == null) return true;
  const s = String(v).trim();
  if (!s) return true;
  return PLACEHOLDER.test(s);
}

function looksFakeSra(raw) {
  const s = String(raw || '').trim();
  if (!/^\d{4,7}$/.test(s)) return true;

  // Runs of leading zeros: 000004, 00001, etc.
  if (/^0{2,}/.test(s)) return true;

  // 4+ consecutive identical digits.
  if (/(\d)\1{3,}/.test(s)) return true;

  // Strictly ascending or descending sequences (any length).
  let asc = true;
  let desc = true;
  for (let i = 1; i < s.length; i++) {
    if (+s[i] !== +s[i - 1] + 1) asc = false;
    if (+s[i] !== +s[i - 1] - 1) desc = false;
  }
  if (asc || desc) return true;

  // Mostly-sequential six-digit IDs like 789012 (789 then 012) or 234567 (clean
  // ascending) — covered above. Also 123456, 654321 — covered.
  if (/^(?:012345|123456|234567|345678|456789|567890|678901|789012|890123|901234|987654|876543|765432|654321|543210|432109|321098|210987|109876|098765)$/.test(s)) {
    return true;
  }

  // Round-number tails: 650000, 100000, 200000, 500000, 800000, 600000…
  if (/^[1-9]0{4,}$/.test(s)) return true;

  // Six-digit with a four-zero tail (650000, 200000) or three-zero tail with a
  // sequential two-digit head (650123 - 650, then 123).
  if (/^\d{2,3}(0{3,}|0{2}\d)$/.test(s)) {
    // 650000 and 650123 fit this; but real numbers like 558433 do not.
    // Make sure we don't false-positive: only flag if last 3 digits are 000
    // OR exactly "123".
    const tail = s.slice(-3);
    if (tail === '000' || tail === '123') return true;
  }

  return false;
}

function shareDomainLabel(a, b) {
  // Two hostnames "share" the firm's identity if any non-generic label is
  // common to both — e.g. firm.co.uk and www.firm.co.uk, firm-law.com and
  // firmlaw.co.uk all share a meaningful token; whereas blm-law.com and
  // images.lemonurban.com share nothing meaningful.
  const generic = new Set([
    'co', 'com', 'uk', 'org', 'net', 'law', 'legal', 'solicitors', 'solicitor',
    'www', 'cloud', 'web', 'site', 'online', 'group', 'llp', 'ltd', 'limited',
  ]);
  const labels = (h) =>
    new Set(
      h
        .split('.')
        .flatMap((part) => part.split(/[-_]/))
        .map((p) => p.toLowerCase())
        .filter((p) => p && !generic.has(p) && p.length >= 3),
    );
  const la = labels(a);
  const lb = labels(b);
  for (const x of la) if (lb.has(x)) return true;
  return false;
}

function normaliseUrl(raw) {
  const s = String(raw || '').trim();
  if (!s || isPlaceholder(s)) return null;
  let url = s;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(parsed.hostname)) return null;
    if (!/\.[a-z]{2,}$/i.test(parsed.hostname)) return null;
    return { href: parsed.toString(), hostname: parsed.hostname.toLowerCase().replace(/^www\./, '') };
  } catch {
    return null;
  }
}

async function probeUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  const headers = { 'user-agent': 'PoliceStationRepUK-firms-validator/1.0' };
  try {
    let res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers,
    });
    if (res.status === 405 || (!res.ok && res.status >= 400)) {
      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers,
      });
    }
    let finalHostname = null;
    try {
      finalHostname = new URL(res.url || url).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      /* ignore */
    }
    return { ok: res.ok, status: res.status, finalUrl: res.url, finalHostname };
  } catch (err) {
    return { ok: false, status: 0, error: err?.code || err?.message || 'fetch failed' };
  } finally {
    clearTimeout(timer);
  }
}

async function probeAll(items) {
  const results = new Map();
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      const it = items[i];
      results.set(it.firm.id, await probeUrl(it.url));
    }
  }
  const workers = Array.from({ length: PROBE_CONCURRENCY }, () => worker());
  await Promise.all(workers);
  return results;
}

function classify(firms) {
  const kept = [];
  const dropped = [];

  for (const firm of firms) {
    const reason = (r) => dropped.push({ firm, reason: r });

    const region = String(firm.region || '').trim().toLowerCase();
    if (region !== 'england' && region !== 'wales') {
      reason('region not England/Wales');
      continue;
    }
    if (firm.criminalLawPractice !== true) {
      reason('not criminal practice');
      continue;
    }
    if (looksFakeSra(firm.sraNumber)) {
      reason(`SRA ${JSON.stringify(firm.sraNumber)} looks fake/placeholder`);
      continue;
    }
    if (isPlaceholder(firm.address) || isPlaceholder(firm.postcode)) {
      reason('address/postcode missing');
      continue;
    }
    const urlInfo = normaliseUrl(firm.website);
    if (!urlInfo) {
      reason(`website missing or unparseable (${JSON.stringify(firm.website)})`);
      continue;
    }
    kept.push({ firm, url: urlInfo.href, hostname: urlInfo.hostname });
  }
  return { kept, dropped };
}

function dedupe(kept) {
  const bySra = new Map();
  for (const it of kept) {
    const sra = String(it.firm.sraNumber).trim();
    if (!bySra.has(sra)) bySra.set(sra, it);
  }
  const byHost = new Map();
  for (const it of bySra.values()) {
    if (!byHost.has(it.hostname)) byHost.set(it.hostname, it);
  }
  return [...byHost.values()];
}

function sanitiseFirm(firm) {
  // Strip any leftover placeholder strings on optional fields.
  const out = { ...firm };
  if (isPlaceholder(out.email)) out.email = '';
  if (isPlaceholder(out.phone)) out.phone = '';
  if (isPlaceholder(out.sizeCategory)) out.sizeCategory = '';
  if (typeof out.sizeCategory === 'string') out.sizeCategory = out.sizeCategory.toLowerCase();
  return out;
}

async function main() {
  const raw = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
  console.log(`Loaded ${raw.length} firms from data/law-firms.json`);

  const { kept, dropped } = classify(raw);
  console.log(`After structural filters: ${kept.length} kept, ${dropped.length} dropped`);

  const deduped = dedupe(kept);
  console.log(`After dedupe (by SRA, then domain): ${deduped.length}`);

  let alive = deduped;
  if (PROBE) {
    console.log(`\nProbing ${deduped.length} websites (timeout ${PROBE_TIMEOUT_MS}ms, concurrency ${PROBE_CONCURRENCY})...`);
    const results = await probeAll(deduped);
    alive = [];
    for (const it of deduped) {
      const r = results.get(it.firm.id);
      if (!r?.ok) {
        console.log(`  DEAD ${r?.status ?? '-'}  ${it.firm.sraNumber}  ${it.firm.name}  ${it.url}  ${r?.error || ''}`);
        continue;
      }
      const finalHost = r.finalHostname || it.hostname;
      const offsite = finalHost !== it.hostname && !shareDomainLabel(finalHost, it.hostname);
      if (offsite) {
        console.log(`  OFFSITE 200  ${it.firm.sraNumber}  ${it.firm.name}  ${it.url} -> ${finalHost} (firm likely merged/closed)`);
        continue;
      }
      alive.push({ ...it, finalHostname: finalHost });
      console.log(`  OK   ${r.status}  ${it.firm.sraNumber}  ${it.firm.name}  ${it.url}` + (finalHost !== it.hostname ? `  -> ${finalHost}` : ''));
    }
    console.log(`\nProbe complete. Alive: ${alive.length} / ${deduped.length}`);

    // Dedupe again by FINAL host (catches legacy/redirected domains).
    const byFinal = new Map();
    for (const it of alive) {
      const key = it.finalHostname || it.hostname;
      if (!byFinal.has(key)) byFinal.set(key, it);
    }
    if (byFinal.size !== alive.length) {
      console.log(`Deduped ${alive.length - byFinal.size} entry/entries with shared final hostnames.`);
    }
    alive = [...byFinal.values()];
  }

  const cleaned = alive
    .map((it) => sanitiseFirm(it.firm))
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log('\n=== FINAL KEPT LIST ===');
  cleaned.forEach((f) => console.log(`  ${f.sraNumber}  ${f.name}  (${f.county})  ${f.website}`));

  if (WRITE) {
    writeFileSync(DATA_FILE, JSON.stringify(cleaned, null, 2) + '\n', 'utf-8');
    console.log(`\nWrote ${cleaned.length} firms to ${DATA_FILE}`);
  } else {
    console.log('\nDry run only. Re-run with --write to persist.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
