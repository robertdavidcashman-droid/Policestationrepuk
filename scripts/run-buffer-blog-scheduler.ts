#!/usr/bin/env npx tsx
/**
 * Manual Buffer scheduler trigger.
 *
 * Production cron uses buffer-engine via /api/cron/buffer-blog-posts.
 * This CLI defaults to the same engine path. Pass --legacy-feeds to use the
 * multi-feed RSS scheduler (ops only — can double-post if siblings self-schedule).
 *
 * Usage:
 *   npm run buffer:schedule -- --dry-run
 *   AUTOMATION_ALLOW_NON_PROD=1 npm run buffer:schedule -- --force
 *   AUTOMATION_ALLOW_NON_PROD=1 npm run buffer:schedule -- --legacy-feeds --force
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { runBufferBlogScheduler } from '../lib/buffer/scheduler';
import { runRepukBufferScheduler } from '../lib/buffer/engine-run';
import { assertLiveAutomationAllowed, AutomationEnvError } from '../lib/automation/env-guard';

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

  const respectCurrentTime = process.argv.includes('--respect-now');
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');
  const legacyFeeds = process.argv.includes('--legacy-feeds');

  if (!dryRun) {
    try {
      assertLiveAutomationAllowed('CLI buffer:schedule');
    } catch (err) {
      if (err instanceof AutomationEnvError) {
        console.error(
          `${err.message}\n` +
            'Hint: use --dry-run, or set AUTOMATION_ALLOW_NON_PROD=1 for controlled ops.\n' +
            'Production scheduling should go through Vercel cron /api/cron/buffer-blog-posts.',
        );
        process.exit(2);
      }
      throw err;
    }
  }

  if (legacyFeeds) {
    if (dryRun) {
      console.error('Legacy multi-feed scheduler does not support --dry-run; omit --legacy-feeds.');
      process.exit(2);
    }
    const result = await runBufferBlogScheduler(new Date(), {
      respectCurrentTime,
      force,
    });
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exit(1);
    return;
  }

  const result = await runRepukBufferScheduler({
    respectCurrentTime,
    force,
    dryRun,
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
