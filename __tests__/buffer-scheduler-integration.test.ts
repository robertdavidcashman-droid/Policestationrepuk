import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runBufferBlogScheduler } from '@/lib/buffer/scheduler';
import type { SchedulablePost } from '@/lib/buffer/content-types';

const mockCreate = vi.fn();
const mockGetRun = vi.fn();
const mockSaveRun = vi.fn();
const mockGetRecent = vi.fn();
const mockSaveRecent = vi.fn();
const mockLoadAll = vi.fn();
const mockGetContentFeeds = vi.fn();

vi.mock('@/lib/buffer/gbp-preflight', () => ({
  assertGoogleBusinessScheduleReady: vi.fn().mockResolvedValue([]),
}));

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
  getContentFeeds: () => mockGetContentFeeds(),
  loadAllFeedPosts: (...args: unknown[]) => mockLoadAll(...args),
}));

const ENV = process.env;

function makePosts(feedId: string, count: number): SchedulablePost[] {
  const gbpUrl = `https://policestationrepuk.org/images/buffer/gbp/${feedId}-default.jpg`;
  return Array.from({ length: count }, (_, i) => ({
    feedId,
    slug: `${feedId}-post-${i + 1}`,
    title: `${feedId} title ${i + 1}`,
    excerpt: 'Excerpt',
    url: `https://example.com/${feedId}/${i + 1}`,
    imageUrl: `https://example.com/${feedId}/${i + 1}.webp`,
    googleBusinessImageUrl: gbpUrl,
    imageAlt: `${feedId} title ${i + 1}`,
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
    mockGetContentFeeds.mockReturnValue([
      { id: 'policestationrepuk', type: 'local' },
      { id: 'custodynote', type: 'rss', url: 'https://custodynote.com/feed' },
    ]);
    mockLoadAll.mockResolvedValue({
      posts: new Map([
        ['policestationrepuk', makePosts('policestationrepuk', 8)],
        ['custodynote', makePosts('custodynote', 8)],
      ]),
      errors: [],
    });
    mockCreate.mockImplementation(async (_key, input) => ({
      id: `post-${input.channelService}-${input.dueAt}`,
      dueAt: input.dueAt,
      channelId: input.channelId,
      channelService: input.channelService,
      imageUrl:
        input.channelService === 'googlebusiness' && input.imageUrl?.includes('.webp')
          ? input.imageUrl.replace(/\.webp(\?.*)?$/i, '.jpg$1')
          : input.imageUrl,
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

  it('re-runs when force is true even if a run exists for the local date', async () => {
    mockGetRun.mockResolvedValue({
      date: '2026-06-08',
      scheduledAt: '2026-06-08T05:00:00.000Z',
      postIds: ['a'],
      slugs: ['slug-a'],
      feedIds: ['policestationrepuk'],
      channels: ['ch1'],
      dueAts: ['t1'],
    });

    const result = await runBufferBlogScheduler(new Date('2026-06-08T05:00:00Z'), { force: true });
    expect(result.ok).toBe(true);
    expect(result.skipped).toBeUndefined();
    expect(mockCreate).toHaveBeenCalled();
  });

  it('schedules posts per feed with day and night times', async () => {
    const result = await runBufferBlogScheduler(new Date('2026-06-08T05:00:00Z'));

    expect(result.ok).toBe(true);
    expect(result.posts).toHaveLength(10);
    expect(mockCreate).toHaveBeenCalledTimes(10);

    const feedIds = result.posts!.map((p) => p.feedId);
    expect(feedIds.filter((id) => id === 'policestationrepuk')).toHaveLength(5);
    expect(feedIds.filter((id) => id === 'custodynote')).toHaveLength(5);

    for (const call of mockCreate.mock.calls) {
      const input = call[1] as { text: string; dueAt: string; imageUrl?: string; channelService: string };
      expect(input.dueAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00[+-]\d{2}:\d{2}$/);
      expect(input.text).toContain('https://example.com/');
      if (input.channelService === 'googlebusiness') {
        expect(input.imageUrl).toMatch(/\/images\/buffer\/gbp\/.*-default\.jpg$/);
      } else {
        expect(input.imageUrl).toMatch(/^https:\/\/example.com\//);
      }
    }

    expect(mockSaveRun).toHaveBeenCalledOnce();
    const savedRun = mockSaveRun.mock.calls[0]?.[0];
    expect(savedRun.feedIds).toHaveLength(10);
  });

  it('schedules 4 posts for psrtrain when feed uses 2 day + 2 night', async () => {
    mockGetContentFeeds.mockReturnValue([
      {
        id: 'psrtrain',
        type: 'rss',
        url: 'https://psrtrain.com/feed',
        postsPerDay: 4,
        dayPosts: 2,
        nightPosts: 2,
      },
    ]);
    mockLoadAll.mockResolvedValue({
      posts: new Map([['psrtrain', makePosts('psrtrain', 10)]]),
      errors: [],
    });

    const result = await runBufferBlogScheduler(new Date('2026-06-08T05:00:00Z'));
    expect(result.ok).toBe(true);
    expect(result.posts).toHaveLength(4);
    expect(result.posts!.every((p) => p.feedId === 'psrtrain')).toBe(true);
  });

  it('continues scheduling other feeds when psrtrain is on full cooldown', async () => {
    mockGetContentFeeds.mockReturnValue([
      { id: 'policestationrepuk', type: 'local' },
      {
        id: 'psrtrain',
        type: 'rss',
        url: 'https://psrtrain.com/feed',
        postsPerDay: 4,
        dayPosts: 2,
        nightPosts: 2,
      },
    ]);
    mockLoadAll.mockResolvedValue({
      posts: new Map([
        ['policestationrepuk', makePosts('policestationrepuk', 8)],
        ['psrtrain', makePosts('psrtrain', 8)],
      ]),
      errors: [],
    });
    mockGetRecent.mockResolvedValue(
      Array.from({ length: 8 }, (_, i) => ({
        slug: `psrtrain-post-${i + 1}`,
        feedId: 'psrtrain',
        scheduledAt: new Date('2026-06-07T00:00:00Z').toISOString(),
      })),
    );

    const result = await runBufferBlogScheduler(new Date('2026-06-08T05:00:00Z'));
    expect(result.ok).toBe(true);
    expect(result.posts!.some((p) => p.feedId === 'policestationrepuk')).toBe(true);
    expect(result.posts!.every((p) => p.feedId !== 'psrtrain')).toBe(true);
    expect(mockCreate).toHaveBeenCalled();
  });

  it('continues scheduling when one feed fails but others have posts', async () => {
    mockLoadAll.mockResolvedValue({
      posts: new Map([
        ['policestationrepuk', makePosts('policestationrepuk', 8)],
        ['custodynote', []],
        ['policestationagent', makePosts('policestationagent', 8)],
        ['psrtrain', makePosts('psrtrain', 8)],
      ]),
      errors: [{ feedId: 'custodynote', url: 'https://custodynote.com/feed', message: 'HTTP 503' }],
    });

    const result = await runBufferBlogScheduler(new Date('2026-06-08T05:00:00Z'));
    expect(result.ok).toBe(true);
    expect(result.posts!.every((p) => p.feedId !== 'custodynote')).toBe(true);
    expect(mockCreate).toHaveBeenCalled();
  });

  it('returns error when all feeds fail to load', async () => {
    mockLoadAll.mockResolvedValue({
      posts: new Map([
        ['policestationrepuk', []],
        ['custodynote', []],
        ['policestationagent', []],
        ['psrtrain', []],
      ]),
      errors: [
        { feedId: 'custodynote', url: 'https://custodynote.com/feed', message: 'HTTP 503' },
        { feedId: 'psrtrain', url: 'https://psrtrain.com/feed', message: 'HTTP 503' },
      ],
    });

    const result = await runBufferBlogScheduler(new Date('2026-06-08T05:00:00Z'));
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/All feeds failed/);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('respects cooldown per feed and slug', async () => {
    mockGetRecent.mockResolvedValue([
      {
        slug: 'policestationrepuk-post-1',
        feedId: 'policestationrepuk',
        scheduledAt: new Date('2026-06-08T04:00:00Z').toISOString(),
      },
    ]);

    const result = await runBufferBlogScheduler(new Date('2026-06-08T05:00:00Z'));
    expect(result.ok).toBe(true);
    for (const post of result.posts ?? []) {
      expect(post.slug).not.toBe('policestationrepuk-post-1');
    }
  });
});
