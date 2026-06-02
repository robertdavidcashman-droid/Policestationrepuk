/**
 * Enrich custodyPhone (and main phone) from legacy seed + policestationreps.com.
 * Run: npx tsx scripts/enrich-custody-phones.ts [--write] [--fetch] [--all-missing]
 *      [--force="Kent Police"] [--limit=100]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { isCustodyStation, nameMatchesSeed, slugMatchesSeed } from '../lib/custody-station';
import { loadCustodySeedFromGenerateData } from '../lib/custody-seed';
import {
  isRejectedRepDirectoryPhone,
  isTrustworthyPsrCustodyCandidate,
  parseRepDirectoryStationHtml,
  repDirectoryUrlCandidates,
} from '../lib/rep-directory-parse';
import { formatPhoneUk, isPlausibleUkPhoneField, normalizePhoneDigits } from '../lib/phone-format';
import {
  loadPhoneProvenance,
  savePhoneProvenance,
  stationProvenanceKey,
  type PhoneProvenanceEntry,
  type StationPhoneProvenanceFile,
} from '../lib/station-phone-provenance';
import {
  isDialablePhone,
  loadStationVerification,
  saveStationVerification,
  stationVerificationKey,
} from '../lib/station-verification';
import { classifyPhone } from '../lib/station-search';
import type { PoliceStation } from '../lib/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATIONS_PATH = resolve(ROOT, 'data/stations.json');
const KENT_PSR_PATH = resolve(ROOT, 'data/kent-psr-custody-numbers.json');
const DEVON_CORNWALL_PATH = resolve(ROOT, 'data/devon-cornwall-custody-numbers.json');
const REPORTS_DIR = resolve(ROOT, 'data/reports');

type ForceCustodyFile = {
  stations: Record<string, { custodyPhone: string; psrUrl?: string; sourceUrl?: string }>;
  source?: string;
  verifiedAt?: string;
};

function loadForceCustodyFile(path: string): ForceCustodyFile | null {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as ForceCustodyFile;
  } catch {
    return null;
  }
}

function loadKentPsrCustody(): ForceCustodyFile | null {
  return loadForceCustodyFile(KENT_PSR_PATH);
}

function loadDevonCornwallCustody(): ForceCustodyFile | null {
  return loadForceCustodyFile(DEVON_CORNWALL_PATH);
}

const WRITE = process.argv.includes('--write');
const FETCH = process.argv.includes('--fetch');
const ALL_MISSING = process.argv.includes('--all-missing');
const forceArg = process.argv.find((a) => a.startsWith('--force='));
const FORCE_FILTER = forceArg?.split('=')[1]?.trim();
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0');

const FETCH_DELAY_MS = 900;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isValidCustodyNumber(number: string): boolean {
  if (!isPlausibleUkPhoneField(number)) return false;
  const digits = normalizePhoneDigits(number);
  if (digits === '101') return false;
  const cls = classifyPhone({
    id: 'x',
    slug: 'x',
    name: 'x',
    address: '',
    custodyPhone: number,
  } as PoliceStation);
  return cls === 'station';
}

type EnrichReport = {
  station: string;
  slug: string;
  action: string;
  number?: string;
  source?: string;
  field?: 'custodyPhone' | 'phone';
};

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
      /* try next URL */
    }
  }
  return null;
}

function needsEnrichment(station: PoliceStation): boolean {
  const missingCustody = !isDialablePhone(station.custodyPhone);
  const missingMain = !isDialablePhone(station.phone);
  if (ALL_MISSING) return missingCustody || missingMain;
  if (!isCustodyStation(station)) return false;
  return missingCustody || missingMain;
}

