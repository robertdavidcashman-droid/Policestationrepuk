#!/usr/bin/env npx tsx
/**
 * Read-only dry run: evaluate every open finding with an AI "approve"
 * recommendation through the hardened canAutoPublish gates and report
 * what would publish vs. why the rest are blocked. Writes nothing.
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.vercel.pull'), quiet: true });
config({ path: resolve(__dirname, '../.env.vercel.production'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), override: true, quiet: true });

async function main() {
  const { getAllFindings, getApprovedNumber, getCustodySuite } = await import(
    '../lib/custody-discovery/storage'
  );
  const { canAutoPublish } = await import('../lib/custody-discovery/auto-decision');

  const findings = await getAllFindings();
  const open = findings.filter(
    (f) =>
      (f.status === 'needs_review' || f.status === 'new') &&
      f.aiReview?.recommendation === 'approve',
  );

  console.log(`Open findings with AI approve: ${open.length}\n`);

  const wouldPublish: string[] = [];
  const blocked = new Map<string, string[]>();

  for (const f of open) {
    const approved = await getApprovedNumber(f.custodySuiteId);
    const suite = await getCustodySuite(f.custodySuiteId);
    const gates = canAutoPublish(f, f.aiReview!, approved?.normalizedPhoneNumber, suite?.forceDomain);
    const label = `${f.custodySuiteName} (${f.forceName}) ${f.possiblePhoneNumber} · score ${f.confidenceScore} · AI ${f.aiReview!.aiConfidence}% · ${f.sourceDomain}`;
    if (gates.ok) {
      wouldPublish.push(label);
    } else {
      const list = blocked.get(gates.reason) ?? [];
      list.push(label);
      blocked.set(gates.reason, list);
    }
  }

  console.log(`WOULD AUTO-PUBLISH (${wouldPublish.length}):`);
  for (const l of wouldPublish) console.log(`  ✓ ${l}`);

  console.log(`\nBLOCKED (${open.length - wouldPublish.length}):`);
  for (const [reason, items] of [...blocked.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  [${reason}] × ${items.length}`);
    for (const l of items.slice(0, 5)) console.log(`      - ${l}`);
    if (items.length > 5) console.log(`      … and ${items.length - 5} more`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
