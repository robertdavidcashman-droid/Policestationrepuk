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
  laaProviderKey,
  LAA_DIRECTORY_URL,
  type LaaProviderRecord,
} from '../lib/legal-directory/laa-seed';

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

function pick(row: Record<string, unknown>, keys: string[]): string {
  const lowerKeys = Object.keys(row);
  for (const want of keys) {
    const match = lowerKeys.find((k) => k.toLowerCase().trim().includes(want));
    if (match) {
      const v = row[match];
      if (v != null && String(v).trim()) return String(v).trim();
    }
  }
  return '';
}

function rowToRecord(row: Record<string, unknown>, sheetCategory: string): LaaProviderRecord | null {
  const firmName = pick(row, ['firm', 'provider name', 'organisation', 'office name', 'account name', 'name']);
  if (!firmName) return null;
  const category = pick(row, ['category of law', 'category', 'area of law']) || sheetCategory;
  return {
    firmName,
    category,
    town: pick(row, ['post town', 'town', 'city']) || undefined,
    county: pick(row, ['county', 'area']) || undefined,
    postcode: pick(row, ['postcode', 'post code']) || undefined,
    phone: pick(row, ['telephone', 'phone', 'tel']) || undefined,
    accountNumber: pick(row, ['account number', 'account', 'firm id', 'provider id']) || undefined,
  };
}

async function main() {
  const limit = Number(arg('limit') ?? '0') || 0;
  const wb = await loadWorkbook();

  const records: LaaProviderRecord[] = [];
  const seen = new Set<string>();

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    for (const row of rows) {
      const rec = rowToRecord(row, sheetName);
      if (!rec) continue;
      if (!isCrimeRelatedLaaCategory(rec.category) && !isCrimeRelatedLaaCategory(sheetName)) continue;
      const key = laaProviderKey(rec);
      if (seen.has(key)) continue;
      seen.add(key);
      records.push(rec);
      if (limit && records.length >= limit) break;
    }
    if (limit && records.length >= limit) break;
  }

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(records, null, 2));
  console.log(`[laa-fetch] wrote ${records.length} crime/prison-law providers to ${OUT_PATH}`);
  if (records.length) console.log('[laa-fetch] sample:', JSON.stringify(records[0], null, 2));
}

main().catch((err) => {
  console.error('[laa-fetch] failed:', err);
  process.exit(1);
});
