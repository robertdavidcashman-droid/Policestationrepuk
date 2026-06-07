import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runBufferBlogScheduler } from '@/lib/buffer/scheduler';

const mockCreate = vi.fn();
const mockGetRun = vi.fn();
const mockSaveRun = vi.fn();
const mockGetRecent = vi.fn();
const mockSaveRecent = vi.fn();

vi.mock('@/lib/buffer/client', () => ({
  createScheduledBufferPost: (...args: unknown[]) => mockCreate(...args),
}));

vi.mock('@/lib/buffer/scheduler-storage', () => ({
  getSchedulerRunForDate: (...args: unknown[]) => mockGetRun(...args),
  saveSchedulerRun: (...args: unknown[]) => mockSaveRun(...args),
  getRecentSlugEntries: (...args: unknown[]) => mockGetRecent(...args),
  saveRecentSlugEntries: (...args: unknown[]) => mockSaveRecent(...args),
}));

const ENV = process.env;

describe('runBufferBlogScheduler integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...ENV,
      BUFFER_API_KEY: 'test-buffer-key',
      BUFFER_SCHEDULER_POSTS_PER_DAY: '3',
      BUFFER_SCHEDULER_COOLDOWN_DAYS: '14',
    };
    mockGetRun.mockResolvedValue(null);
    mockGetRecent.mockResolvedValue([]);
    mockCreate.mockImplementation(async (_key, input) => ({
      id: `post-${input.channelService}`,
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
      postIds: ['a', 'b', 'c'],
      slugs: ['slug-a', 'slug-b', 'slug-c'],
      channels: ['ch1', 'ch2', 'ch3'],
      dueAts: ['t1', 't2', 't3'],
    });

    const result = await runBufferBlogScheduler(new Date('2026-06-08T05:00:00Z'));
    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(true);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(result.posts).toHaveLength(3);
  });

  it('schedules three posts with distinct channels and policestationrepuk Blog URLs', async () => {
    const result = await runBufferBlogScheduler(new Date('2026-06-08T05:00:00Z'));

    expect(result.ok).toBe(true);
    expect(result.skipped).toBeUndefined();
    expect(result.posts).toHaveLength(3);
    expect(mockCreate).toHaveBeenCalledTimes(3);

    const channelIds = result.posts!.map((p) => p.channelId);
    expect(new Set(channelIds).size).toBe(3);

    for (const call of mockCreate.mock.calls) {
      const input = call[1] as { text: string; dueAt: string };
      expect(input.text).toMatch(/https:\/\/policestationrepuk\.org\/Blog\//);
      expect(input.dueAt).toMatch(/^2026-06-08T\d{2}:\d{2}:00[+-]\d{2}:\d{2}$/);
    }

    expect(mockSaveRun).toHaveBeenCalledOnce();
    expect(mockSaveRecent).toHaveBeenCalledOnce();
    const savedRun = mockSaveRun.mock.calls[0]?.[0];
    expect(savedRun.date).toBe('2026-06-08');
    expect(savedRun.slugs).toHaveLength(3);
  });

  it('respects cooldown exclusions from recent slug history', async () => {
    const { getAllBlogArticles } = await import('@/lib/blog/registry');
    const excluded = getAllBlogArticles().slice(0, 2).map((a) => a.slug);
    mockGetRecent.mockResolvedValue(
      excluded.map((slug) => ({
        slug,
        scheduledAt: new Date('2026-06-07T00:00:00Z').toISOString(),
      })),
    );

    const result = await runBufferBlogScheduler(new Date('2026-06-08T05:00:00Z'));
    expect(result.ok).toBe(true);
    for (const post of result.posts ?? []) {
      expect(excluded).not.toContain(post.slug);
    }
  });
});
