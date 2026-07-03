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
  const { isTrustedCorroboratingSource } = await import('../lib/custody-discovery/corroboration');

  const open = (await getAllFindings()).filter(
    (f) =>
      (f.status === 'needs_review' || f.status === 'new') &&
      f.aiReview?.recommendation === 'reject' &&
      !f.conflictReason,
  );

  const kept = open.filter((f) => !shouldAutoRejectAiFinding(f, f.aiReview!).reject);

  const domains = new Map<string, number>();
  const types = new Map<string, number>();
  const classes = new Map<string, number>();
  let trusted = 0;

  for (const f of kept) {
    domains.set(f.sourceDomain, (domains.get(f.sourceDomain) ?? 0) + 1);
    types.set(f.sourceType, (types.get(f.sourceType) ?? 0) + 1);
    classes.set(f.classification, (classes.get(f.classification) ?? 0) + 1);
    if (isTrustedCorroboratingSource(f)) trusted++;
  }

  console.log('Kept manual (no conflict):', kept.length);
  console.log('Trusted source type:', trusted);
  console.log('Top domains:', [...domains.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20));
  console.log('By sourceType:', Object.fromEntries(types));
  console.log('By classification:', Object.fromEntries(classes));
  console.log('\nSample (first 15):');
  for (const f of kept.slice(0, 15)) {
    console.log(
      `  AI ${f.aiReview!.aiConfidence}% · ${f.classification} · ${f.sourceType} · ${f.sourceDomain} · ${f.custodySuiteName} · ${f.possiblePhoneNumber}`,
    );
  }
}

main();
