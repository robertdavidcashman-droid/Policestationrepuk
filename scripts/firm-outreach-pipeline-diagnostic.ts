/**
 * Where qualified LAA+email prospects sit vs ready_to_send.
 * npx tsx scripts/firm-outreach-pipeline-diagnostic.ts
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  const { listAllProspectIds, getProspect } = await import('../lib/firm-outreach/storage');
  const { qualifyProspectForOutreach, buildCrimeRegistry } = await import(
    '../lib/firm-outreach/qualification'
  );
  const { readLaaCrimeJson } = await import('../lib/legal-directory/laa-fetch');
  const { ensureDsccRegisterCache } = await import('../lib/dscc-register-lookup');

  const laa = readLaaCrimeJson();
  const dscc = await ensureDsccRegisterCache();
  const registry = buildCrimeRegistry(laa, dscc?.entries ?? []);

  const ids = await listAllProspectIds();

  type Bucket = {
    status: string;
    qualified: boolean;
    reason: string;
    excludedReason?: string;
    enrichAttempts: number;
    hasWebsite: boolean;
    emailConfidence?: string;
  };

  const laaWithEmail: Bucket[] = [];
  const qualifiedNotReady: Bucket[] = [];
  const discoveredNoEmailLaa = { total: 0, enrich0: 0, enrich1: 0, enrich2plus: 0 };

  for (const id of ids) {
    const p = await getProspect(id);
    if (!p) continue;

    const isLaa = p.sources.includes('laa');
    if (isLaa && !p.email) {
      discoveredNoEmailLaa.total++;
      if (p.enrichAttempts === 0) discoveredNoEmailLaa.enrich0++;
      else if (p.enrichAttempts === 1) discoveredNoEmailLaa.enrich1++;
      else discoveredNoEmailLaa.enrich2plus++;
    }

    if (!isLaa || !p.email) continue;

    const q = qualifyProspectForOutreach(p, registry);
    const row: Bucket = {
      status: p.status,
      qualified: q.qualified,
      reason: q.reason,
      excludedReason: p.excludedReason,
      enrichAttempts: p.enrichAttempts,
      hasWebsite: Boolean(p.websiteUrl?.trim()),
      emailConfidence: p.emailConfidence,
    };
    laaWithEmail.push(row);

    if (q.qualified && p.status !== 'ready_to_send') {
      qualifiedNotReady.push(row);
    }
  }

  function countBy<T extends string>(rows: Bucket[], key: (r: Bucket) => T): Record<string, number> {
    const out: Record<string, number> = {};
    for (const r of rows) {
      const k = key(r);
      out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  }

  const qualifiedWithEmail = laaWithEmail.filter((r) => r.qualified);

  console.log(
    JSON.stringify(
      {
        laaWithEmailTotal: laaWithEmail.length,
        laaQualifiedWithEmail: qualifiedWithEmail.length,
        laaWithEmailByStatus: countBy(laaWithEmail, (r) => r.status),
        laaQualifiedWithEmailByStatus: countBy(qualifiedWithEmail, (r) => r.status),
        qualifiedNotReadyCount: qualifiedNotReady.length,
        qualifiedNotReadyByStatus: countBy(qualifiedNotReady, (r) => r.status),
        qualifiedNotReadyByExcludedReason: countBy(
          qualifiedNotReady.filter((r) => r.excludedReason),
          (r) => r.excludedReason ?? 'none',
        ),
        laaWithEmailByConfidence: countBy(
          laaWithEmail,
          (r) => r.emailConfidence ?? 'unknown',
        ),
        discoveredNoEmailLaa,
        enrichThroughputNote: {
          cronBatchDefault: 25,
          cronRunsPerDay: '~3 (03:00 maintain + 06:00 + 08:00 enrich)',
          maxEnrichPerDayApprox: 75,
          laaDiscoveredNoEmail: discoveredNoEmailLaa.total,
          daysToClearAt75PerDay: Math.ceil(discoveredNoEmailLaa.total / 75),
        },
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
