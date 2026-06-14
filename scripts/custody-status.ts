#!/usr/bin/env npx tsx
/** Custody discovery + AI review status summary. */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.vercel.production'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), override: true, quiet: true });

async function main() {
  const { getAllFindings, loadAllApprovedNumbers, getAllCustodySuites } = await import(
    '../lib/custody-discovery/storage'
  );

  const findings = await getAllFindings();
  const approved = await loadAllApprovedNumbers();
  const suites = await getAllCustodySuites();

  const byStatus = findings.reduce<Record<string, number>>((a, f) => {
    a[f.status] = (a[f.status] || 0) + 1;
    return a;
  }, {});

  const open = findings.filter((f) => f.status === 'needs_review' || f.status === 'new');

  console.log(
    JSON.stringify(
      {
        findings: byStatus,
        approvedPublished: approved.size,
        totalSuites: suites.length,
        suitesStillMissingNumber: suites.filter((s) => !approved.has(s.id)).length,
        openQueue: open.length,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
