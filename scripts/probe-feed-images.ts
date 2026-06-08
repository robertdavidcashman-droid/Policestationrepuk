#!/usr/bin/env npx tsx
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadAllFeedPosts } from '../lib/buffer/feeds';
import {
  BUFFER_MAX_IMAGE_BYTES,
  probeBufferImageUrl,
} from '../lib/buffer/image-url';

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
  const { posts } = await loadAllFeedPosts();
  const bad: Array<Record<string, unknown>> = [];

  for (const [feedId, items] of posts) {
    for (const item of items) {
      if (!item.imageUrl?.trim()) {
        bad.push({ feedId, slug: item.slug, reason: 'missing imageUrl' });
        continue;
      }
      const probe = await probeBufferImageUrl(item.imageUrl);
      if (!probe.ok) {
        bad.push({
          feedId,
          slug: item.slug,
          url: item.imageUrl,
          reason: probe.reason,
          contentType: probe.contentType,
          contentLength: probe.contentLength,
          mb:
            probe.contentLength != null
              ? (probe.contentLength / (1024 * 1024)).toFixed(2)
              : undefined,
        });
      }
    }
  }

  console.log(JSON.stringify({ ok: bad.length === 0, maxBytes: BUFFER_MAX_IMAGE_BYTES, totalBad: bad.length, bad }, null, 2));
  if (bad.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
