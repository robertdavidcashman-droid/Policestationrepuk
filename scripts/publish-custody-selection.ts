#!/usr/bin/env npx tsx
/** Approve/publish selected custody findings by suite name pattern. */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { revalidatePath } from 'next/cache';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.vercel.production'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), override: true, quiet: true });

const PUBLISH: Array<{ match: RegExp; force?: RegExp; preferNumber?: RegExp }> = [
  { match: /^Southend Police Station$/i, force: /Essex/i },
  { match: /^March Police Station$/i, force: /Cambridgeshire/i },
  { match: /^Chelmsford Police Station$/i, force: /Essex/i },
  { match: /^Basildon Police Station$/i, force: /Essex/i },
  { match: /^Moss Way Police Station$/i, force: /South Yorkshire/i },
  {
    match: /Police Station$/i,
    force: /Lancashire/i,
    preferNumber: /01772 413329|01772413329/,
  },
];

function scoreFinding(
  f: Awaited<ReturnType<typeof import('../lib/custody-discovery/storage')['getAllFindings']>>[number],
  rule: (typeof PUBLISH)[number],
): number {
  let s = 0;
  if (rule.preferNumber && rule.preferNumber.test(f.possiblePhoneNumber.replace(/\s/g, ''))) s += 100;
  if (f.aiReview?.recommendation === 'approve') s += 20;
  if (f.sourceType === 'official_police') s += 15;
  if (f.confidenceScore) s += f.confidenceScore / 10;
  return s;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { getAllFindings, approveFinding } = await import('../lib/custody-discovery/storage');

  const all = await getAllFindings();
  const toPublish: typeof all = [];

  for (const rule of PUBLISH) {
    const candidates = all.filter(
      (f) =>
        rule.match.test(f.custodySuiteName) &&
        (!rule.force || rule.force.test(f.forceName ?? '')),
    );
    if (candidates.length === 0) {
      console.warn('[publish] no finding for rule', rule.match.toString());
      continue;
    }
    const bySuite = new Map<string, typeof candidates>();
    for (const c of candidates) {
      const list = bySuite.get(c.custodySuiteId) ?? [];
      list.push(c);
      bySuite.set(c.custodySuiteId, list);
    }
    for (const [, group] of bySuite) {
      group.sort((a, b) => scoreFinding(b, rule) - scoreFinding(a, rule));
      toPublish.push(group[0]!);
    }
  }

  console.log(
    '[publish] selected',
    toPublish.map((f) => ({
      id: f.id,
      suite: f.custodySuiteName,
      force: f.forceName,
      number: f.possiblePhoneNumber,
      status: f.status,
    })),
  );

  if (dryRun) return;

  for (const f of toPublish) {
    const notes = `[Manual publish] Approved per admin selection. AI: ${f.aiReview?.recommendation ?? 'n/a'}. ${f.aiReview?.whyPublish ?? ''}`.slice(
      0,
      500,
    );
    const result = await approveFinding(f.id, 'admin-manual', { notes, markVerified: false });
    if (!result) {
      console.error('[publish] failed', f.id, f.custodySuiteName);
      continue;
    }
    console.log('[publish] ok', f.custodySuiteName, '→', f.possiblePhoneNumber);
    try {
      revalidatePath('/StationsDirectory');
      revalidatePath('/admin/custody-number-review');
      if (result.approved.stationSlug) {
        revalidatePath(`/police-station/${result.approved.stationSlug}`);
      }
    } catch {
      /* script context — revalidate may no-op outside Next */
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
