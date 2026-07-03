#!/usr/bin/env npx tsx
/** Read-only: list published custody numbers with unsafe ranges (mobile/premium). */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.vercel.pull'), quiet: true });
config({ path: resolve(__dirname, '../.env.vercel.production'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), override: true, quiet: true });

async function main() {
  const { loadAllApprovedNumbers, getCustodySuite } = await import(
    '../lib/custody-discovery/storage'
  );
  const { numberSafetyFlags } = await import('../lib/custody-discovery/number-safety');

  const approved = await loadAllApprovedNumbers();
  const rows = [...approved.values()].filter((a) => a.publicVisible);
  console.log(`Published numbers: ${rows.length}\n`);

  const byNumber = new Map<string, string[]>();
  for (const a of rows) {
    const list = byNumber.get(a.normalizedPhoneNumber) ?? [];
    list.push(a.custodySuiteId);
    byNumber.set(a.normalizedPhoneNumber, list);
  }

  for (const a of rows) {
    const flags = numberSafetyFlags(a.normalizedPhoneNumber);
    const shared = (byNumber.get(a.normalizedPhoneNumber)?.length ?? 1) > 1;
    if (flags.length === 0 && !shared) continue;
    const suite = await getCustodySuite(a.custodySuiteId);
    const name = suite ? `${suite.custodySuiteName} (${suite.forceName})` : a.custodySuiteId;
    const labels = [...flags, ...(shared ? ['SHARED_ACROSS_SUITES'] : [])];
    console.log(`${labels.join(',').padEnd(34)} ${a.phoneNumber.padEnd(16)} ${name}`);
    console.log(`${''.padEnd(34)} approvedBy ${a.approvedBy} · ${a.approvedAt.slice(0, 10)} · src ${a.sourceUrl}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
