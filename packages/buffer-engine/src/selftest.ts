import { listPostsInWindow } from './client';
import { getSiteBufferEnvConfig, MIN_POSTS_PER_DAY } from './config';
import { localDateInTimezone, addDaysToLocalDate } from './scheduler-core';
import type { BufferEngineAdapter, SelfTestResult } from './types';
import { ingestMetricsFromPosts, siteHostnameFromUrl } from './metrics';
import { getSlugEngagementStats, mergeSlugStats, saveSlugEngagementStats } from './storage';

export async function runSiteBufferSelfTest(
  adapter: BufferEngineAdapter,
  options?: { now?: Date },
): Promise<SelfTestResult> {
  const env = getSiteBufferEnvConfig();
  const now = options?.now ?? new Date();
  const yesterday = addDaysToLocalDate(localDateInTimezone(now, env.timezone), -1);
  const issues: string[] = [];

  if (!env.apiKey) {
    return {
      ok: false,
      date: yesterday,
      sentCount: 0,
      requiredCount: env.postsPerDay,
      metricsIngested: 0,
      issues: ['BUFFER_API_KEY missing'],
    };
  }

  const hostname = siteHostnameFromUrl(adapter.siteUrl);
  const dayStart = `${yesterday}T00:00:00`;
  const dayEnd = `${localDateInTimezone(now, env.timezone)}T00:00:00`;

  const sent = await listPostsInWindow(env.apiKey, env.organizationId, {
    status: ['sent'],
    dueAtStart: dayStart,
    dueAtEnd: dayEnd,
    channelIds: env.channels.map((c) => c.id),
    includeMetrics: true,
  });

  const siteSent = sent.filter((p) => p.text.includes(hostname));
  const sentCount = siteSent.length;

  if (sentCount < MIN_POSTS_PER_DAY) {
    issues.push(`Yesterday (${yesterday}): only ${sentCount}/${env.postsPerDay} posts sent`);
  }

  const ingested = ingestMetricsFromPosts(siteSent, hostname);
  const kv = adapter.kv ?? null;
  const existing = await getSlugEngagementStats(kv, adapter.siteId);
  await saveSlugEngagementStats(kv, adapter.siteId, mergeSlugStats(existing, ingested));

  return {
    ok: sentCount >= MIN_POSTS_PER_DAY,
    date: yesterday,
    sentCount,
    requiredCount: env.postsPerDay,
    metricsIngested: ingested.length,
    issues,
  };
}
