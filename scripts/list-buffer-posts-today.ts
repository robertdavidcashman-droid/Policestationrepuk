#!/usr/bin/env npx tsx
/**
 * List Buffer posts scheduled for today (Europe/London) from KV run record.
 * Usage: npm run buffer:list-today
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getBlogArticle } from '../lib/blog/registry';
import { getSchedulerTimezone } from '../lib/buffer/config';
import { getSchedulerRunForDate } from '../lib/buffer/scheduler-storage';
import { localDateInTimezone } from '../lib/buffer/scheduler-core';

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
loadEnvFile('.env.vercel.production');

async function main() {
  const timezone = getSchedulerTimezone();
  const today = localDateInTimezone(new Date(), timezone);
  const run = await getSchedulerRunForDate(today);

  if (!run) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          date: today,
          timezone,
          message: 'No scheduler run recorded in KV for this date yet.',
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  const byFeed: Record<string, Array<{ slug: string; title: string; dueAt: string; channelId: string; postId: string }>> = {};

  run.slugs.forEach((slug, i) => {
    const feedId = run.feedIds?.[i] ?? 'policestationrepuk';
    const article = feedId === 'policestationrepuk' ? getBlogArticle(slug) : null;
    const entry = {
      slug,
      title: article?.title ?? slug,
      dueAt: run.dueAts[i] ?? '',
      channelId: run.channels[i] ?? '',
      postId: run.postIds[i] ?? '',
    };
    if (!byFeed[feedId]) byFeed[feedId] = [];
    byFeed[feedId]!.push(entry);
  });

  for (const feedId of Object.keys(byFeed)) {
    byFeed[feedId]!.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  }

  const total = run.slugs.length;
  const feedCounts = Object.fromEntries(
    Object.entries(byFeed).map(([feedId, posts]) => [feedId, posts.length]),
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        date: today,
        timezone,
        scheduledAt: run.scheduledAt,
        total,
        feedCounts,
        postsByFeed: byFeed,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
