#!/usr/bin/env node
/**
 * Submit sitemap URLs to IndexNow after deploy (Bing, Yandex, Naver, Seznam, etc.).
 *
 * Usage:
 *   node scripts/submit-indexnow.mjs
 *   SITE_URL=https://policestationrepuk.org node scripts/submit-indexnow.mjs --changed-only
 *
 * Env:
 *   SITE_URL              — canonical site (default: https://policestationrepuk.org)
 *   GITHUB_EVENT_BEFORE   — optional; with GITHUB_SHA enables --changed-only in CI
 *   GITHUB_SHA
 *   INDEXNOW_WAIT_MS      — ms to wait for deploy propagation (default 45000)
 */
import { execSync } from 'node:child_process';
import { INDEXNOW_KEY, INDEXNOW_KEY_LOCATION, submitIndexNow } from '../lib/indexnow.ts';

const SITE_URL = (process.env.SITE_URL || 'https://policestationrepuk.org').replace(/\/$/, '');
const WAIT_MS = Number(process.env.INDEXNOW_WAIT_MS || 45_000);
const changedOnly = process.argv.includes('--changed-only');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseSitemapXml(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1].trim());
}

async function fetchSitemapUrls() {
  const res = await fetch(`${SITE_URL}/sitemap.xml`, {
    headers: { 'user-agent': 'PoliceStationRepUK-indexnow/1.0' },
  });
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  const locs = parseSitemapXml(xml);
  if (/<sitemapindex/i.test(xml)) {
    const nested = [];
    for (const child of locs.slice(0, 20)) {
      const r = await fetch(child, { headers: { 'user-agent': 'PoliceStationRepUK-indexnow/1.0' } });
      if (r.ok) nested.push(...parseSitemapXml(await r.text()));
    }
    return nested.length ? nested : locs;
  }
  return locs;
}

/** Map changed repo paths to public URLs for incremental IndexNow pings. */
function urlsFromGitDiff(before, after) {
  if (!before || !after || before === '0000000000000000000000000000000000000000') return [];
  let files;
  try {
    files = execSync(`git diff --name-only ${before} ${after}`, { encoding: 'utf8' })
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);
  } catch {
    return [];
  }

  const urls = new Set([SITE_URL]);

  for (const file of files) {
    let m;
    if ((m = file.match(/^app\/(.+)\/page\.tsx$/))) {
      const seg = m[1].replace(/\/\[[^\]]+\]/g, '');
      urls.add(seg ? `${SITE_URL}/${seg}` : SITE_URL);
    } else if ((m = file.match(/^app\/Blog\/([^/]+)\/page\.tsx$/))) {
      urls.add(`${SITE_URL}/Blog/${m[1]}`);
    } else if ((m = file.match(/^app\/rep\/([^/]+)\/page\.tsx$/))) {
      urls.add(`${SITE_URL}/rep/${m[1]}`);
    } else if ((m = file.match(/^app\/directory\/([^/]+)\/page\.tsx$/))) {
      urls.add(`${SITE_URL}/directory/${m[1]}`);
    } else if ((m = file.match(/^app\/police-station\/([^/]+)\/page\.tsx$/))) {
      urls.add(`${SITE_URL}/police-station/${m[1]}`);
    } else if ((m = file.match(/^app\/Wiki\/([^/]+)\/page\.tsx$/))) {
      urls.add(`${SITE_URL}/Wiki/${m[1]}`);
    } else if ((m = file.match(/^app\/LegalUpdates\/([^/]+)\/page\.tsx$/))) {
      urls.add(`${SITE_URL}/LegalUpdates/${m[1]}`);
    } else if (file.startsWith('lib/blog/') || file.startsWith('data/reps.json') || file.startsWith('data/stations.json')) {
      urls.add(`${SITE_URL}/directory`);
      urls.add(`${SITE_URL}/Blog`);
    } else if (file.startsWith('data/') || file.startsWith('lib/') || file.startsWith('components/')) {
      urls.add(SITE_URL);
    }
  }

  return [...urls];
}

async function main() {
  console.log(`IndexNow: waiting ${WAIT_MS}ms for deploy to propagate…`);
  await sleep(WAIT_MS);

  let urls;
  if (changedOnly) {
    const diffUrls = urlsFromGitDiff(process.env.GITHUB_EVENT_BEFORE, process.env.GITHUB_SHA);
    if (diffUrls.length > 1) {
      urls = diffUrls;
      console.log(`IndexNow: submitting ${urls.length} URL(s) from git diff`);
    } else {
      console.log('IndexNow: no mapped git changes — falling back to sitemap');
      urls = await fetchSitemapUrls();
    }
  } else {
    urls = await fetchSitemapUrls();
    console.log(`IndexNow: submitting ${urls.length} URL(s) from sitemap`);
  }

  if (urls.length === 0) {
    console.error('IndexNow: no URLs to submit');
    process.exit(1);
  }

  const result = await submitIndexNow(urls);
  console.log(
    `IndexNow: ok (${result.status}) — ${result.submitted} URL(s) in ${result.batches} batch(es); key ${INDEXNOW_KEY_LOCATION}`,
  );
}

main().catch((err) => {
  console.error('IndexNow failed:', err.message || err);
  process.exit(1);
});
