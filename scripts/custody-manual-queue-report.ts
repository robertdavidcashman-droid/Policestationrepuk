#!/usr/bin/env npx tsx
/** Show open findings grouped by what action you need to take. */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.vercel.pull'), quiet: true });
config({ path: resolve(__dirname, '../.env.vercel.production'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), override: true, quiet: true });

async function main() {
  const { getAllFindings } = await import('../lib/custody-discovery/storage');
  const { buildOutstandingReviewSummary } = await import(
    '../lib/custody-discovery/outstanding-queue'
  );
  const { numberSafetyFlags } = await import('../lib/custody-discovery/number-safety');
  const { canAutoPublish } = await import('../lib/custody-discovery/auto-decision');
  const { getApprovedNumber, getCustodySuite, getFindingsForSuite } = await import(
    '../lib/custody-discovery/storage'
  );

  const findings = await getAllFindings();
  const summary = buildOutstandingReviewSummary(findings);

  console.log('=== OUTSTANDING MANUAL REVIEW ===\n');
  console.log(`Open queue total:        ${summary.total}`);
  console.log(`Awaiting AI review:      ${summary.awaitingAi}`);
  console.log(`AI recommends approve:   ${summary.aiApprove}`);
  console.log(`AI recommends hold:      ${summary.aiHold}`);
  console.log(`AI recommends reject:    ${summary.aiReject}`);
  console.log(`Conflicts flagged:       ${summary.conflicts}`);
  console.log(`Auto-published (24h):    ${summary.autoPublishedLast24h}\n`);

  const open = findings.filter((f) => f.status === 'needs_review' || f.status === 'new');

  // Recently flagged by unsafe sweep
  const unsafeFlagged = open.filter((f) =>
    f.notes?.includes('unsafe range') || f.notes?.includes('Published number is in an unsafe range'),
  );
  if (unsafeFlagged.length) {
    console.log(`--- REJECT (unsafe range, flagged by sweep) — ${unsafeFlagged.length} ---`);
    for (const f of unsafeFlagged) {
      const flags = f.numberFlags ?? numberSafetyFlags(f.normalizedPhoneNumber);
      console.log(`  REJECT  ${f.possiblePhoneNumber.padEnd(16)} ${f.custodySuiteName} (${f.forceName})`);
      console.log(`          ${flags.join(', ')} · ${f.sourceDomain}`);
    }
    console.log();
  }

  // AI approve but blocked from auto-publish
  const aiApprove = open.filter((f) => f.aiReview?.recommendation === 'approve');
  if (aiApprove.length) {
    console.log(`--- AI SAYS APPROVE (blocked from auto-publish) — ${aiApprove.length} ---`);
    for (const f of aiApprove) {
      const approved = await getApprovedNumber(f.custodySuiteId);
      const suite = await getCustodySuite(f.custodySuiteId);
      const suiteFindings = await getFindingsForSuite(f.custodySuiteId);
      const gates = canAutoPublish(f, f.aiReview!, approved?.normalizedPhoneNumber, suite?.forceDomain, suiteFindings);
      const reason = gates.ok ? 'would_publish' : gates.reason;
      const flags = f.numberFlags ?? numberSafetyFlags(f.normalizedPhoneNumber);
      console.log(
        `  ${reason === 'would_publish' ? 'APPROVE?' : 'REVIEW'}  ${f.possiblePhoneNumber.padEnd(16)} ${f.custodySuiteName}`,
      );
      console.log(
        `          blocked: ${reason} · AI ${f.aiReview!.aiConfidence}% · score ${f.confidenceScore} · ${f.sourceDomain}${flags.length ? ` · ${flags.join(',')}` : ''}`,
      );
    }
    console.log();
  }

  // AI reject — quick reject candidates
  const aiReject = open.filter((f) => f.aiReview?.recommendation === 'reject').slice(0, 15);
  if (aiReject.length) {
    console.log(`--- AI SAYS REJECT (top ${aiReject.length}) ---`);
    for (const f of aiReject) {
      console.log(`  REJECT? ${f.possiblePhoneNumber.padEnd(16)} ${f.custodySuiteName} · ${f.sourceDomain} · AI ${f.aiReview!.aiConfidence}%`);
    }
    const more = open.filter((f) => f.aiReview?.recommendation === 'reject').length - aiReject.length;
    if (more > 0) console.log(`  … and ${more} more AI-reject items`);
    console.log();
  }

  // AI hold — sample
  const aiHold = open.filter((f) => f.aiReview?.recommendation === 'hold').slice(0, 10);
  if (aiHold.length) {
    console.log(`--- AI SAYS HOLD (sample ${aiHold.length}) ---`);
    for (const f of aiHold) {
      console.log(`  REVIEW  ${f.possiblePhoneNumber.padEnd(16)} ${f.custodySuiteName} · ${f.sourceDomain}`);
    }
    const more = open.filter((f) => f.aiReview?.recommendation === 'hold').length - aiHold.length;
    if (more > 0) console.log(`  … and ${more} more hold items`);
    console.log();
  }

  // Awaiting AI
  const awaiting = open.filter((f) => !f.aiReview?.reviewedAt).slice(0, 5);
  if (awaiting.length) {
    console.log(`--- AWAITING AI (cron will process — ${summary.awaitingAi} total) ---`);
    for (const f of awaiting) {
      console.log(`  WAIT    ${f.possiblePhoneNumber.padEnd(16)} ${f.custodySuiteName} · score ${f.confidenceScore}`);
    }
    if (summary.awaitingAi > 5) console.log(`  … and ${summary.awaitingAi - 5} more`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
