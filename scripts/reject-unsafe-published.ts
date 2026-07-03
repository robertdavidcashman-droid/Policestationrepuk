#!/usr/bin/env npx tsx
/**
 * Remove published custody numbers that are mobiles/premium-rate from
 * non-official sources: revoke the published record and reject the source
 * finding with an audit note. Official-source unsafe numbers (e.g. a 101
 * from a force FOI PDF) are left in the manual review queue.
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.vercel.pull'), quiet: true });
config({ path: resolve(__dirname, '../.env.vercel.production'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), override: true, quiet: true });

async function main() {
  const { loadAllApprovedNumbers, rejectFinding, revokeApproval, getCustodySuite } = await import(
    '../lib/custody-discovery/storage'
  );
  const { numberSafetyFlags } = await import('../lib/custody-discovery/number-safety');
  const { detectSourceType, isOfficialSourceType } = await import(
    '../lib/custody-discovery/source-type'
  );

  const approved = await loadAllApprovedNumbers();
  const now = new Date().toISOString();
  let removed = 0;

  for (const record of approved.values()) {
    if (!record.publicVisible) continue;
    const flags = numberSafetyFlags(record.normalizedPhoneNumber);
    const unsafe = flags.includes('mobile_number') || flags.includes('premium_rate');
    if (!unsafe) continue;
    const sourceType = detectSourceType(record.sourceUrl);
    if (isOfficialSourceType(sourceType)) {
      console.log(`KEPT FOR REVIEW (official source): ${record.phoneNumber} · ${record.sourceUrl}`);
      continue;
    }

    const suite = await getCustodySuite(record.custodySuiteId);
    const name = suite ? `${suite.custodySuiteName} (${suite.forceName})` : record.custodySuiteId;
    await rejectFinding(
      record.sourceFindingId,
      `[Rejected ${now.slice(0, 10)}] ${flags.join(', ')} from non-official source (${record.sourceUrl}) — removed from directory.`,
    );
    await revokeApproval(record.custodySuiteId);
    removed++;
    console.log(`REMOVED: ${record.phoneNumber} — ${name}`);
    console.log(`         source: ${record.sourceUrl}`);
  }

  console.log(`\nRemoved ${removed} published unsafe numbers.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
