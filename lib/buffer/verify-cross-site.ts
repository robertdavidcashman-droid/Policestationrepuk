import {
  listPostsInWindow,
  MIN_POSTS_PER_DAY,
  siteHostnameFromUrl,
} from '@robertcashman/buffer-engine';
import { addDaysToLocalDate, localDateInTimezone, timezoneOffsetForDate } from './scheduler-core';
import { getBufferApiKey, getBufferOrganizationId, getSchedulerTimezone } from './config';
import { CROSS_SITE_BUFFER_TARGETS, type CrossSiteBufferTarget } from './cross-site-sites';

export interface CrossSiteSiteReport {
  id: string;
  hostname: string;
  sentCount: number;
  requiredCount: number;
  ok: boolean;
  issue?: string;
}

export interface CrossSiteBufferReport {
  ok: boolean;
  date: string;
  reason?: 'missing_api_key';
  sites: CrossSiteSiteReport[];
  problems: CrossSiteSiteReport[];
}

export function countSiteSentPosts(
  posts: Array<{ text: string }>,
  hostname: string,
): number {
  const bare = hostname.replace(/^www\./, '');
  return posts.filter((p) => {
    const match = p.text.match(/https?:\/\/[^\s)]+/);
    if (!match) return false;
    try {
      const host = new URL(match[0]).hostname.replace(/^www\./, '');
      return host === bare || host.endsWith(`.${bare}`);
    } catch {
      return false;
    }
  }).length;
}

export async function verifyCrossSiteBufferPosts(
  opts?: { now?: Date; date?: string; targets?: CrossSiteBufferTarget[] },
): Promise<CrossSiteBufferReport> {
  const timezone = getSchedulerTimezone();
  const yesterday =
    opts?.date ??
    addDaysToLocalDate(localDateInTimezone(opts?.now ?? new Date(), timezone), -1);
  const tomorrow = addDaysToLocalDate(yesterday, 1);
  const startOffset = timezoneOffsetForDate(yesterday, timezone);
  const endOffset = timezoneOffsetForDate(tomorrow, timezone);
  const dayStart = `${yesterday}T00:00:00${startOffset}`;
  const dayEnd = `${tomorrow}T00:00:00${endOffset}`;

  const apiKey = getBufferApiKey();
  if (!apiKey) {
    return {
      ok: false,
      date: yesterday,
      reason: 'missing_api_key',
      sites: [],
      problems: [],
    };
  }

  const orgId = getBufferOrganizationId();
  const targets = opts?.targets ?? CROSS_SITE_BUFFER_TARGETS;
  const allChannelIds = [...new Set(targets.flatMap((t) => t.channelIds))];

  const sent = await listPostsInWindow(apiKey, orgId, {
    status: ['sent'],
    dueAtStart: dayStart,
    dueAtEnd: dayEnd,
    channelIds: allChannelIds,
  });

  const sites: CrossSiteSiteReport[] = targets.map((target) => {
    const required = target.requiredPostsPerDay ?? MIN_POSTS_PER_DAY;
    const sentCount = countSiteSentPosts(sent, target.hostname);
    const ok = sentCount >= required;
    return {
      id: target.id,
      hostname: target.hostname,
      sentCount,
      requiredCount: required,
      ok,
      issue: ok ? undefined : `only ${sentCount}/${required} posts sent yesterday`,
    };
  });

  const problems = sites.filter((s) => !s.ok);

  return {
    ok: problems.length === 0,
    date: yesterday,
    sites,
    problems,
  };
}

/** Hostname helper for tests */
export { siteHostnameFromUrl };
