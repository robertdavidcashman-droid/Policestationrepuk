import { getBufferApiKey, getBufferOrganizationId } from './config';
import { fetchBufferPostStatusMap } from './client';
import { getSchedulerRunForDate, type SchedulerRunRecord } from './scheduler-storage';

export type BufferPostPublishStatus =
  | 'sent'
  | 'scheduled'
  | 'error'
  | 'draft'
  | 'not_found'
  | 'pending';

export interface BufferPostPublishRow {
  postId: string;
  slug: string;
  feed?: string;
  dueAt: string;
  channelId?: string;
  channelService?: string;
  duePast: boolean;
  status: BufferPostPublishStatus;
  issue?: string;
}

export interface BufferPostsPublishedReport {
  ok: boolean;
  date: string;
  reason?: 'no_run' | 'missing_api_key';
  total: number;
  sent: number;
  pending: number;
  failed: number;
  feedCounts: Record<string, number>;
  posts: BufferPostPublishRow[];
  problems: BufferPostPublishRow[];
}

export function evaluatePostsPublished(
  run: SchedulerRunRecord,
  statusById: Map<string, { status: string; channelService: string }>,
  now = Date.now(),
): BufferPostsPublishedReport {
  const posts: BufferPostPublishRow[] = run.postIds.map((postId, i) => {
    const dueAt = run.dueAts[i] ?? '';
    const duePast = dueAt ? new Date(dueAt).getTime() <= now : false;
    const buffer = statusById.get(postId);
    const rawStatus = buffer?.status ?? 'not_found';

    let status: BufferPostPublishStatus;
    let issue: string | undefined;

    if (!duePast) {
      status = 'pending';
    } else if (rawStatus === 'sent') {
      status = 'sent';
    } else if (rawStatus === 'scheduled') {
      status = 'scheduled';
      issue = 'still_scheduled_past_due';
    } else if (rawStatus === 'error') {
      status = 'error';
      issue = 'buffer_error_status';
    } else if (rawStatus === 'draft') {
      status = 'draft';
      issue = 'buffer_draft_status';
    } else {
      status = 'not_found';
      issue = 'post_not_found_in_buffer';
    }

    return {
      postId,
      slug: run.slugs[i] ?? postId,
      feed: run.feedIds?.[i],
      dueAt,
      channelId: run.channels[i],
      channelService: buffer?.channelService,
      duePast,
      status,
      issue,
    };
  });

  const problems = posts.filter((p) => p.duePast && p.status !== 'sent');
  const feedCounts: Record<string, number> = {};
  for (const p of posts) {
    const feed = p.feed ?? 'unknown';
    feedCounts[feed] = (feedCounts[feed] ?? 0) + 1;
  }

  return {
    ok: problems.length === 0,
    date: run.date,
    total: posts.length,
    sent: posts.filter((p) => p.status === 'sent').length,
    pending: posts.filter((p) => p.status === 'pending').length,
    failed: problems.length,
    feedCounts,
    posts,
    problems,
  };
}

export async function verifyBufferPostsPublished(
  date: string,
  opts?: { now?: Date },
): Promise<BufferPostsPublishedReport> {
  const run = await getSchedulerRunForDate(date);
  if (!run) {
    return {
      ok: false,
      date,
      reason: 'no_run',
      total: 0,
      sent: 0,
      pending: 0,
      failed: 0,
      feedCounts: {},
      posts: [],
      problems: [],
    };
  }

  const apiKey = getBufferApiKey();
  if (!apiKey) {
    return {
      ok: false,
      date,
      reason: 'missing_api_key',
      total: run.postIds.length,
      sent: 0,
      pending: 0,
      failed: run.postIds.length,
      feedCounts: {},
      posts: [],
      problems: [],
    };
  }

  const orgId = getBufferOrganizationId();
  const statusMap = await fetchBufferPostStatusMap(apiKey, orgId, run.postIds);
  const normalized = new Map<string, { status: string; channelService: string }>();
  for (const [id, row] of statusMap) {
    normalized.set(id, { status: row.status, channelService: row.channelService });
  }

  return evaluatePostsPublished(run, normalized, opts?.now?.getTime() ?? Date.now());
}
