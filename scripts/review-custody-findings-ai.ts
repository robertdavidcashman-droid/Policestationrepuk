#!/usr/bin/env npx tsx
/** AI-review custody discovery findings (new backlog + existing queue). */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env.vercel.production') });
config();

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const apply = process.argv.includes('--apply');
  const force = process.argv.includes('--force');
  const maxArg = process.argv.find((a) => a.startsWith('--max='));
  const max = maxArg ? Number(maxArg.split('=')[1]) : 100;

  const { countAiReviewBacklog, runAiReviewBatch } = await import(
    '../lib/custody-discovery/ai-review-backlog'
  );

  const remaining = await countAiReviewBacklog();
  console.log('[custody-ai-review] backlog awaiting review:', remaining);

  if (dryRun || !apply) {
    console.log('Dry run — pass --apply to review findings');
    process.exit(0);
  }

  let totalReviewed = 0;
  let loops = 0;
  const maxLoops = Math.ceil(max / 50) + 1;

  while (totalReviewed < max && loops < maxLoops) {
    loops++;
    const batch = await runAiReviewBatch({
      limit: Math.min(50, max - totalReviewed),
      force,
    });
    console.log(JSON.stringify(batch, null, 2));
    totalReviewed += batch.reviewed;
    if (batch.reviewed === 0) break;
    if (batch.remainingBacklog === 0) break;
  }

  console.log('[custody-ai-review] done, reviewed:', totalReviewed);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
