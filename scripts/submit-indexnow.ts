#!/usr/bin/env npx tsx
/**
 * Submit sitemap URLs to IndexNow (Bing, Yandex, Naver, Seznam, etc.).
 *
 * Usage:
 *   npm run indexnow
 *   npm run indexnow -- --changed-only
 */
import { execSync } from 'node:child_process';
import { submitSitemapToIndexNow } from '../lib/indexnow-pipeline';

const SITE_URL = (process.env.SITE_URL || 'https://policestationrepuk.org').replace(/\/$/, '');
const WAIT_MS = Number(process.env.INDEXNOW_WAIT_MS || 45_000);
const changedOnly = process.argv.includes('--changed-only');

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function urlsFromGitDiff(before: string | undefined, after: string | undefined): string[] {
  if (!before || !after || before === '0000000000000000000000000000000000000000') return [];
  let files: string[];
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
    let m: RegExpMatchArray | null;
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
    } else if (
      file.startsWith('lib/blog/') ||
      file.startsWith('data/reps.json') ||
      file.startsWith('data/stations.json')
    ) {
      urls.add(`${SITE_URL}/directory`);
      urls.add(`${SITE_URL}/Blog`);
    } else if (file.startsWith('data/') || file.startsWith('lib/') || file.startsWith('components/')) {
      urls.add(SITE_URL);
    }
  }

  return [...urls];
}

async function main() {
  if (WAIT_MS > 0) {
    console.log(`IndexNow: waiting ${WAIT_MS}ms for deploy to propagate…`);
    await sleep(WAIT_MS);
  }

  if (changedOnly) {
    const diffUrls = urlsFromGitDiff(process.env.GITHUB_EVENT_BEFORE, process.env.GITHUB_SHA);
    if (diffUrls.length > 1) {
      const { submitIndexNow, INDEXNOW_KEY_LOCATION } = await import('../lib/indexnow');
      console.log(`IndexNow: submitting ${diffUrls.length} URL(s) from git diff`);
      const result = await submitIndexNow(diffUrls);
      console.log(
        `IndexNow: ok (${result.status}) — ${result.submitted} URL(s) in ${result.batches} batch(es); key ${INDEXNOW_KEY_LOCATION}`,
      );
      return;
    }
    console.log('IndexNow: no mapped git changes — falling back to sitemap');
  }

  const result = await submitSitemapToIndexNow({ source: 'live', siteUrl: SITE_URL });
  console.log(
    `IndexNow: ok (${result.status}) — ${result.submitted} URL(s) from ${result.source} sitemap in ${result.batches} batch(es); key ${result.keyLocation}`,
  );
}

main().catch((err: unknown) => {
  console.error('IndexNow failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
