#!/usr/bin/env npx tsx
/**
 * Mark failed seo-growth Buffer rows as scheduled when the URL is already in Buffer's queue.
 * Usage: npm run buffer:sync-seo-growth
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { listScheduledBufferPosts } from '../lib/buffer/client';
import { getBufferApiKey, getBufferOrganizationId } from '../lib/buffer/config';

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

function urlFromText(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match?.[0] ?? null;
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.trim().replace(/[.,)]+$/, ''));
    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.pathname = parsed.pathname.replace(/\/$/, '') || '/';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return url.trim().replace(/\/$/, '');
  }
}

function expectedUrl(row: { feedId: string; slug: string }): string | null {
  if (row.feedId === 'policestationrepuk') return `https://policestationrepuk.org/Blog/${row.slug}`;
  if (row.feedId === 'policestationagent') return `https://www.policestationagent.com/blog/${row.slug}`;
  if (row.feedId === 'psrtrain') return `https://psrtrain.com/blog/${row.slug}`;
  if (row.feedId === 'custodynote') return `https://custodynote.com/blog/${row.slug}`;
  return null;
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env.vercel.production');

  const apiKey = getBufferApiKey();
  if (!apiKey) {
    console.error('BUFFER_API_KEY is not set');
    process.exit(1);
  }

  const resultsPath = resolve(process.cwd(), 'seo-growth/buffer/buffer-scheduled-results.json');
  const data = JSON.parse(readFileSync(resultsPath, 'utf8')) as {
    results: Array<{
      ok: boolean;
      feedId: string;
      slug: string;
      channelService: string;
      dueAt: string;
      postId?: string;
      error?: string;
    }>;
  };

  const start = new Date().toISOString();
  const end = new Date();
  end.setUTCDate(end.getUTCDate() + 120);

  const queued = await listScheduledBufferPosts(apiKey, getBufferOrganizationId(), {
    dueAtStart: start,
    dueAtEnd: end.toISOString(),
  });

  const queuedByUrlChannel = new Map<string, string>();
  for (const post of queued) {
    const url = urlFromText(post.text);
    if (!url || !post.dueAt) continue;
    const normalized = normalizeUrl(url);
    const day = post.dueAt.slice(0, 10);
    queuedByUrlChannel.set(`${normalized}|${post.channelService}|${day}`, post.id);
    queuedByUrlChannel.set(`${normalized}|${post.channelService}`, post.id);
  }

  let synced = 0;
  for (const row of data.results) {
    if (row.ok) continue;
    const url = expectedUrl(row);
    if (!url) continue;
    const normalized = normalizeUrl(url);

    const day = row.dueAt.slice(0, 10);
    const postId =
      queuedByUrlChannel.get(`${normalized}|${row.channelService}|${day}`) ??
      queuedByUrlChannel.get(`${normalized}|${row.channelService}`);
    if (postId) {
      row.ok = true;
      row.postId = postId;
      delete row.error;
      synced += 1;
    }
  }

  data.results.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const scheduled = data.results.filter((r) => r.ok).length;
  const failed = data.results.filter((r) => !r.ok).length;
  const summary = {
    ok: failed === 0,
    syncedFromBufferQueue: synced,
    scheduled,
    failed,
    capturedAt: new Date().toISOString(),
    results: data.results,
  };

  writeFileSync(resultsPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ synced, scheduled, failed, queuedPosts: queued.length }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
