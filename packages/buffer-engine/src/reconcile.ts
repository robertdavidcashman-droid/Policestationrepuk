import { listPostsInWindow } from './client';
import { addDaysToLocalDate, timezoneOffsetForDate } from './scheduler-core';
import { siteHostnameFromUrl } from './metrics';

export interface BufferDayPostCount {
  count: number;
  postIds: string[];
  statuses: Array<'scheduled' | 'sent'>;
}

/** Count posts in Buffer due on `localDate` whose text links to this site. */
export async function countSitePostsInBufferForDay(
  apiKey: string,
  organizationId: string,
  siteUrl: string,
  localDate: string,
  timezone: string,
  channelIds: string[],
): Promise<BufferDayPostCount> {
  if (!channelIds.length) {
    return { count: 0, postIds: [], statuses: [] };
  }

  const offset = timezoneOffsetForDate(localDate, timezone);
  const dayStart = `${localDate}T00:00:00${offset}`;
  const dayEnd = `${addDaysToLocalDate(localDate, 1)}T00:00:00${offset}`;
  const hostname = siteHostnameFromUrl(siteUrl);

  const inBuffer = await listPostsInWindow(apiKey, organizationId, {
    status: ['scheduled', 'sent'],
    dueAtStart: dayStart,
    dueAtEnd: dayEnd,
    channelIds,
  });

  const sitePosts = inBuffer.filter((p) => postTextMatchesHostname(p.text, hostname));

  return {
    count: sitePosts.length,
    postIds: sitePosts.map((p) => p.id),
    statuses: sitePosts.map((p) => (p.status === 'sent' ? 'sent' : 'scheduled')),
  };
}

function postTextMatchesHostname(text: string, hostname: string): boolean {
  const bare = hostname.replace(/^www\./, '');
  const match = text.match(/https?:\/\/[^\s)]+/);
  if (!match) return false;
  try {
    const host = new URL(match[0]).hostname.replace(/^www\./, '');
    return host === bare || host.endsWith(`.${bare}`);
  } catch {
    return false;
  }
}