async function main(): Promise<void> {
  const stations: PoliceStation[] = JSON.parse(readFileSync(STATIONS_PATH, 'utf-8'));
  const seeds = loadCustodySeedFromGenerateData(ROOT);
  const kentPsr = loadKentPsrCustody();
  const devonCornwall = loadDevonCornwallCustody();
  const provenance: StationPhoneProvenanceFile = loadPhoneProvenance();
  const verification = loadStationVerification();
  const report: EnrichReport[] = [];
  const today = new Date().toISOString().slice(0, 10);

  let targets = stations.filter(needsEnrichment);
  if (FORCE_FILTER) {
    targets = targets.filter((s) => s.forceName === FORCE_FILTER);
  }
  if (LIMIT > 0) targets = targets.slice(0, LIMIT);

  console.log(`Mode: ${WRITE ? 'WRITE' : 'dry-run'} | fetch: ${FETCH} | all-missing: ${ALL_MISSING}`);
  console.log(`Targets: ${targets.length} of ${stations.length}`);

  let fetchCount = 0;
  let custodyAdded = 0;
  let phoneAdded = 0;
  let psrPagesFound = 0;

  for (const station of targets) {
    const key = stationProvenanceKey(station);
    const existingCustody = (station.custodyPhone || '').trim();
    const existingPhone = (station.phone || '').trim();

    let custodyCandidate: string | undefined;
    let phoneCandidate: string | undefined;
    let source = '';
    let confidence: PhoneProvenanceEntry['confidence'] = 'medium';

    const forceCustody =
      station.forceName === 'Kent Police'
        ? kentPsr
        : station.forceName === 'Devon and Cornwall Police'
          ? devonCornwall
          : null;
    const forceEntry =
      forceCustody?.stations[station.slug] ??
      (station.stationId ? forceCustody?.stations[station.stationId] : undefined);
    if (forceEntry?.custodyPhone && isValidCustodyNumber(forceEntry.custodyPhone)) {
      custodyCandidate = formatPhoneUk(forceEntry.custodyPhone);
      source =
        forceEntry.sourceUrl ?? forceEntry.psrUrl ?? forceCustody?.source ?? 'force custody listing';
      confidence = 'high';
    }

    const seed = seeds.find(
      (e) => slugMatchesSeed(e.slug, station.slug) || nameMatchesSeed(e.name, station.name),
    );
    if (!custodyCandidate && seed?.phone && isValidCustodyNumber(seed.phone)) {
      custodyCandidate = formatPhoneUk(seed.phone);
      source = 'scripts/generate-data.js (legacy custody seed)';
      confidence = 'medium';
    }

    if (FETCH) {
      if (fetchCount > 0) await sleep(FETCH_DELAY_MS);
      fetchCount++;
      const fetched = await fetchRepDirectory(
        station.slug,
        station.name,
        seed?.slug,
        seed?.name,
      );
      if (fetched) {
        psrPagesFound++;
        const parsed = parseRepDirectoryStationHtml(fetched.html, fetched.url);
        if (isTrustworthyPsrCustodyCandidate(parsed) && isValidCustodyNumber(parsed.custodyPhone!)) {
          custodyCandidate = parsed.custodyPhone;
          source = fetched.url;
          confidence = 'high';
        }
        if (
          parsed.mainPhone &&
          isPlausibleUkPhoneField(parsed.mainPhone) &&
          !isRejectedRepDirectoryPhone(parsed.mainPhone, 'main') &&
          !phoneCandidate
        ) {
          const mainDigits = normalizePhoneDigits(parsed.mainPhone);
          if (mainDigits !== '101' && mainDigits !== '999') {
            phoneCandidate = parsed.mainPhone;
          }
        }
      }
    }

    const applyCustody =
      custodyCandidate &&
      isValidCustodyNumber(custodyCandidate) &&
      !isDialablePhone(existingCustody);
    const applyPhone =
      phoneCandidate &&
      isPlausibleUkPhoneField(phoneCandidate) &&
      !isDialablePhone(existingPhone);

    if (!applyCustody && !applyPhone) {
      report.push({
        station: station.name,
        slug: station.slug,
        action: FETCH ? 'no_source' : 'skip_no_fetch',
      });
      continue;
    }

    if (applyCustody) {
      report.push({
        station: station.name,
        slug: station.slug,
        action: existingCustody ? 'update_custody' : 'add_custody',
        number: custodyCandidate,
        source,
        field: 'custodyPhone',
      });
      custodyAdded++;
    }
    if (applyPhone) {
      report.push({
        station: station.name,
        slug: station.slug,
        action: existingPhone ? 'update_phone' : 'add_phone',
        number: phoneCandidate,
        source: source || 'policestationreps.com',
        field: 'phone',
      });
      phoneAdded++;
    }

    if (WRITE) {
      if (applyCustody) {
        station.custodyPhone = custodyCandidate;
        if (!provenance[key]) provenance[key] = {};
        provenance[key].custodyPhone = {
          number: custodyCandidate!,
          source,
          verifiedAt: today,
          confidence,
          field: 'custodyPhone',
        };
        const v = verification[key] ?? { fields: {} };
        v.fields = {
          ...v.fields,
          custodyPhone: {
            status: 'verified',
            sourceUrl: source.startsWith('http') ? source : undefined,
            dateVerified: today,
            notes:
              source.includes('devon-cornwall') || source.includes('dc.police')
                ? 'Devon & Cornwall Police custody information page'
                : 'policestationreps.com custody row (labelled tel: link)',
          },
        };
        v.sourceUrl = source.startsWith('http') ? source : v.sourceUrl;
        v.dateVerified = today;
        v.verificationStatus = 'verified';
        verification[key] = v;
      }
      if (applyPhone) {
        station.phone = phoneCandidate;
        const v = verification[key] ?? { fields: {} };
        v.fields = {
          ...v.fields,
          phone: {
            status: 'verified',
            sourceUrl: source.startsWith('http') ? source : undefined,
            dateVerified: today,
            notes: 'Main/general line from policestationreps.com',
          },
        };
        verification[key] = v;
      }
    }
  }

  mkdirSync(REPORTS_DIR, { recursive: true });
  const reportPath = resolve(
    REPORTS_DIR,
    `custody-enrich-${today}${FORCE_FILTER ? '-' + FORCE_FILTER.replace(/\s+/g, '-') : ''}.json`,
  );
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        write: WRITE,
        fetch: FETCH,
        allMissing: ALL_MISSING,
        forceFilter: FORCE_FILTER || null,
        targets: targets.length,
        psrPagesFound,
        custodyAdded,
        phoneAdded,
        rows: report,
      },
      null,
      2,
    ) + '\n',
  );

  console.log(`Report: ${reportPath}`);
  console.log(`PSR pages found: ${psrPagesFound}`);
  console.log(`Custody adds/updates: ${custodyAdded}`);
  console.log(`Main phone adds/updates: ${phoneAdded}`);
  console.log(`No source: ${report.filter((r) => r.action === 'no_source').length}`);

  if (WRITE) {
    writeFileSync(STATIONS_PATH, JSON.stringify(stations, null, 2) + '\n');
    savePhoneProvenance(provenance);
    saveStationVerification(verification);
    console.log('Wrote stations.json, station-phone-provenance.json, station-verification.json');
  } else {
    console.log('Dry-run. Use --write to apply.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
