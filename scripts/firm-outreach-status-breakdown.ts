/**
 * Full prospect status + qualification breakdown against KV.
 * npx tsx scripts/firm-outreach-status-breakdown.ts
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  const { countProspectsByStatus, listAllProspectIds, getProspect } = await import(
    '../lib/firm-outreach/storage'
  );
  const { qualifyProspectForOutreach, buildCrimeRegistry } = await import(
    '../lib/firm-outreach/qualification'
  );
  const { readLaaCrimeJson } = await import('../lib/legal-directory/laa-fetch');
  const { ensureDsccRegisterCache } = await import('../lib/dscc-register-lookup');
  const { countyAllowlist } = await import('../lib/firm-outreach/constants');

  const counts = await countProspectsByStatus();
  console.log('STATUS_COUNTS', JSON.stringify(counts, null, 2));
  console.log('TOTAL', Object.values(counts).reduce((a, b) => a + b, 0));
  console.log('COUNTY_ALLOWLIST', countyAllowlist());

  const laa = readLaaCrimeJson();
  const dscc = await ensureDsccRegisterCache();
  const registry = buildCrimeRegistry(laa, dscc?.entries ?? []);

  const ids = await listAllProspectIds();
  const stats = {
    discoveredWithEmail: 0,
    discoveredNoEmail: 0,
    discoveredQualifiedWouldBeReady: 0,
    discoveredWithEmailNotQualified: 0,
    bySource: {} as Record<string, number>,
    discoveredWithEmailBySource: {} as Record<string, number>,
    noEmailStatus: 0,
    enriching: 0,
    enrichAttempts0: 0,
    enrichAttempts1: 0,
    enrichAttempts2Plus: 0,
    laaProspects: 0,
    laaDiscovered: 0,
    laaWithEmail: 0,
    laaReadyOrWouldBe: 0,
    dsccFirmProspects: 0,
    unqualifiedReasons: {} as Record<string, number>,
    readySources: {} as Record<string, number>,
  };

  for (const id of ids) {
    const p = await getProspect(id);
    if (!p) continue;
    for (const s of p.sources) stats.bySource[s] = (stats.bySource[s] || 0) + 1;

    if (p.status === 'enriching') stats.enriching++;
    if (p.enrichAttempts === 0) stats.enrichAttempts0++;
    else if (p.enrichAttempts === 1) stats.enrichAttempts1++;
    else if (p.enrichAttempts >= 2) stats.enrichAttempts2Plus++;

    if (p.sources.includes('laa')) {
      stats.laaProspects++;
      if (p.status === 'discovered') stats.laaDiscovered++;
      if (p.email) stats.laaWithEmail++;
      const q = qualifyProspectForOutreach(p, registry);
      if (q.qualified && p.email) stats.laaReadyOrWouldBe++;
    }
    if (p.sources.includes('dscc') && p.prospectType === 'firm') stats.dsccFirmProspects++;

    if (p.status === 'ready_to_send') {
      for (const s of p.sources) stats.readySources[s] = (stats.readySources[s] || 0) + 1;
    }

    if (p.status === 'discovered') {
      if (p.email) {
        stats.discoveredWithEmail++;
        for (const s of p.sources)
          stats.discoveredWithEmailBySource[s] = (stats.discoveredWithEmailBySource[s] || 0) + 1;
        const q = qualifyProspectForOutreach(p, registry);
        if (q.qualified) stats.discoveredQualifiedWouldBeReady++;
        else {
          stats.discoveredWithEmailNotQualified++;
          stats.unqualifiedReasons[q.reason] = (stats.unqualifiedReasons[q.reason] || 0) + 1;
        }
      } else stats.discoveredNoEmail++;
    }
    if (p.status === 'no_email') stats.noEmailStatus++;
  }

  console.log('LAA_JSON_ROWS', laa.length);
  console.log('ANALYSIS', JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
