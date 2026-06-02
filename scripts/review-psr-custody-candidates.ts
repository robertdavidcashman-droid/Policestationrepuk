/**
 * Review-only PSR fetch for custody suites missing custodyPhone.
 * Outputs safe candidates (labelled custody row with dialable tel:) for manual apply.
 *
 * Run: npx tsx scripts/review-psr-custody-candidates.ts [--force="Kent Police"] [--limit=50]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { isCustodyStation } from '../lib/custody-station';
import { loadCustodySeedFromGenerateData } from '../lib/custody-seed';
import { isDialablePhone } from '../lib/station-verification';
import {
  isTrustworthyPsrCustodyCandidate,
  parseRepDirectoryStationHtml,
  repDirectoryUrlCandidates,
} from '../lib/rep-directory-parse';
import type { PoliceStation } from '../lib/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATIONS_PATH = resolve(ROOT, 'data/stations.json');
const REPORTS_DIR = resolve(ROOT, 'data/reports');

const forceArg = process.argv.find((a) => a.startsWith('--force='));
const FORCE_FILTER = forceArg?.split('=')[1]?.trim();
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0');
const FETCH_DELAY_MS = 900;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchRepDirectory(
  slug: string,
  name: string,
  seedSlug?: string,
  seedName?: string,
): Promise<{ html: string; url: string } | null> {
  const urls = [
    ...repDirectoryUrlCandidates(slug, name),
    ...(seedSlug || seedName ? repDirectoryUrlCandidates(seedSlug ?? slug, seedName ?? name) : []),
  ];
  const seen = new Set<string>();
  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'PoliceStationRepUK-data-enrich/1.0 (+https://policestationrepuk.org)',
        },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const html = await res.text();
        if (/POLICE STATION|Custody:|General:/i.test(html)) {
          return { html, url };
        }
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

type ReviewRow = {
  station: string;
  slug: string;
  forceName: string;
  stationId?: string;
  outcome:
    | 'safe_custody'
    | 'see_below'
    | 'no_psr_page'
    | 'psr_page_no_custody'
    | 'already_has_custody';
  custodyPhone?: string;
  psrUrl?: string;
  mainPhone?: string;
};

async function main(): Promise<void> {
  const stations: PoliceStation[] = JSON.parse(readFileSync(STATIONS_PATH, 'utf-8'));
  const seeds = loadCustodySeedFromGenerateData(ROOT);
  const today = new Date().toISOString().slice(0, 10);

  let targets = stations.filter(
    (s) => isCustodyStation(s) && !isDialablePhone(s.custodyPhone),
  );
  if (FORCE_FILTER) {
    targets = targets.filter((s) => s.forceName === FORCE_FILTER);
  }
  if (LIMIT > 0) targets = targets.slice(0, LIMIT);

  const rows: ReviewRow[] = [];
  let fetchCount = 0;

  for (const station of targets) {
    const seed = seeds.find((e) => e.slug && station.slug.includes(e.slug.replace(/-/g, '')));
    if (fetchCount > 0) await sleep(FETCH_DELAY_MS);
    fetchCount++;

    const fetched = await fetchRepDirectory(
      station.slug,
      station.name,
      seed?.slug,
      seed?.name,
    );

    if (!fetched) {
      rows.push({
        station: station.name,
        slug: station.slug,
        forceName: station.forceName,
        stationId: station.stationId,
        outcome: 'no_psr_page',
      });
      continue;
    }

    const parsed = parseRepDirectoryStationHtml(fetched.html, fetched.url);

    if (isTrustworthyPsrCustodyCandidate(parsed)) {
      rows.push({
        station: station.name,
        slug: station.slug,
        forceName: station.forceName,
        stationId: station.stationId,
        outcome: 'safe_custody',
        custodyPhone: parsed.custodyPhone,
        psrUrl: fetched.url,
        mainPhone: parsed.mainPhone,
      });
      continue;
    }

    if (parsed.custodySeeBelow) {
      rows.push({
        station: station.name,
        slug: station.slug,
        forceName: station.forceName,
        stationId: station.stationId,
        outcome: 'see_below',
        psrUrl: fetched.url,
        mainPhone: parsed.mainPhone,
      });
      continue;
    }

    rows.push({
      station: station.name,
      slug: station.slug,
      forceName: station.forceName,
      stationId: station.stationId,
      outcome: 'psr_page_no_custody',
      psrUrl: fetched.url,
      mainPhone: parsed.mainPhone,
    });
  }

  const safe = rows.filter((r) => r.outcome === 'safe_custody');
  const seeBelow = rows.filter((r) => r.outcome === 'see_below');

  mkdirSync(REPORTS_DIR, { recursive: true });
  const reportPath = resolve(
    REPORTS_DIR,
    `psr-custody-review-${today}${FORCE_FILTER ? '-' + FORCE_FILTER.replace(/\s+/g, '-') : ''}.json`,
  );
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        forceFilter: FORCE_FILTER || null,
        targets: targets.length,
        summary: {
          safe_custody: safe.length,
          see_below: seeBelow.length,
          no_psr_page: rows.filter((r) => r.outcome === 'no_psr_page').length,
          psr_page_no_custody: rows.filter((r) => r.outcome === 'psr_page_no_custody').length,
        },
        safeCandidates: safe,
        seeBelowNeedingManualFootnote: seeBelow,
        allRows: rows,
      },
      null,
      2,
    ) + '\n',
  );

  console.log(`Report: ${reportPath}`);
  console.log(`Targets: ${targets.length}`);
  console.log(`Safe custody (labelled row): ${safe.length}`);
  console.log(`See Below (manual footnote): ${seeBelow.length}`);
  console.log(`No PSR page: ${rows.filter((r) => r.outcome === 'no_psr_page').length}`);
  if (safe.length) {
    console.log('\nSafe candidates:');
    for (const r of safe) {
      console.log(`  ${r.station} (${r.forceName}): ${r.custodyPhone}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
