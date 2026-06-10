import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runBufferBlogScheduler } from '@/lib/buffer/scheduler';

const mockCreate = vi.fn();
const mockGetRun = vi.fn();
const mockSaveRun = vi.fn();
const mockGetRecent = vi.fn();
const mockSaveRecent = vi.fn();
const mockLoadAll = vi.fn();
const mockGetContentFeeds = vi.fn();

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

vi.mock('@/lib/buffer/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/buffer/config')>();
  return {
    ...actual,
    getBufferChannels: () => [{ id: 'gb-channel', service: 'googlebusiness' as const }],
  };
});

const ENV = process.env;

describe('runBufferBlogScheduler GBP preflight (no mock)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...ENV,
      BUFFER_API_KEY: 'test-buffer-key',
      BUFFER_SCHEDULER_POSTS_PER_FEED: '1',
      BUFFER_SCHEDULER_DAY_POSTS: '1',
      BUFFER_SCHEDULER_NIGHT_POSTS: '0',
      BUFFER_SCHEDULER_COOLDOWN_DAYS: '14',
    };
    mockGetRun.mockResolvedValue(null);
    mockGetRecent.mockResolvedValue([]);
    mockGetContentFeeds.mockReturnValue([{ id: 'custodynote', type: 'rss', url: 'https://custodynote.com/feed' }]);
    mockLoadAll.mockResolvedValue({
      posts: new Map([
        [
          'custodynote',
          [
            {
              feedId: 'custodynote',
              slug: 'bad-post',
              title: 'Bad',
              excerpt: 'Excerpt',
              url: 'https://custodynote.com/blog/bad-post',
              imageUrl: 'https://custodynote.com/foo.webp',
              googleBusinessImageUrl: 'https://custodynote.com/foo.webp',
            },
          ],
        ],
      ]),
      errors: [],
    });
  });

  afterEach(() => {
    process.env = { ...ENV };
  });

  it('aborts before createPost when GBP preflight fails', async () => {
    const result = await runBufferBlogScheduler(new Date('2026-06-08T05:00:00Z'));
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('GBP preflight failed');
    expect(result.gbpIssues?.length).toBeGreaterThan(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
