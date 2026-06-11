import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  const firm = process.argv[2] ?? 'Kingsley Napley LLP';
  const { ensureDsccRegisterCache } = await import('../lib/dscc-register-lookup');
  const { readLaaCrimeJson } = await import('../lib/legal-directory/laa-fetch');
  const { buildCrimeRegistry, isOnCrimeRegistry } = await import('../lib/firm-outreach/qualification');
  const { normalizeFirmName } = await import('../lib/firm-outreach/normalize');

  const laa = readLaaCrimeJson();
  const dscc = await ensureDsccRegisterCache();
  const reg = buildCrimeRegistry(laa, dscc?.entries ?? []);
  const norm = normalizeFirmName(firm);

  const laaHits = laa.filter((r) => normalizeFirmName(r.firmName).includes(norm) || norm.includes(normalizeFirmName(r.firmName)));
  const dsccHits = (dscc?.entries ?? []).filter((e) => normalizeFirmName(e.firm).includes('napley') || normalizeFirmName(e.firm).includes(norm));

  console.log({ firm, normalized: norm, onRegistry: isOnCrimeRegistry(firm, reg), laaHits: laaHits.slice(0, 5), dsccHits: dsccHits.slice(0, 5), dsccTotal: dscc?.count });
}

main();
