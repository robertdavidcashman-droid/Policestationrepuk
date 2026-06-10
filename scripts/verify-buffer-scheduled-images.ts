#!/usr/bin/env npx tsx
/**
 * Verify today's scheduled Buffer posts have blog hero images in Buffer-compatible format.
 * Usage:
 *   npm run buffer:verify-scheduled-images
 *   npm run buffer:verify-scheduled-gbp
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyScheduledBufferImages } from '../lib/buffer/verify-scheduled';

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

  const googleBusinessOnly = process.argv.includes('--google-business');

  const result = await verifyScheduledBufferImages({ googleBusinessOnly });

  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        date: result.date,
        timezone: result.timezone,
        mode: result.mode,
        scheduledCount: result.scheduledCount,
        withBufferImage: result.posts.filter((r) => r.bufferHasImage === true).length,
        withValidProbe: result.posts.filter((r) => r.probeOk === true || r.gbpProbeOk === true)
          .length,
        googleBusinessPosts: result.googleBusinessPosts,
        usingFallbackImage: result.fallbacks.length,
        issueCount: result.issueCount,
        warningCount: result.warningCount,
        fallbacks: result.fallbacks,
        issues: result.issues,
        warnings: result.warnings,
        posts: result.posts,
      },
      null,
      2,
    ),
  );

  if (!result.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
