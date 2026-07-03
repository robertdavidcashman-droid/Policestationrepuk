#!/usr/bin/env npx tsx
/**
 * Verify yesterday's Buffer posts for all four sites in the shared workspace.
 * Usage: npm run buffer:verify-cross-site
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyCrossSiteBufferPosts } from '../lib/buffer/verify-cross-site';

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

loadEnvFile('.env.local');

async function main() {
  const report = await verifyCrossSiteBufferPosts();
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
