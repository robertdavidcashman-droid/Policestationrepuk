#!/usr/bin/env npx tsx
/**
 * Retry failed seo-growth Buffer posts one at a time (rate-limit safe).
 * Usage: npm run buffer:retry-failed
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createScheduledBufferPost } from '../lib/buffer/client';
import {
  getBufferApiKey,
  getBufferChannels,
  type BufferChannelService,
} from '../lib/buffer/config';
import { FEED_DEFAULT_IMAGES } from '../lib/buffer/feeds';
import { londonOffsetForDate } from '../lib/buffer/scheduler-core';

const RESULTS_PATH = resolve(process.cwd(), 'seo-growth/buffer/buffer-scheduled-results.json');
const BUFFER_ROWS_PATH = resolve(process.cwd(), 'seo-growth/buffer/buffer-posts.json');
const COOLDOWN_MS = 120_000;
const MAX_ATTEMPTS = 8;

interface ResultRow {
  ok: boolean;
  feedId: string;
  slug: string;
  channelService: BufferChannelService;
  dueAt: string;
  postId?: string;
  error?: string;
}

interface BufferRow {
  channel: string;
  site: string;
  blog_title: string;
  post_text: string;
  link: string;
  suggested_date: string;
  suggested_time: string;
}

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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRateLimit(err: unknown) {
  return /too many requests/i.test(err instanceof Error ? err.message : String(err));
}

function isDuplicate(err: unknown) {
  return /posted that one recently|already got this one scheduled|not able to post the same thing twice/i.test(
    err instanceof Error ? err.message : String(err),
  );
}

function londonDueAt(dateStr: string, timeStr: string): string {
  const [hh, mm] = timeStr.split(':').map(Number);
  const offset = londonOffsetForDate(dateStr);
  const iso = `${dateStr}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00${offset}`;
  return new Date(iso).toISOString();
}

function channelService(label: string): BufferChannelService | null {
  const n = label.toLowerCase();
  if (n === 'twitter' || n === 'x') return 'twitter';
  if (n === 'linkedin') return 'linkedin';
  if (n === 'google business' || n === 'googlebusiness') return 'googlebusiness';
  return null;
}

function feedIdFromSite(site: string): string {
  if (site.includes('policestationrepuk')) return 'policestationrepuk';
  if (site.includes('policestationagent')) return 'policestationagent';
  if (site.includes('psrtrain')) return 'psrtrain';
  if (site.includes('custodynote')) return 'custodynote';
  return 'unknown';
}

function rowKey(r: ResultRow) {
  return `${r.feedId}:${r.slug}:${r.channelService}:${r.dueAt.slice(0, 10)}`;
}

function saveResults(data: { results: ResultRow[]; [key: string]: unknown }) {
  const scheduled = data.results.filter((r) => r.ok).length;
  const failed = data.results.filter((r) => !r.ok).length;
  const summary = {
    ...data,
    ok: failed === 0,
    scheduled,
    failed,
    capturedAt: new Date().toISOString(),
  };
  writeFileSync(RESULTS_PATH, JSON.stringify(summary, null, 2));
  return summary;
}

function buildPostFromRow(failed: ResultRow, rows: BufferRow[]) {
  const url = (() => {
    if (failed.feedId === 'policestationrepuk') return `https://policestationrepuk.org/Blog/${failed.slug}`;
    if (failed.feedId === 'policestationagent') return `https://www.policestationagent.com/blog/${failed.slug}`;
    if (failed.feedId === 'psrtrain') return `https://psrtrain.com/blog/${failed.slug}`;
    if (failed.feedId === 'custodynote') return `https://custodynote.com/blog/${failed.slug}`;
    return null;
  })();
  if (!url) return null;

  const match = rows.find((row) => {
    const svc = channelService(row.channel);
    return row.link === url && svc === failed.channelService && feedIdFromSite(row.site) === failed.feedId;
  });

  let dueAt = failed.dueAt;
  if (match) {
    let time = match.suggested_time;
    if (failed.channelService === 'twitter') {
      const [h, m] = time.split(':').map(Number);
      time = `${String(Math.min(h + 4, 20)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    dueAt = londonDueAt(match.suggested_date, time);
  }

  const text = match ? `${match.post_text}\n\n${match.link}` : `${failed.slug}\n\n${url}`;

  return {
    feedId: failed.feedId,
    slug: failed.slug,
    text,
    url,
    dueAt,
    channelService: failed.channelService,
    imageUrl: FEED_DEFAULT_IMAGES[failed.feedId],
    imageAlt: match?.blog_title ?? failed.slug,
  };
}

async function scheduleOne(
  apiKey: string,
  channelId: string,
  post: NonNullable<ReturnType<typeof buildPostFromRow>>,
): Promise<{ ok: true; postId: string } | { ok: false; error: string }> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const created = await createScheduledBufferPost(apiKey, {
        channelId,
        channelService: post.channelService,
        text: post.text,
        dueAt: post.dueAt,
        url: post.url,
        imageUrl: post.imageUrl,
        imageAlt: post.imageAlt,
        feedId: post.feedId,
      });
      return { ok: true, postId: created.id };
    } catch (err) {
      if (isDuplicate(err)) return { ok: true, postId: 'already-scheduled-in-buffer' };
      if (isRateLimit(err) && attempt < MAX_ATTEMPTS) {
        const wait = Math.min(15000 * attempt, 90000);
        console.warn(`  rate limited — waiting ${wait}ms (${attempt}/${MAX_ATTEMPTS})`);
        await sleep(wait);
        continue;
      }
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
  return { ok: false, error: 'Max attempts exceeded' };
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env.vercel.production');

  const apiKey = getBufferApiKey();
  if (!apiKey) {
    console.error('BUFFER_API_KEY is not set');
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(RESULTS_PATH, 'utf8')) as { results: ResultRow[] };
  const rows: BufferRow[] = existsSync(BUFFER_ROWS_PATH)
    ? (JSON.parse(readFileSync(BUFFER_ROWS_PATH, 'utf8')) as BufferRow[])
    : [];

  const pending = data.results.filter((r) => !r.ok);
  if (pending.length === 0) {
    console.log(JSON.stringify({ ok: true, message: 'No failed posts to retry.' }, null, 2));
    return;
  }

  const channels = getBufferChannels();
  const channelByService = new Map(channels.map((c) => [c.service, c]));

  console.info(`Retrying ${pending.length} failed posts (${COOLDOWN_MS / 1000}s between each)…`);
  await sleep(COOLDOWN_MS);

  for (const failed of pending) {
    const channel = channelByService.get(failed.channelService);
    if (!channel) {
      console.error(`Skip ${rowKey(failed)} — no channel for ${failed.channelService}`);
      continue;
    }

    const post = buildPostFromRow(failed, rows);
    if (!post) {
      console.error(`Skip ${rowKey(failed)} — could not build post`);
      continue;
    }

    console.info(`Scheduling ${failed.feedId}/${failed.slug} (${failed.channelService})…`);
    const outcome = await scheduleOne(apiKey, channel.id, post);

    const idx = data.results.findIndex((r) => rowKey(r) === rowKey(failed));
    if (idx >= 0) {
      if (outcome.ok) {
        data.results[idx] = {
          ...failed,
          ok: true,
          dueAt: post.dueAt,
          postId: outcome.postId,
        };
        delete data.results[idx].error;
      } else {
        data.results[idx] = { ...failed, error: outcome.error };
      }
    }

    const summary = saveResults(data);
    console.info(`  → ${outcome.ok ? 'ok' : 'fail'} (total ${summary.scheduled}/${data.results.length})`);
    await sleep(COOLDOWN_MS);
  }

  const final = saveResults(data);
  console.log(JSON.stringify({ scheduled: final.scheduled, failed: final.failed }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
