import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runBufferBlogScheduler } from '@/lib/buffer/scheduler';
import type { SchedulablePost } from '@/lib/buffer/content-types';

const mockCreate = vi.fn();
const mockGetRun = vi.fn();
const mockSaveRun = vi.fn();
const mockGetRecent = vi.fn();
const mockSaveRecent = vi.fn();
const mockLoadAll = vi.fn();

vi.mock('@/lib/buffer/client', () => ({
  createScheduledBufferPost: (...args: unknown[]) => mockCreate(...args),
}));

vi.mock('@/lib/buffer/scheduler-storage', () => ({
  getSchedulerRunForDate: (...args: unknown[]) => mockGetRun(...args),
  saveSchedulerRun: (...args: unknown[]) => mockSaveRun(...args),
  getRecentSlugEntries: (...args: unknown[]) => mockGetRecent(...args),
  saveRecentSlugEntries: (...args: unknown[]) => mockSaveRecent(...args),
}));

vi.mock('@/lib/buffer/feeds', () => ({
  getContentFeeds: () => [
    { id: 'policestationrepuk', type: 'local' },
    { id: 'custodynote', type: 'rss', url: 'https://custodynote.com/feed' },
  ],
  loadAllFeedPosts: (...args: unknown[]) => mockLoadAll(...args),
}));

const ENV = process.env;

function makePosts(feedId: string, count: number): SchedulablePost[] {
  return Array.from({ length: count }, (_, i) => ({
    feedId,
    slug: `${feedId}-post-${i + 1}`,
    title: `${feedId} title ${i + 1}`,
    excerpt: 'Excerpt',
    url: `https://example.com/${feedId}/${i + 1}`,
  }));
}

describe('runBufferBlogScheduler integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...ENV,
      BUFFER_API_KEY: 'test-buffer-key',
      BUFFER_SCHEDULER_POSTS_PER_FEED: '5',
      BUFFER_SCHEDULER_DAY_POSTS: '3',
      BUFFER_SCHEDULER_NIGHT_POSTS: '2',
      BUFFER_SCHEDULER_COOLDOWN_DAYS: '14',
    };
    mockGetRun.mockResolvedValue(null);
    mockGetRecent.mockResolvedValue([]);
    mockLoadAll.mockResolvedValue(
      new Map([
        ['policestationrepuk', makePosts('policestationrepuk', 8)],
        ['custodynote', makePosts('custodynote', 8)],
      ]),
    );
    mockCreate.mockImplementation(async (_key, input) => ({
      id: `post-${input.channelService}-${input.dueAt}`,
      dueAt: input.dueAt,
      channelId: input.channelId,
      channelService: input.channelService,
    }));
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('returns error when BUFFER_API_KEY is missing', async () => {
    delete process.env.BUFFER_API_KEY;
    const result = await runBufferBlogScheduler(new Date('2026-06-08T05:00:00Z'));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/BUFFER_API_KEY/);
  });

  it('skips when a run already exists for the local date', async () => {
    mockGetRun.mockResolvedValue({
      date: '2026-06-08',
      scheduledAt: '2026-06-08T05:00:00.000Z',
      postIds: ['a'],
      slugs: ['slug-a'],
      feedIds: ['policestationrepuk'],
      channels: ['ch1'],
      dueAts: ['t1'],
    });

    const result = await runBufferBlogScheduler(new Date('2026-06-08T05:00:00Z'));
    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(true);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('schedules 5 posts per feed with day and night times', async () => {
    const result = await runBufferBlogScheduler(new Date('2026-06-08T05:00:00Z'));

    expect(result.ok).toBe(true);
    expect(result.posts).toHaveLength(10);
    expect(mockCreate).toHaveBeenCalledTimes(10);

    const feedIds = result.posts!.map((p) => p.feedId);
    expect(feedIds.filter((id) => id === 'policestationrepuk')).toHaveLength(5);
    expect(feedIds.filter((id) => id === 'custodynote')).toHaveLength(5);

    for (const call of mockCreate.mock.calls) {
      const input = call[1] as { text: string; dueAt: string };
      expect(input.dueAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00[+-]\d{2}:\d{2}$/);
      expect(input.text).toContain('https://example.com/');
    }

    expect(mockSaveRun).toHaveBeenCalledOnce();
    const savedRun = mockSaveRun.mock.calls[0]?.[0];
    expect(savedRun.feedIds).toHaveLength(10);
  });

  it('respects cooldown per feed and slug', async () => {
    mockGetRecent.mockResolvedValue([
      {
        slug: 'policestationrepuk-post-1',
        feedId: 'policestationrepuk',
        scheduledAt: new Date('2026-06-07T00:00:00Z').toISOString(),
      },
    ]);

    const result = await runBufferBlogScheduler(new Date('2026-06-08T05:00:00Z'));
    expect(result.ok).toBe(true);
    for (const post of result.posts ?? []) {
      expect(post.slug).not.toBe('policestationrepuk-post-1');
    }
  });
});
