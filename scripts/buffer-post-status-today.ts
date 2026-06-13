#!/usr/bin/env npx tsx
/**
 * Verify Buffer post publish status for a scheduler run date.
 * Default: yesterday in Europe/London (matches daily report cron).
 *
 * Usage:
 *   npm run buffer:verify-posted
 *   npm run buffer:verify-posted -- --date=2026-06-12
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { bufferDigestVerifyDate } from '../lib/buffer/daily-digest';
import { verifyBufferPostsPublished } from '../lib/buffer/verify-posted';

function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env.vercel.production');

  const dateArg = process.argv.find((a) => a.startsWith('--date='))?.split('=')[1]?.trim();
  const date = dateArg || bufferDigestVerifyDate();

  const report = await verifyBufferPostsPublished(date);

  console.log(
    JSON.stringify(
      {
        ok: report.ok,
        date: report.date,
        reason: report.reason,
        total: report.total,
        sent: report.sent,
        pending: report.pending,
        failed: report.failed,
        feedCounts: report.feedCounts,
        problems: report.problems,
        posts: report.posts,
      },
      null,
      2,
    ),
  );

  process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
