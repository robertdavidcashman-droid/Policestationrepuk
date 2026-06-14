#!/usr/bin/env npx tsx
/** Apply bulk reject (or approve) from AI recommendation buckets. */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.vercel.production'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), override: true, quiet: true });

async function main() {
  const rejectAiReject = process.argv.includes('--reject-ai-rejects');
  const rejectAiApprove = process.argv.includes('--reject-ai-approves');
  const rejectAiHold = process.argv.includes('--reject-ai-holds');
  const dryRun = process.argv.includes('--dry-run');

  if (!rejectAiReject && !rejectAiApprove && !rejectAiHold) {
    console.error('Pass --reject-ai-rejects, --reject-ai-approves, and/or --reject-ai-holds');
    process.exit(1);
  }

  const { getAllFindings, rejectFinding } = await import('../lib/custody-discovery/storage');

  const open = (await getAllFindings()).filter(
    (f) => f.status === 'needs_review' || f.status === 'new',
  );

  const targets = open.filter((f) => {
    const rec = f.aiReview?.recommendation;
    if (rejectAiReject && rec === 'reject') return true;
    if (rejectAiApprove && rec === 'approve') return true;
    if (rejectAiHold && rec === 'hold') return true;
    return false;
  });

  console.log('[apply-custody-ai-decisions]', {
    dryRun,
    targets: targets.length,
    rejectAiReject,
    rejectAiApprove,
    rejectAiHold,
  });

  let applied = 0;
  for (const f of targets) {
    const note = `[Bulk ${dryRun ? 'dry-run' : 'apply'}] AI ${f.aiReview!.recommendation}: ${
      f.aiReview!.whyNot || f.aiReview!.whyPublish || 'no reason'
    }`.slice(0, 500);
    if (dryRun) {
      console.log('would reject', f.id, f.custodySuiteName, f.possiblePhoneNumber);
    } else {
      await rejectFinding(f.id, note);
      applied++;
    }
  }

  console.log('[apply-custody-ai-decisions] done', { applied, dryRun });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
