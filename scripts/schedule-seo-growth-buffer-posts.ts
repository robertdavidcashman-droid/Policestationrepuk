#!/usr/bin/env npx tsx
/**
 * Bulk-schedule PSR UK blog posts + seo-growth buffer-posts.json into Buffer.
 * Usage: npm run buffer:schedule-seo-growth [-- --dry-run]
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getAllBlogArticles } from '../lib/blog/registry';
import { createScheduledBufferPost, listScheduledBufferPosts } from '../lib/buffer/client';
import {
  getBufferApiKey,
  getBufferChannels,
  getBufferOrganizationId,
  type BufferChannelService,
} from '../lib/buffer/config';
import { FEED_DEFAULT_IMAGES, hydrateGoogleBusinessImages, hydratePostImagesForBuffer } from '../lib/buffer/feeds';
import { assertGoogleBusinessScheduleReady } from '../lib/buffer/gbp-preflight';
import { buildSchedulablePostTextForService, londonOffsetForDate } from '../lib/buffer/scheduler-core';
import type { SchedulablePost } from '../lib/buffer/content-types';
import { SITE_URL } from '../lib/seo-layer/config';

interface BufferRow {
  channel: string;
  site: string;
  blog_title: string;
  post_text: string;
  link: string;
  suggested_date: string;
  suggested_time: string;
  status: string;
  notes?: string;
}

interface PlannedPost {
  feedId: string;
  slug: string;
  title: string;
  text: string;
  url: string;
  dueAt: string;
  channelService: BufferChannelService;
  imageUrl?: string;
  imageAlt?: string;
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

function channelServiceFromLabel(label: string): BufferChannelService | null {
  const n = label.toLowerCase();
  if (n === 'twitter' || n === 'x') return 'twitter';
  if (n === 'linkedin') return 'linkedin';
  if (n === 'google business' || n === 'googlebusiness' || n === 'gbp') return 'googlebusiness';
  return null;
}

function feedIdFromSite(site: string): string {
  if (site.includes('policestationrepuk')) return 'policestationrepuk';
  if (site.includes('policestationagent')) return 'policestationagent';
  if (site.includes('psrtrain')) return 'psrtrain';
  if (site.includes('custodynote')) return 'custodynote';
  return 'unknown';
}

function londonDueAt(dateStr: string, timeStr: string): string {
  const [hh, mm] = timeStr.split(':').map(Number);
  const offset = londonOffsetForDate(dateStr);
  const iso = `${dateStr}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00${offset}`;
  return new Date(iso).toISOString();
}

function staggerTimes(baseDate: string, index: number): string {
  const slots = ['09:15', '12:45', '17:30'];
  return londonDueAt(baseDate, slots[index % slots.length]!);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function planPsrUkPosts(startDate: string): PlannedPost[] {
  const base = SITE_URL.replace(/\/$/, '');
  const articles = getAllBlogArticles();
  const planned: PlannedPost[] = [];
  const services: BufferChannelService[] = ['twitter', 'linkedin', 'googlebusiness'];

  articles.forEach((article, dayIndex) => {
    const dateStr = addDays(startDate, dayIndex);
    services.forEach((service, channelIndex) => {
      const post: SchedulablePost = {
        feedId: 'policestationrepuk',
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt.trim(),
        url: `${base}/Blog/${article.slug}`,
        imageUrl: `${base}${article.image.src}`,
        imageAlt: article.image.alt,
      };
      planned.push({
        feedId: 'policestationrepuk',
        slug: article.slug,
        title: article.title,
        text: buildSchedulablePostTextForService(post, service),
        url: post.url,
        dueAt: staggerTimes(dateStr, channelIndex),
        channelService: service,
        imageUrl: post.imageUrl,
        imageAlt: post.imageAlt,
      });
    });
  });

  return planned;
}

function planExternalPosts(rows: BufferRow[]): PlannedPost[] {
  const planned: PlannedPost[] = [];
  for (const row of rows) {
    const service = channelServiceFromLabel(row.channel);
    if (!service) continue;
    const feedId = feedIdFromSite(row.site);
    planned.push({
      feedId,
      slug: row.link.split('/').filter(Boolean).pop() ?? 'unknown',
      title: row.blog_title,
      text: `${row.post_text}\n\n${row.link}`,
      url: row.link,
      dueAt: londonDueAt(row.suggested_date, row.suggested_time),
      channelService: service,
      imageUrl: FEED_DEFAULT_IMAGES[feedId],
      imageAlt: row.blog_title,
    });
  }
  return planned;
}


function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /too many requests/i.test(msg);
}

function isDuplicateScheduleError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /posted that one recently|already got this one scheduled|not able to post the same thing twice/i.test(
    msg,
  );
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function scheduleWithRetry(
  apiKey: string,
  p: PlannedPost,
  channelId: string,
  maxAttempts = 8,
  slowMode = false,
): Promise<{ ok: true; postId: string } | { ok: false; error: string }> {
  let lastError = 'Unknown error';
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const created = await createScheduledBufferPost(apiKey, {
        channelId,
        channelService: p.channelService,
        text: p.text,
        dueAt: p.dueAt,
        url: p.url,
        imageUrl: p.imageUrl,
        imageAlt: p.imageAlt,
        feedId: p.feedId,
      });
      return { ok: true, postId: created.id };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (isDuplicateScheduleError(err)) {
        return { ok: true, postId: 'already-scheduled-in-buffer' };
      }
      if (isRateLimitError(err) && attempt < maxAttempts) {
        const waitMs = slowMode
          ? Math.min(15000 * attempt, 90000)
          : Math.min(2000 * 2 ** (attempt - 1), 30000);
        console.warn(
          `[buffer:retry] Rate limited ${p.feedId}/${p.slug} (${p.channelService}) — waiting ${waitMs}ms (attempt ${attempt}/${maxAttempts})`,
        );
        await sleep(waitMs);
        continue;
      }
      break;
    }
  }
  return { ok: false, error: lastError };
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env.vercel.production');

  const dryRun = process.argv.includes('--dry-run');
  const retryFailed = process.argv.includes('--retry-failed');
  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const retryLimit = limitArg ? Math.max(1, Number(limitArg.split('=')[1])) : undefined;
  const apiKey = getBufferApiKey();
  if (!apiKey && !dryRun) {
    console.error('BUFFER_API_KEY is not set');
    process.exit(1);
  }

  const jsonPath = resolve(process.cwd(), 'seo-growth/buffer/buffer-posts.json');
  const externalRows: BufferRow[] = existsSync(jsonPath)
    ? (JSON.parse(readFileSync(jsonPath, 'utf8')) as BufferRow[])
    : [];

  const startDate = process.env.BUFFER_SEO_GROWTH_START_DATE?.trim() || '2026-06-15';
  let planned: PlannedPost[];

  if (retryFailed) {
    const prevPath = resolve(process.cwd(), 'seo-growth/buffer/buffer-scheduled-results.json');
    const prev = existsSync(prevPath)
      ? (JSON.parse(readFileSync(prevPath, 'utf8')) as {
          results: Array<{
            ok: boolean;
            feedId: string;
            slug: string;
            channelService: BufferChannelService;
            dueAt: string;
            error?: string;
          }>;
        })
      : { results: [] };
    const psrUk = planPsrUkPosts(startDate);
    const external = planExternalPosts(externalRows);
    const all = [...psrUk, ...external];
    const failedKeys = new Set(
      prev.results.filter((r) => !r.ok).map((r) => `${r.feedId}:${r.slug}:${r.channelService}:${r.dueAt.slice(0, 10)}`),
    );
    planned = all.filter((p) =>
      failedKeys.has(`${p.feedId}:${p.slug}:${p.channelService}:${p.dueAt.slice(0, 10)}`),
    );
    for (const p of planned) {
      if (p.channelService !== 'twitter') continue;
      const dateStr = p.dueAt.slice(0, 10);
      const [hh, mm] = p.dueAt.slice(11, 16).split(':').map(Number);
      const shifted = `${String(Math.min((hh ?? 9) + 4, 20)).padStart(2, '0')}:${String(mm ?? 30).padStart(2, '0')}`;
      p.dueAt = londonDueAt(dateStr, shifted);
    }
    if (retryLimit) planned = planned.slice(0, retryLimit);
  } else {
    planned = [...planPsrUkPosts(startDate), ...planExternalPosts(externalRows)];
  }

  planned = planned.filter((p) => p.dueAt > new Date().toISOString());

  if (retryFailed && !dryRun && planned.length > 0) {
    console.info('[buffer:retry] Waiting 120s for Buffer API rate limit to reset…');
    await sleep(120_000);
  }

  const channels = getBufferChannels();
  const channelByService = new Map(channels.map((c) => [c.service, c]));

  // Skip posts already queued in Buffer for the same URL + channel + day
  if (apiKey && !dryRun && !retryFailed) {
    const orgId = getBufferOrganizationId();
    const end = new Date();
    end.setUTCDate(end.getUTCDate() + 120);
    const existing = await listScheduledBufferPosts(apiKey, orgId, {
      dueAtStart: new Date().toISOString(),
      dueAtEnd: end.toISOString(),
    });
    const existingKeys = new Set<string>();
    for (const post of existing) {
      const urlMatch = post.text.match(/https?:\/\/[^\s]+/);
      if (!urlMatch) continue;
      const day = post.dueAt?.slice(0, 10) ?? '';
      existingKeys.add(`${post.channelId}:${urlMatch[0]}:${day}`);
    }
    planned = planned.filter((p) => {
      const channel = channelByService.get(p.channelService);
      if (!channel) return false;
      return !existingKeys.has(`${channel.id}:${p.url}:${p.dueAt.slice(0, 10)}`);
    });
  }

  // Hydrate images for PSR UK posts
  const psrPosts = planned.filter((p) => p.feedId === 'policestationrepuk');
  const psrSchedulable: SchedulablePost[] = psrPosts.map((p) => ({
    feedId: p.feedId,
    slug: p.slug,
    title: p.title,
    excerpt: '',
    url: p.url,
    imageUrl: p.imageUrl,
    imageAlt: p.imageAlt,
  }));
  const hydrated = await hydratePostImagesForBuffer(psrSchedulable, 'policestationrepuk');
  const gbpHydrated = await hydrateGoogleBusinessImages(hydrated);
  const imageBySlug = new Map(gbpHydrated.map((p) => [p.slug, p]));

  for (const p of planned) {
    if (p.feedId !== 'policestationrepuk') continue;
    const h = imageBySlug.get(p.slug);
    if (h?.imageUrl) p.imageUrl = h.imageUrl;
    if (h?.googleBusinessImageUrl && p.channelService === 'googlebusiness') {
      p.imageUrl = h.googleBusinessImageUrl;
    }
  }

  const gbpCandidates = planned
    .filter((p) => p.channelService === 'googlebusiness')
    .map((p) => ({
      feedId: p.feedId,
      slug: p.slug,
      title: p.title,
      excerpt: '',
      url: p.url,
      imageUrl: p.imageUrl,
      googleBusinessImageUrl: p.imageUrl,
      imageAlt: p.imageAlt,
    }));
  if (gbpCandidates.length > 0) {
    const gbpIssues = await assertGoogleBusinessScheduleReady(gbpCandidates);
    if (gbpIssues.length > 0) {
      console.error('GBP preflight failed:', JSON.stringify(gbpIssues, null, 2));
      process.exit(1);
    }
  }

  type ResultRow = {
    ok: boolean;
    feedId: string;
    slug: string;
    channelService: BufferChannelService;
    dueAt: string;
    postId?: string;
    error?: string;
  };

  const prevPath = resolve(process.cwd(), 'seo-growth/buffer/buffer-scheduled-results.json');
  const previousResults: ResultRow[] =
    retryFailed && existsSync(prevPath)
      ? ((JSON.parse(readFileSync(prevPath, 'utf8')) as { results: ResultRow[] }).results ?? [])
      : [];

  const results: ResultRow[] = [];
  const postDelayMs = retryFailed ? 90000 : 800;
  const slowRetry = retryFailed;

  for (const p of planned) {
    const channel = channelByService.get(p.channelService);
    if (!channel) {
      results.push({
        ok: false,
        feedId: p.feedId,
        slug: p.slug,
        channelService: p.channelService,
        dueAt: p.dueAt,
        error: 'No channel configured',
      });
      continue;
    }

    if (dryRun) {
      results.push({
        ok: true,
        feedId: p.feedId,
        slug: p.slug,
        channelService: p.channelService,
        dueAt: p.dueAt,
        postId: 'dry-run',
      });
      continue;
    }

    try {
      const outcome = await scheduleWithRetry(apiKey!, p, channel.id, 8, slowRetry);
      if (outcome.ok) {
        results.push({
          ok: true,
          feedId: p.feedId,
          slug: p.slug,
          channelService: p.channelService,
          dueAt: p.dueAt,
          postId: outcome.postId,
        });
      } else {
        results.push({
          ok: false,
          feedId: p.feedId,
          slug: p.slug,
          channelService: p.channelService,
          dueAt: p.dueAt,
          error: outcome.error,
        });
      }
      await sleep(postDelayMs);
    } catch (err) {
      results.push({
        ok: false,
        feedId: p.feedId,
        slug: p.slug,
        channelService: p.channelService,
        dueAt: p.dueAt,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const resultKey = (r: ResultRow) =>
    `${r.feedId}:${r.slug}:${r.channelService}:${r.dueAt.slice(0, 10)}`;

  const mergedByKey = new Map<string, ResultRow>();
  for (const r of previousResults) {
    mergedByKey.set(resultKey(r), r);
  }
  for (const r of results) {
    mergedByKey.set(resultKey(r), r);
  }
  const mergedResults = [...mergedByKey.values()].sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  const summary = {
    ok: mergedResults.every((r) => r.ok),
    dryRun,
    retryFailed,
    planned: planned.length,
    scheduled: mergedResults.filter((r) => r.ok).length,
    failed: mergedResults.filter((r) => !r.ok).length,
    psrUkPosts: retryFailed ? 0 : planPsrUkPosts(startDate).length,
    externalPosts: retryFailed ? 0 : planExternalPosts(externalRows).length,
    capturedAt: new Date().toISOString(),
    results: mergedResults,
  };

  const outPath = resolve(process.cwd(), 'seo-growth/buffer/buffer-scheduled-results.json');
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(
    JSON.stringify(
      { ...summary, results: `${mergedResults.length} entries (${results.length} this run)` },
      null,
      2,
    ),
  );

  if (!summary.ok && !dryRun && !retryFailed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
