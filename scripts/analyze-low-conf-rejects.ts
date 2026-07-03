#!/usr/bin/env npx tsx
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.vercel.pull'), quiet: true });
config({ path: resolve(__dirname, '../.env.vercel.production'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), override: true, quiet: true });

async function main() {
  const { getAllFindings } = await import('../lib/custody-discovery/storage');
  const { shouldAutoRejectAiFinding } = await import('../lib/custody-discovery/auto-decision');

  const open = (await getAllFindings()).filter(
    (f) =>
      (f.status === 'needs_review' || f.status === 'new') &&
      f.aiReview?.recommendation === 'reject',
  );

  const buckets = { highNoConflict: 0, highConflict: 0, lowRep: 0, lowSafe: 0, lowKeep: 0 };
  for (const f of open) {
    const conf = f.aiReview?.aiConfidence ?? 0;
    if (f.conflictReason) {
      buckets.highConflict++;
      continue;
    }
    const gate = shouldAutoRejectAiFinding(f, f.aiReview!);
    if (gate.reject) {
      if (conf >= 85) buckets.highNoConflict++;
      else if (gate.reason === 'auto_reject_rep_directory') buckets.lowRep++;
      else buckets.lowSafe++;
    } else if (conf >= 85) {
      buckets.highNoConflict++;
    } else {
      buckets.lowKeep++;
    }
  }
  console.log('Open AI reject breakdown:', buckets, 'total', open.length);
}

main();
