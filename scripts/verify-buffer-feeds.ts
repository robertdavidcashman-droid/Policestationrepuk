#!/usr/bin/env npx tsx
/**
 * Live HTTP check — all configured content feeds load with enough posts and images.
 * Usage: npm run buffer:verify-feeds
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getContentFeeds, loadAllFeedPosts } from '../lib/buffer/feeds';

const MIN_ITEMS = 3;
const MIN_IMAGE_RATIO = 0.8;

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

  const feeds = getContentFeeds();
  const { posts, errors } = await loadAllFeedPosts();

  const report: Array<{
    feedId: string;
    ok: boolean;
    itemCount: number;
    imageRatio: number;
    issues: string[];
  }> = [];

  let failed = false;

  for (const feed of feeds) {
    const issues: string[] = [];
    const loadError = errors.find((e) => e.feedId === feed.id);
    if (loadError) {
      issues.push(loadError.message);
      failed = true;
    }

    const items = posts.get(feed.id) ?? [];
    if (items.length < MIN_ITEMS) {
      issues.push(`Only ${items.length} items (need ≥ ${MIN_ITEMS})`);
      failed = true;
    }

    const withImage = items.filter((p) => p.imageUrl).length;
    const imageRatio = items.length > 0 ? withImage / items.length : 0;

    if (imageRatio < MIN_IMAGE_RATIO) {
      issues.push(
        `Image ratio ${(imageRatio * 100).toFixed(0)}% (need ≥ ${MIN_IMAGE_RATIO * 100}%)`,
      );
      failed = true;
    }

    report.push({
      feedId: feed.id,
      ok: issues.length === 0,
      itemCount: items.length,
      imageRatio,
      issues,
    });
  }

  console.log(JSON.stringify({ ok: !failed, feeds: report }, null, 2));
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
