import { listPostsInWindow } from './client';
import { getSiteBufferEnvConfig, MIN_POSTS_PER_DAY } from './config';
import { localDateInTimezone, addDaysToLocalDate } from './scheduler-core';
import type { BufferEngineAdapter, VerifyResult } from './types';
import { runSiteBufferScheduler } from './scheduler';
import { siteHostnameFromUrl } from './metrics';

export async function verifySiteBufferSchedule(
  adapter: BufferEngineAdapter,
  options?: { now?: Date; gapFill?: boolean },
): Promise<VerifyResult> {
  const env = getSiteBufferEnvConfig();
  const now = options?.now ?? new Date();
  const localDate = localDateInTimezone(now, env.timezone);
  const issues: string[] = [];

  if (!env.apiKey) {
    return { ok: false, date: localDate, scheduledCount: 0, requiredCount: env.postsPerDay, gapFilled: 0, issues: ['BUFFER_API_KEY missing'] };
  }

  const dayStart = `${localDate}T00:00:00`;
  const dayEnd = `${addDaysToLocalDate(localDate, 1)}T00:00:00`;
  const hostname = siteHostnameFromUrl(adapter.siteUrl);

  const scheduled = await listPostsInWindow(env.apiKey, env.organizationId, {
    status: ['scheduled'],
    dueAtStart: dayStart,
    dueAtEnd: dayEnd,
    channelIds: env.channels.map((c) => c.id),
  });

  const sitePosts = scheduled.filter((p) => p.text.includes(hostname));
  let scheduledCount = sitePosts.length;
  let gapFilled = 0;

  if (scheduledCount < env.postsPerDay) {
    issues.push(`Only ${scheduledCount}/${env.postsPerDay} posts scheduled for ${localDate}`);
    if (options?.gapFill !== false) {
      const result = await runSiteBufferScheduler(adapter, {
        now,
        force: true,
        respectCurrentTime: true,
        limit: env.postsPerDay - scheduledCount,
      });
      if (result.posts?.length) {
        gapFilled = result.posts.length;
        scheduledCount += gapFilled;
      }
      if (!result.ok && result.reason) issues.push(`Gap-fill: ${result.reason}`);
    }
  }

  return {
    ok: scheduledCount >= MIN_POSTS_PER_DAY,
    date: localDate,
    scheduledCount,
    requiredCount: env.postsPerDay,
    gapFilled,
    issues,
  };
}
