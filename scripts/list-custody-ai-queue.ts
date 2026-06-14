#!/usr/bin/env npx tsx
/** List custody findings awaiting human approve/reject with AI evidence summary. */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.vercel.production'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), override: true, quiet: true });

async function main() {
  const { getAllFindings } = await import('../lib/custody-discovery/storage');

  const findings = await getAllFindings();
  const open = findings.filter(
    (f) =>
      (f.status === 'needs_review' || f.status === 'new') &&
      f.aiReview?.reviewedAt,
  );

  const approve = open.filter((f) => f.aiReview?.recommendation === 'approve');
  const hold = open.filter((f) => f.aiReview?.recommendation === 'hold');
  const reject = open.filter((f) => f.aiReview?.recommendation === 'reject');
  const awaiting = findings.filter(
    (f) =>
      (f.status === 'needs_review' || f.status === 'new') &&
      !f.aiReview?.reviewedAt,
  );

  console.log(
    JSON.stringify(
      {
        summary: {
          awaitingAi: awaiting.length,
          aiApprove: approve.length,
          aiHold: hold.length,
          aiReject: reject.length,
        },
        approveQueue: approve.slice(0, 15).map((f) => ({
          id: f.id,
          suite: f.custodySuiteName,
          force: f.forceName,
          number: f.possiblePhoneNumber,
          score: f.confidenceScore,
          sourceType: f.sourceType,
          conflict: f.conflictReason ?? null,
          aiConfidence: f.aiReview!.aiConfidence,
          section: f.aiReview!.evidence.section,
          evidenceSource: f.aiReview!.evidence.source,
          excerpt: f.aiReview!.evidence.quote.replace(/\*\*/g, ''),
          whyPublish: f.aiReview!.whyPublish,
          sourceUrl: f.sourceUrl,
        })),
        holdSample: hold.slice(0, 5).map((f) => ({
          id: f.id,
          suite: f.custodySuiteName,
          number: f.possiblePhoneNumber,
          aiConfidence: f.aiReview!.aiConfidence,
          whyNot: f.aiReview!.whyNot || f.aiReview!.whyPublish,
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
