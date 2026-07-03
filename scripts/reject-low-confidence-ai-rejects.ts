#!/usr/bin/env npx tsx
/** Apply low-confidence AI reject rules to remaining open reject findings. */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.vercel.pull'), quiet: true });
config({ path: resolve(__dirname, '../.env.vercel.production'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), override: true, quiet: true });

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { getAllFindings } = await import('../lib/custody-discovery/storage');
  const { shouldAutoRejectAiFinding, reapplyAutoDecision } = await import(
    '../lib/custody-discovery/auto-decision'
  );

  const open = (await getAllFindings()).filter(
    (f) =>
      (f.status === 'needs_review' || f.status === 'new') &&
      f.aiReview?.recommendation === 'reject',
  );

  let wouldReject = 0;
  let rejected = 0;
  let kept = 0;
  const byReason = new Map<string, number>();

  for (const finding of open) {
    const gate = shouldAutoRejectAiFinding(finding, finding.aiReview!);
    if (!gate.reject) {
      kept++;
      continue;
    }
    wouldReject++;
    byReason.set(gate.reason, (byReason.get(gate.reason) ?? 0) + 1);
    if (dryRun) {
      console.log(
        `WOULD REJECT [${gate.reason}] ${finding.custodySuiteName} ${finding.possiblePhoneNumber} · AI ${finding.aiReview!.aiConfidence}% · ${finding.sourceDomain}`,
      );
      continue;
    }
    const result = await reapplyAutoDecision(finding);
    if (result.action === 'rejected') rejected++;
    else kept++;
  }

  console.log(JSON.stringify({
    dryRun,
    totalOpenReject: open.length,
    wouldReject,
    rejected,
    kept,
    byReason: Object.fromEntries(byReason),
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
