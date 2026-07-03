#!/usr/bin/env npx tsx
/**
 * Operator script: force-re-run AI review (and the auto-publish gates) on
 * open findings whose existing AI review recommends approve, so the backlog
 * is re-evaluated through the hardened gates.
 *
 * Usage: npx tsx scripts/run-custody-ai-batch.ts [--limit 25] [--publish]
 *   --publish  enable CUSTODY_AI_AUTO_PUBLISH for this run
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.vercel.pull'), quiet: true });
config({ path: resolve(__dirname, '../.env.vercel.production'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), override: true, quiet: true });

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) || 25 : 25;
  if (args.includes('--publish')) {
    process.env.CUSTODY_AI_AUTO_PUBLISH = 'true';
  }

  const { getAllFindings } = await import('../lib/custody-discovery/storage');
  const { runAiReviewBatch } = await import('../lib/custody-discovery/ai-review-backlog');

  const findings = await getAllFindings();
  const targets = findings.filter(
    (f) =>
      (f.status === 'needs_review' || f.status === 'new') &&
      f.aiReview?.recommendation === 'approve',
  );
  console.log(`Re-reviewing ${Math.min(targets.length, limit)} of ${targets.length} AI-approve findings (auto-publish: ${process.env.CUSTODY_AI_AUTO_PUBLISH === 'true'})`);

  const result = await runAiReviewBatch({
    findingIds: targets.map((f) => f.id),
    force: true,
    limit,
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
