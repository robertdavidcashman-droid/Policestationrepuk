import { getSiteBufferEnvConfig } from './config';
import { countSitePostsInBufferForDay } from './reconcile';
import { localDateInTimezone } from './scheduler-core';
import type { BufferEngineAdapter, VerifyResult } from './types';
import { runSiteBufferScheduler } from './scheduler';

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

  const channelIds = env.channels.map((c) => c.id);

  const counted = await countSitePostsInBufferForDay(
    env.apiKey,
    env.organizationId,
    adapter.siteUrl,
    localDate,
    env.timezone,
    channelIds,
  );
  let scheduledCount = counted.count;
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
      }
      // Re-count from Buffer (scheduled + sent) rather than trusting local increment —
      // published slots become `sent` and must still count toward the day quota.
      const recounted = await countSitePostsInBufferForDay(
        env.apiKey,
        env.organizationId,
        adapter.siteUrl,
        localDate,
        env.timezone,
        channelIds,
      );
      scheduledCount = recounted.count;
      if (!result.ok && result.reason) issues.push(`Gap-fill: ${result.reason}`);
    }
  }

  return {
    ok: scheduledCount >= env.postsPerDay,
    date: localDate,
    scheduledCount,
    requiredCount: env.postsPerDay,
    gapFilled,
    issues,
  };
}
