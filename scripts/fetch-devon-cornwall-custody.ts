/**
 * Fetch custody suite numbers from Devon & Cornwall Police (Cloudflare-protected).
 *
 *   npx playwright install chromium
 *   npx tsx scripts/fetch-devon-cornwall-custody.ts [--write] [--apply]
 *
 * --write   Save parsed rows to data/devon-cornwall-custody-numbers.json
 * --apply   Also merge into stations.json + provenance + verification (implies --write)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import {
  DEVON_CORNWALL_CUSTODY_SOURCE_URLS,
  SLUG_BY_CANONICAL,
  custodyRowToStationKeys,
  parseDevonCornwallCustodyHtml,
  type DevonCornwallCustodyFile,
} from '../lib/devon-cornwall-custody';
import type { PoliceStation } from '../lib/types';
import {
  loadPhoneProvenance,
  savePhoneProvenance,
  stationProvenanceKey,
} from '../lib/station-phone-provenance';
import { normalizePhoneDigits } from '../lib/phone-format';
import {
  isDialablePhone,
  loadStationVerification,
  saveStationVerification,
  stationVerificationKey,
} from '../lib/station-verification';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_PATH = resolve(ROOT, 'data/devon-cornwall-custody-numbers.json');
const STATIONS_PATH = resolve(ROOT, 'data/stations.json');
const REPORT_PATH = resolve(ROOT, 'data/reports/devon-cornwall-custody-fetch.json');

const WRITE = process.argv.includes('--write') || process.argv.includes('--apply');
const APPLY = process.argv.includes('--apply');
const TODAY = new Date().toISOString().slice(0, 10);

async function fetchHtml(url: string): Promise<{ url: string; html: string; title: string } | null> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-GB,en;q=0.9',
    });
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);
    const title = await page.title();
    if (/just a moment|cloudflare/i.test(title)) {
      await page.waitForTimeout(8000);
    }
    const html = await page.content();
    if (!res?.ok() && !/custody|police/i.test(html)) return null;
    return { url, html, title: await page.title() };
  } finally {
    await browser.close();
  }
}

function mergeParsedIntoFile(
  existing: DevonCornwallCustodyFile,
  parsed: ReturnType<typeof parseDevonCornwallCustodyHtml>,
  sourceUrl: string,
): DevonCornwallCustodyFile {
  const stations = { ...existing.stations };
  for (const row of parsed) {
    const keys = custodyRowToStationKeys(row.location);
    for (const canonical of keys) {
      const slug = SLUG_BY_CANONICAL[canonical];
      if (slug) {
        stations[slug] = {
          custodyPhone: row.custodyPhone,
          suiteName: row.location,
          sourceUrl,
        };
      }
    }
    stations[`location:${row.location.toLowerCase().replace(/\s+/g, '-')}`] = {
      custodyPhone: row.custodyPhone,
      suiteName: row.location,
      sourceUrl,
    };
  }
  return {
    ...existing,
    source: sourceUrl,
    verifiedAt: TODAY,
    stations,
  };
}

async function applyToStations(file: DevonCornwallCustodyFile): void {
  const stations: PoliceStation[] = JSON.parse(readFileSync(STATIONS_PATH, 'utf-8'));
  const provenance = loadPhoneProvenance();
  const verification = loadStationVerification();
  let updated = 0;
  const conflicts: Array<{
    slug: string;
    name: string;
    existing: string;
    fetched: string;
    sourceUrl: string;
  }> = [];

  for (const station of stations) {
    if (station.forceName !== 'Devon and Cornwall Police') continue;
    const entry =
      file.stations[station.slug] ??
      (station.stationId ? file.stations[station.stationId] : undefined);
    if (!entry?.custodyPhone) continue;

    const src = entry.sourceUrl ?? file.source;
    const fetchedDigits = normalizePhoneDigits(entry.custodyPhone);
    const existingDigits = station.custodyPhone
      ? normalizePhoneDigits(station.custodyPhone)
      : '';

    // Official page shows a different number than we publish — do not overwrite;
    // leave seed JSON for discovery to open a conflict finding on ingest.
    if (isDialablePhone(station.custodyPhone) && existingDigits && existingDigits !== fetchedDigits) {
      conflicts.push({
        slug: station.slug,
        name: station.name,
        existing: station.custodyPhone,
        fetched: entry.custodyPhone,
        sourceUrl: src,
      });
      const key = stationProvenanceKey(station);
      const v = verification[key] ?? { fields: {} };
      v.fields = {
        ...v.fields,
        custodyPhone: {
          ...v.fields?.custodyPhone,
          status: 'needs_review',
          sourceUrl: src,
          dateVerified: TODAY,
          notes: `Official page now lists ${entry.custodyPhone}; published ${station.custodyPhone}. Human review required.`,
        },
      };
      verification[key] = v;
      continue;
    }

    if (isDialablePhone(station.custodyPhone)) continue;

    station.custodyPhone = entry.custodyPhone;
    if (station.isCustodyStation === false && /custody|charles cross|crownhill/i.test(station.name)) {
      station.isCustodyStation = true;
    }

    const key = stationProvenanceKey(station);
    provenance[key] = {
      ...provenance[key],
      custodyPhone: {
        number: entry.custodyPhone,
        source: src,
        verifiedAt: TODAY,
        confidence: 'high',
        field: 'custodyPhone',
      },
    };

    const v = verification[key] ?? { fields: {} };
    v.fields = {
      ...v.fields,
      custodyPhone: {
        status: 'verified',
        sourceUrl: src,
        dateVerified: TODAY,
        notes: 'Custody desk number from Devon & Cornwall Police website.',
      },
    };
    v.sourceUrl = src;
    v.dateVerified = TODAY;
    v.verificationStatus = 'verified';
    verification[key] = v;
    updated++;
  }

  writeFileSync(STATIONS_PATH, JSON.stringify(stations, null, 2) + '\n');
  savePhoneProvenance(provenance);
  saveStationVerification(verification);
  console.log(`Applied custodyPhone to ${updated} Devon & Cornwall stations.`);
  if (conflicts.length) {
    const conflictPath = resolve(ROOT, 'data/reports/devon-cornwall-custody-conflicts.json');
    writeFileSync(
      conflictPath,
      JSON.stringify({ fetchedAt: new Date().toISOString(), conflicts }, null, 2) + '\n',
    );
    console.warn(
      `Detected ${conflicts.length} number change(s) vs published — wrote ${conflictPath} (stations.json not overwritten; seed-json will open findings).`,
    );
  }
}

async function main(): Promise<void> {
  let fetched: { url: string; html: string; title: string } | null = null;
  for (const url of DEVON_CORNWALL_CUSTODY_SOURCE_URLS) {
    console.log('Fetching', url);
    try {
      fetched = await fetchHtml(url);
      if (fetched && parsedHasRows(fetched.html)) break;
    } catch (e) {
      console.warn(url, (e as Error).message);
    }
  }

  if (!fetched) {
    console.error('Could not fetch any Devon & Cornwall custody page. Run: npx playwright install chromium');
    process.exit(1);
  }

  const parsed = parseDevonCornwallCustodyHtml(fetched.html);
  console.log('Page title:', fetched.title);
  console.log('Parsed rows:', parsed.length);
  parsed.forEach((r) => console.log(' -', r.location, '→', r.custodyPhone));

  mkdirSync(resolve(ROOT, 'data/reports'), { recursive: true });
  writeFileSync(
    REPORT_PATH,
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        sourceUrl: fetched.url,
        title: fetched.title,
        parsed,
      },
      null,
      2,
    ) + '\n',
  );
  console.log('Report:', REPORT_PATH);

  let existing: DevonCornwallCustodyFile = {
    source: fetched.url,
    stations: {},
  };
  try {
    existing = JSON.parse(readFileSync(OUT_PATH, 'utf-8')) as DevonCornwallCustodyFile;
  } catch {
    /* new file */
  }

  const merged = mergeParsedIntoFile(existing, parsed, fetched.url);

  if (WRITE) {
    writeFileSync(OUT_PATH, JSON.stringify(merged, null, 2) + '\n');
    console.log('Wrote', OUT_PATH);
  } else {
    console.log('Dry-run. Use --write to save JSON, --apply to update stations.json');
  }

  if (APPLY) {
    await applyToStations(merged);
  }
}

function parsedHasRows(html: string): boolean {
  return parseDevonCornwallCustodyHtml(html).length > 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
