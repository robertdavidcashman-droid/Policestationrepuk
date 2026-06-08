/**
 * Site-wide editorial content accuracy inventory + red-flag scan.
 * Run: npm run audit:content-accuracy
 *
 * Outputs:
 *   audit/content-accuracy-register.json
 *   audit/content-accuracy-problems.md
 */
import fs from 'fs';
import path from 'path';
import { buildInventory } from '../../lib/editorial-audit/inventory';
import type { InventoryItem } from '../../lib/editorial-audit/types';

const ROOT = process.cwd();
const REGISTER_JSON = path.join(ROOT, 'audit/content-accuracy-register.json');
const PROBLEMS_MD = path.join(ROOT, 'audit/content-accuracy-problems.md');

function writeProblemsMd(items: InventoryItem[], generatedAt: string): void {
  const critical = items.flatMap((i) =>
    i.redFlags.filter((f) => f.severity === 'PROBLEM').map((f) => ({ ...f, item: i })),
  );
  const review = items.flatMap((i) =>
    i.redFlags.filter((f) => f.severity === 'REVIEW').map((f) => ({ ...f, item: i })),
  );
  const gaps = items.flatMap((i) =>
    i.redFlags.filter((f) => f.severity === 'GAP').map((f) => ({ ...f, item: i })),
  );
  const ok = items.filter(
    (i) =>
      i.auditStatus === 'verified-tier-8' &&
      !i.redFlags.some((f) => f.severity === 'PROBLEM' || f.severity === 'REVIEW'),
  );

  const row = (entry: { item: InventoryItem; code: string; message: string; excerpt?: string }) =>
    `- **${entry.item.url}** · \`${entry.item.sourceFile}\` · ${entry.message}${entry.excerpt ? ` · _"${entry.excerpt}"_` : ''}`;

  const md = `# Content accuracy problem register

Generated: ${generatedAt} by \`npm run audit:content-accuracy\`

## Honest limits

- Rep profile text, \`stations.json\`, and legal directory listings are **out of scope** (operational data).
- Future LAA fee changes require re-audit when SI/contracts update.
- Automation catches known bad patterns and missing footers; nuanced legal prose still needs human judgment.

## Summary

| Severity | Count |
|---|---|
| Critical (PROBLEM) | ${critical.length} |
| Review | ${review.length} |
| Compliance gap (GAP) | ${gaps.length} |
| OK (verified Tier 8) | ${ok.length} |
| Total editorial URLs | ${items.length} |

## Critical (factual error — fix before rely)

${critical.length ? critical.map(row).join('\n') : '_None — scan clean._'}

## Review (unverified or ambiguous)

${review.length ? review.map(row).join('\n') : '_None — scan clean._'}

## Compliance gap (missing sources footer / notice / audit log)

${gaps.length ? gaps.map(row).join('\n') : '_None._'}

## OK (verified Tier 8)

${ok.length ? ok.map((i) => `- ${i.url} · ${i.sourceFile}`).join('\n') : '_Tier 8 verification in progress — run manual pass and update CONTENT-ACCURACY-REVIEW.md._'}
`;

  fs.writeFileSync(PROBLEMS_MD, md);
}

function main(): void {
  const items = buildInventory();
  const generatedAt = new Date().toISOString();
  const summary = {
    generatedAt,
    totalItems: items.length,
    critical: items.filter((i) => i.redFlags.some((f) => f.severity === 'PROBLEM')).length,
    review: items.filter((i) => i.redFlags.some((f) => f.severity === 'REVIEW')).length,
    gaps: items.filter((i) => i.redFlags.some((f) => f.severity === 'GAP')).length,
    byContentType: items.reduce<Record<string, number>>((acc, i) => {
      acc[i.contentType] = (acc[i.contentType] ?? 0) + 1;
      return acc;
    }, {}),
    items,
  };

  fs.mkdirSync(path.dirname(REGISTER_JSON), { recursive: true });
  fs.writeFileSync(REGISTER_JSON, JSON.stringify(summary, null, 2));
  writeProblemsMd(items, generatedAt);

  console.log(`Content accuracy scan: ${items.length} editorial URLs`);
  console.log(`  Critical (PROBLEM): ${summary.critical}`);
  console.log(`  Review: ${summary.review}`);
  console.log(`  Compliance gaps: ${summary.gaps}`);
  console.log(`Wrote ${path.relative(ROOT, REGISTER_JSON)}`);
  console.log(`Wrote ${path.relative(ROOT, PROBLEMS_MD)}`);

  if (summary.critical > 0) {
    console.error('\nCritical factual red flags found — fix before relying on content.');
    process.exit(1);
  }
}

main();
