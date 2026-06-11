/**
 * Export full outreach activity report (JSON + CSV).
 * npx tsx scripts/firm-outreach-report.ts [--csv-only]
 */
import { config } from 'dotenv';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config();

async function main() {
  const csvOnly = process.argv.includes('--csv-only');
  const { buildOutreachActivityReport, activityReportToCsv } = await import(
    '../lib/firm-outreach/outreach/activity-report'
  );

  const { report, prospectCounts } = await buildOutreachActivityReport();
  const outDir = resolve(__dirname, '../data/reports');
  mkdirSync(outDir, { recursive: true });
  const date = report.generatedAt.slice(0, 10);

  const csvPath = resolve(outDir, `firm-outreach-${date}.csv`);
  writeFileSync(csvPath, activityReportToCsv(report));
  console.log('[firm-outreach report] CSV:', csvPath);

  if (!csvOnly) {
    const jsonPath = resolve(outDir, `firm-outreach-${date}.json`);
    writeFileSync(jsonPath, JSON.stringify({ report, prospectCounts }, null, 2) + '\n');
    console.log('[firm-outreach report] JSON:', jsonPath);
  }

  console.log('[firm-outreach report] summary:', JSON.stringify(report.summary, null, 2));
}

main().catch((err) => {
  console.error('[firm-outreach report] failed:', err);
  process.exit(1);
});
