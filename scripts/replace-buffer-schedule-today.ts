#!/usr/bin/env npx tsx
/**
 * Delete today's scheduled Buffer posts, clear KV run lock, and re-run the full scheduler.
 * Usage: npm run buffer:replace-today
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { deleteBufferPost, listScheduledBufferPosts } from '../lib/buffer/client';
import {
  getBufferApiKey,
  getBufferChannels,
  getBufferOrganizationId,
  getSchedulerTimezone,
} from '../lib/buffer/config';
import { runBufferBlogScheduler } from '../lib/buffer/scheduler';
import {
  localDateInTimezone,
  postCooldownKey,
  timezoneOffsetForDate,
} from '../lib/buffer/scheduler-core';
import { deleteSchedulerRunForDate, getRecentSlugEntries, saveRecentSlugEntries } from '../lib/buffer/scheduler-storage';

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

function dueAtRangeForLocalDate(localDate: string, timezone: string): { start: string; end: string } {
  const offset = timezoneOffsetForDate(localDate, timezone);
  return {
    start: `${localDate}T00:00:00${offset}`,
    end: `${localDate}T23:59:59${offset}`,
  };
}

async function releaseCooldownForReplace(
  localDate: string,
  timezone: string,
  deletedKeys: Set<string>,
): Promise<number> {
  const entries = await getRecentSlugEntries();
  const before = entries.length;
  const kept = entries.filter((entry) => {
    const key = postCooldownKey(entry.feedId ?? 'policestationrepuk', entry.slug);
    if (deletedKeys.has(key)) return false;
    const entryDate = localDateInTimezone(new Date(entry.scheduledAt), timezone);
    if (entryDate === localDate) return false;
    return true;
  });
  if (kept.length !== before) {
    await saveRecentSlugEntries(kept);
  }
  return before - kept.length;
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env.vercel.production');

  const scheduleOnly = process.argv.includes('--schedule-only');

  const apiKey = getBufferApiKey();
  if (!apiKey) {
    console.error('BUFFER_API_KEY is not set');
    process.exit(1);
  }

  const timezone = getSchedulerTimezone();
  const now = new Date();
  const localDate = localDateInTimezone(now, timezone);
  const organizationId = getBufferOrganizationId();
  const channels = getBufferChannels();
  const { start, end } = dueAtRangeForLocalDate(localDate, timezone);

  console.log(`Replacing Buffer schedule for ${localDate} (${timezone})...`);

  const deleted: string[] = [];
  const skipped: Array<{ id: string; reason: string }> = [];
  const releasedCooldownKeys = new Set<string>();

  if (!scheduleOnly) {
    const scheduled = await listScheduledBufferPosts(apiKey, organizationId, {
      dueAtStart: start,
      dueAtEnd: end,
      channelIds: channels.map((c) => c.id),
    });

    console.log(`Found ${scheduled.length} scheduled posts for today.`);

    for (const post of scheduled) {
    if (!post.allowedActions.includes('deletePost')) {
      skipped.push({ id: post.id, reason: `deletePost not allowed (${post.allowedActions.join(', ')})` });
      continue;
    }
    try {
      await deleteBufferPost(apiKey, post.id);
      deleted.push(post.id);
      const urlMatch = post.text.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        try {
          const slug = new URL(urlMatch[0]).pathname.split('/').filter(Boolean).pop();
          if (slug) {
            if (urlMatch[0].includes('policestationrepuk.org')) releasedCooldownKeys.add(postCooldownKey('policestationrepuk', slug));
            else if (urlMatch[0].includes('custodynote.com')) releasedCooldownKeys.add(postCooldownKey('custodynote', slug));
            else if (urlMatch[0].includes('policestationagent.com')) releasedCooldownKeys.add(postCooldownKey('policestationagent', slug));
            else if (urlMatch[0].includes('psrtrain.com')) releasedCooldownKeys.add(postCooldownKey('psrtrain', slug));
          }
        } catch {
          /* ignore URL parse errors */
        }
      }
    } catch (err) {
      skipped.push({
        id: post.id,
        reason: err instanceof Error ? err.message : 'delete failed',
      });
    }
  }

    console.log(`Deleted ${deleted.length} posts; ${skipped.length} skipped.`);

    if (deleted.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  } else {
    await deleteSchedulerRunForDate(localDate);
    console.log(`Schedule-only mode: cleared KV run record for ${localDate}.`);
    const released = await releaseCooldownForReplace(localDate, timezone, releasedCooldownKeys);
    console.log(`Released ${released} recent-slug cooldown entry(ies) for re-pick.`);
  }

  if (!scheduleOnly) {
    await deleteSchedulerRunForDate(localDate);
    console.log(`Cleared KV run record for ${localDate}.`);
    const released = await releaseCooldownForReplace(localDate, timezone, releasedCooldownKeys);
    console.log(`Released ${released} recent-slug cooldown entry(ies) for re-pick.`);
  }

  const result = await runBufferBlogScheduler(now, {
    respectCurrentTime: true,
  });

  const postsWithImages = result.posts?.filter((p) => p.imageUrl).length ?? 0;
  const feedCounts: Record<string, number> = {};
  for (const post of result.posts ?? []) {
    feedCounts[post.feedId] = (feedCounts[post.feedId] ?? 0) + 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        skipped: result.skipped,
        reason: result.reason,
        date: result.date,
        deletedCount: deleted.length,
        skippedDeletes: skipped,
        newPostCount: result.posts?.length ?? 0,
        postsWithImages,
        feedCounts,
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
