/**
 * Fetch the published Legal Aid Agency "Directory of legal aid providers"
 * spreadsheet and extract crime / prison-law firms into a normalized JSON file.
 *
 * Output: data/laa-crime-providers.json (consumed by seed-laa-crime-providers.ts)
 *
 * Usage:
 *   npx tsx scripts/fetch-laa-crime-providers.ts                 # fetch + parse
 *   npx tsx scripts/fetch-laa-crime-providers.ts --limit=50      # cap rows
 *   npx tsx scripts/fetch-laa-crime-providers.ts --url=<xlsx>    # explicit file
 *   npx tsx scripts/fetch-laa-crime-providers.ts --file=foo.xlsx # local file
 *
 * Polite: single request to gov.uk with an honest User-Agent.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import * as XLSX from 'xlsx';
import {
  isCrimeRelatedLaaCategory,
  LAA_DIRECTORY_URL,
  type LaaProviderRecord,
} from '../lib/legal-directory/laa-seed';
import { dedupeLaaProviderRecords } from '../lib/legal-directory/laa-dedupe';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '../data/laa-crime-providers.json');
const UA = 'PoliceStationRepUK/1.0 (+https://policestationrepuk.org; directory seed)';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

async function resolveXlsxUrl(): Promise<string> {
  const override = arg('url');
  if (override) return override;
  console.log(`[laa-fetch] resolving spreadsheet link from ${LAA_DIRECTORY_URL}`);
  const res = await fetch(LAA_DIRECTORY_URL, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Publication page returned ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  let link: string | undefined;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    if (!link && /\.(xlsx|xls|ods)(\?|$)/i.test(href)) link = href;
  });
  if (!link) throw new Error('No spreadsheet link found on the publication page.');
  return link.startsWith('http') ? link : new URL(link, 'https://www.gov.uk').toString();
}

async function loadWorkbook(): Promise<XLSX.WorkBook> {
  const localFile = arg('file');
  if (localFile) {
    console.log(`[laa-fetch] reading local file ${localFile}`);
    return XLSX.read(readFileSync(resolve(process.cwd(), localFile)), { type: 'buffer' });
  }
  const url = await resolveXlsxUrl();
  console.log(`[laa-fetch] downloading ${url}`);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Spreadsheet download returned ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return XLSX.read(buf, { type: 'buffer' });
}

function yes(val: unknown): boolean {
  return String(val ?? '').trim().toLowerCase() === 'yes';
}

/** Parse the main "Summary" sheet (provider offices + category flags). */
function parseSummarySheet(wb: XLSX.WorkBook): LaaProviderRecord[] {
  const sheet = wb.Sheets['Summary'];
  if (!sheet) return [];

  const raw = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
  let headerIdx = -1;
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (row[1]?.trim() === 'Provider Name') {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) return [];

  const headers = raw[headerIdx].map((h) => String(h).trim());
  const col = (name: string) => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());

  const iName = col('Provider Name');
  const iCity = col('City');
  const iCounty = col('County');
  const iPostcode = col('Postcode');
  const iPhone = col('Telephone Number');
  const iCrime = col('Crime');
  const iPrison = col('Prison Law');

  const records: LaaProviderRecord[] = [];
  for (let r = headerIdx + 1; r < raw.length; r++) {
    const row = raw[r];
    const firmName = String(row[iName] ?? '').trim();
    if (!firmName) continue;

    const crime = iCrime >= 0 && yes(row[iCrime]);
    const prison = iPrison >= 0 && yes(row[iPrison]);
    if (!crime && !prison) continue;

    records.push({
      firmName,
      category: prison && !crime ? 'Prison Law' : crime ? 'Crime' : 'Prison Law',
      town: iCity >= 0 ? String(row[iCity] ?? '').trim() || undefined : undefined,
      county: iCounty >= 0 ? String(row[iCounty] ?? '').trim() || undefined : undefined,
      postcode: iPostcode >= 0 ? String(row[iPostcode] ?? '').trim() || undefined : undefined,
      phone: iPhone >= 0 ? String(row[iPhone] ?? '').trim() || undefined : undefined,
    });
  }
  return records;
}

/** Supplement from "2025 Crime Providers" sheet (firm + postcode only). */
function parseCrimeProvidersSheet(wb: XLSX.WorkBook): LaaProviderRecord[] {
  const sheet = wb.Sheets['2025 Crime Providers'];
  if (!sheet) return [];

  const raw = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
  let headerIdx = -1;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i][0]?.trim() === 'Provider Name') {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) return [];

  const records: LaaProviderRecord[] = [];
  for (let r = headerIdx + 1; r < raw.length; r++) {
    const row = raw[r];
    const firmName = String(row[0] ?? '').trim();
    const postcode = String(row[1] ?? '').trim();
    const prison = yes(row[4]);
    if (!firmName) continue;
    records.push({
      firmName,
      category: prison ? 'Prison Law' : 'Crime',
      postcode: postcode || undefined,
    });
  }
  return records;
}

async function main() {
  const limit = Number(arg('limit') ?? '0') || 0;
  const wb = await loadWorkbook();

  const fromSummary = parseSummarySheet(wb);
  const fromCrimeSheet = parseCrimeProvidersSheet(wb);
  console.log(`[laa-fetch] Summary sheet: ${fromSummary.length} crime/prison offices`);
  console.log(`[laa-fetch] 2025 Crime Providers sheet: ${fromCrimeSheet.length} rows`);

  const summaryFiltered = fromSummary.filter((rec) => isCrimeRelatedLaaCategory(rec.category));
  const crimeFiltered = fromCrimeSheet.filter((rec) => isCrimeRelatedLaaCategory(rec.category));

  const { records, summaryOnly, crimeSupplements, skippedShadows, resolvedConflicts } =
    dedupeLaaProviderRecords(summaryFiltered, crimeFiltered);

  console.log(`[laa-fetch] summary offices after conflict resolution: ${summaryOnly}`);
  console.log(`[laa-fetch] crime-sheet supplements (no Summary match): ${crimeSupplements}`);
  console.log(`[laa-fetch] skipped crime-sheet shadows: ${skippedShadows}`);
  if (resolvedConflicts) {
    console.log(`[laa-fetch] resolved Summary conflicts: ${resolvedConflicts}`);
  }

  const output = limit ? records.slice(0, limit) : records;

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
  console.log(`[laa-fetch] wrote ${output.length} crime/prison-law providers to ${OUT_PATH}`);
  if (output.length) console.log('[laa-fetch] sample:', JSON.stringify(output[0], null, 2));
}

main().catch((err) => {
  console.error('[laa-fetch] failed:', err);
  process.exit(1);
});
