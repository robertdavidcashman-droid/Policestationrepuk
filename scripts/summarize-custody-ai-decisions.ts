#!/usr/bin/env npx tsx
/** Human-readable summary of AI custody review for approval decisions. */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.vercel.production'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), override: true, quiet: true });

function tier(
  f: Awaited<ReturnType<typeof import('../lib/custody-discovery/storage')['getAllFindings']>>[number],
  isOfficial: (t: string) => boolean,
): 'strong' | 'medium' | 'weak' {
  const r = f.aiReview!;
  if (
    r.aiConfidence >= 70 &&
    isOfficial(f.sourceType) &&
    r.evidence.source === 'page_fetch' &&
    f.confidenceScore >= 50 &&
    !f.conflictReason &&
    f.possiblePhoneNumber !== '101'
  ) {
    return 'strong';
  }
  if (
    r.aiConfidence < 50 ||
    !isOfficial(f.sourceType) ||
    r.evidence.source !== 'page_fetch' ||
    f.sourceType === 'solicitor_site' ||
    f.possiblePhoneNumber === '101' ||
    f.sourceType === 'unknown'
  ) {
    return 'weak';
  }
  return 'medium';
}

async function main() {
  const { getAllFindings } = await import('../lib/custody-discovery/storage');
  const { isOfficialSourceType } = await import('../lib/custody-discovery/source-type');

  const open = (await getAllFindings()).filter(
    (f) =>
      (f.status === 'needs_review' || f.status === 'new') && f.aiReview?.reviewedAt,
  );

  const approve = open.filter((f) => f.aiReview!.recommendation === 'approve');
  const reject = open.filter((f) => f.aiReview!.recommendation === 'reject');
  const hold = open.filter((f) => f.aiReview!.recommendation === 'hold');

  const groups = { strong: [] as typeof approve, medium: [] as typeof approve, weak: [] as typeof approve };
  for (const f of approve) groups[tier(f, isOfficialSourceType)].push(f);

  const row = (f: (typeof approve)[number]) => ({
    id: f.id,
    suite: f.custodySuiteName,
    force: f.forceName,
    number: f.possiblePhoneNumber,
    ruleScore: f.confidenceScore,
    aiConfidence: f.aiReview!.aiConfidence,
    sourceType: f.sourceType,
    evidence: f.aiReview!.evidence.source,
    section: f.aiReview!.evidence.section,
    excerpt: f.aiReview!.evidence.quote.replace(/\*\*/g, '').slice(0, 220),
    whyPublish: f.aiReview!.whyPublish,
    sourceUrl: f.sourceUrl,
  });

  console.log(
    JSON.stringify(
      {
        totals: { approve: approve.length, reject: reject.length, hold: hold.length },
        approveTiers: {
          strong: groups.strong.length,
          medium: groups.medium.length,
          weak: groups.weak.length,
        },
        strongApproves: groups.strong.map(row),
        mediumApproves: groups.medium.map(row),
        weakApproves: groups.weak.map(row),
        rejectAll: reject.map((f) => ({
          id: f.id,
          suite: f.custodySuiteName,
          number: f.possiblePhoneNumber,
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
