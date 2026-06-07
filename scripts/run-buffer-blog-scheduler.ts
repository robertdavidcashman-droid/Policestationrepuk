#!/usr/bin/env npx tsx
/**
 * Manual trigger for the daily Buffer blog scheduler.
 * Usage: npm run buffer:schedule
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { runBufferBlogScheduler } from '../lib/buffer/scheduler';

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
  const result = await runBufferBlogScheduler(new Date(), { respectCurrentTime });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
