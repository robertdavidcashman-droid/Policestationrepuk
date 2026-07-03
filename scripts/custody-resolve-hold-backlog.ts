#!/usr/bin/env npx tsx
/**
 * One-shot backlog cleanup: re-run auto-decision gates on open findings
 * that already have an AI review (hold/reject/approve) without re-fetching pages.
 *
 * Usage:
 *   npx tsx scripts/custody-resolve-hold-backlog.ts --dry-run
 *   npx tsx scripts/custody-resolve-hold-backlog.ts
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.vercel.pull'), quiet: true });
config({ path: resolve(__dirname, '../.env.vercel.production'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), override: true, quiet: true });

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  process.env.CUSTODY_AI_AUTO_PUBLISH = process.env.CUSTODY_AI_AUTO_PUBLISH ?? 'true';
  process.env.CUSTODY_AI_AUTO_REJECT = process.env.CUSTODY_AI_AUTO_REJECT ?? 'true';

  const { getAllFindings } = await import('../lib/custody-discovery/storage');
  const { reapplyAutoDecision } = await import('../lib/custody-discovery/auto-decision');
  const { resolveHoldFinding } = await import('../lib/custody-discovery/hold-resolver');

  const findings = await getAllFindings();
  const open = findings.filter(
    (f) =>
      (f.status === 'needs_review' || f.status === 'new') &&
      f.aiReview?.reviewedAt,
  );

  const stats = {
    total: open.length,
    published: 0,
    rejected: 0,
    duplicatesClosed: 0,
    queued: 0,
    dryRun,
    byReason: new Map<string, number>(),
  };

  console.log(`Processing ${open.length} open AI-reviewed findings (dry-run: ${dryRun})\n`);

  for (const finding of open) {
    if (dryRun) {
      const rec = finding.aiReview!.recommendation;
      if (rec === 'hold') {
        const { getFindingsForSuite, getApprovedNumber, loadAllApprovedNumbers, getCustodySuite } =
          await import('../lib/custody-discovery/storage');
        const suiteFindings = await getFindingsForSuite(finding.custodySuiteId);
        const approved = await getApprovedNumber(finding.custodySuiteId);
        const approvedMap = await loadAllApprovedNumbers();
        let forceCount = 0;
        for (const [suiteId, record] of approvedMap) {
          if (!record.publicVisible) continue;
          if (record.normalizedPhoneNumber !== finding.normalizedPhoneNumber) continue;
          const suite = await getCustodySuite(suiteId);
          if (suite?.forceName === finding.forceName) forceCount++;
        }
        const resolution = resolveHoldFinding(finding, finding.aiReview!, {
          suiteFindings,
          approvedNormalized: approved?.normalizedPhoneNumber,
          forceSameNumberPublishedCount: forceCount,
        });
        const key = `hold:${resolution.outcome}`;
        stats.byReason.set(key, (stats.byReason.get(key) ?? 0) + 1);
        if (resolution.outcome !== 'unresolved') {
          console.log(`WOULD ${resolution.outcome.padEnd(24)} ${finding.custodySuiteName} ${finding.possiblePhoneNumber}`);
        }
      } else if (rec === 'reject' && finding.aiReview!.aiConfidence >= 85 && !finding.conflictReason) {
        stats.byReason.set('reject:ai', (stats.byReason.get('reject:ai') ?? 0) + 1);
      }
      continue;
    }

    const result = await reapplyAutoDecision(finding);
    stats.byReason.set(result.reason ?? result.action, (stats.byReason.get(result.reason ?? result.action) ?? 0) + 1);
    if (result.action === 'published') stats.published++;
    else if (result.action === 'rejected') stats.rejected++;
    else if (result.action === 'closed_duplicate') stats.duplicatesClosed++;
    else stats.queued++;
  }

  console.log('\n--- Summary ---');
  console.log(JSON.stringify({ ...stats, byReason: Object.fromEntries(stats.byReason) }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
