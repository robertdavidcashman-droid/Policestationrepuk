import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { BufferEngineAdapter, BufferKV, SchedulablePost } from './types';
import { verifySiteBufferSchedule } from './verify';

function makeKV(): BufferKV {
  const store = new Map<string, unknown>();
  return {
    get: async <T>(key: string) => (store.has(key) ? (store.get(key) as T) : null),
    set: async (key, value) => {
      store.set(key, value);
      return 'OK';
    },
    del: async (key) => {
      store.delete(key);
      return 1;
    },
  };
}

function makeAdapter(kv: BufferKV): BufferEngineAdapter {
  const posts: SchedulablePost[] = [];
  return {
    siteId: 'testsite',
    siteUrl: 'https://testsite.com',
    kv,
    getSchedulablePosts: () => posts,
  };
}

let listPostsVariables: Array<Record<string, unknown>>;
let listPostsEdges: Array<{
  id: string;
  text: string;
  status: string;
  dueAt: string | null;
  sentAt: string | null;
  createdAt: string;
  channelId: string;
  channelService: string;
}>;

function installFetchMock(
  edges: typeof listPostsEdges = [],
) {
  listPostsVariables = [];
  listPostsEdges = edges;
  const mock = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.startsWith('https://api.buffer.com')) {
      const body = JSON.parse((init?.body as string) ?? '{}');
      if (/ListPosts/.test(body.query)) {
        listPostsVariables.push(body.variables);
        const statuses = (body.variables as { input?: { filter?: { status?: string[] } } })
          ?.input?.filter?.status;
        const filtered = statuses?.length
          ? listPostsEdges.filter((p) => statuses.includes(p.status))
          : listPostsEdges;
        return Response.json({
          data: {
            posts: {
              edges: filtered.map((node) => ({ node })),
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        });
      }
      return Response.json({ data: { posts: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } } });
    }
    return new Response(null, { status: 404 });
  }) as unknown as typeof fetch;
  vi.stubGlobal('fetch', mock);
}

const BASE_ENV = { ...process.env };

beforeEach(() => {
  process.env = {
    ...BASE_ENV,
    BUFFER_API_KEY: 'test-key',
    BUFFER_ORGANIZATION_ID: 'a'.repeat(24),
    BUFFER_CHANNEL_TWITTER_ID: 'b'.repeat(24),
    BUFFER_SCHEDULER_POSTS_PER_FEED: '5',
  };
  installFetchMock();
});

afterEach(() => {
  process.env = { ...BASE_ENV };
  vi.unstubAllGlobals();
});

function dueAtWindow() {
  const vars = listPostsVariables[0] as { input: { filter: { dueAt: { start: string; end: string } } } };
  return vars.input.filter.dueAt;
}

describe('verifySiteBufferSchedule day-window timezone offset', () => {
  it('uses a BST (+01:00) offset for a summer date', async () => {
    const adapter = makeAdapter(makeKV());
    await verifySiteBufferSchedule(adapter, {
      now: new Date('2026-06-28T05:00:00Z'),
      gapFill: false,
    });
    const { start, end } = dueAtWindow();
    expect(start).toBe('2026-06-28T00:00:00+01:00');
    expect(end).toBe('2026-06-29T00:00:00+01:00');
  });

  it('uses a GMT (+00:00) offset for a winter date', async () => {
    const adapter = makeAdapter(makeKV());
    await verifySiteBufferSchedule(adapter, {
      now: new Date('2026-01-15T05:00:00Z'),
      gapFill: false,
    });
    const { start, end } = dueAtWindow();
    expect(start).toBe('2026-01-15T00:00:00+00:00');
    expect(end).toBe('2026-01-16T00:00:00+00:00');
  });

  it('counts sent + scheduled toward daily quota and does not gap-fill', async () => {
    const posts = [
      ...Array.from({ length: 4 }, (_, i) => ({
        id: `sent-${i}`,
        text: `Post ${i} https://testsite.com/Blog/a-${i}`,
        status: 'sent',
        dueAt: `2026-06-28T0${i + 8}:00:00+01:00`,
        sentAt: `2026-06-28T0${i + 8}:00:00+01:00`,
        createdAt: '',
        channelId: 'b'.repeat(24),
        channelService: 'twitter',
      })),
      {
        id: 'sched-1',
        text: 'Post 4 https://testsite.com/Blog/a-4',
        status: 'scheduled',
        dueAt: '2026-06-28T18:00:00+01:00',
        sentAt: null,
        createdAt: '',
        channelId: 'b'.repeat(24),
        channelService: 'twitter',
      },
    ];
    installFetchMock(posts);

    const adapter = makeAdapter(makeKV());
    const result = await verifySiteBufferSchedule(adapter, {
      now: new Date('2026-06-28T16:00:00Z'),
      gapFill: true,
    });

    expect(result.ok).toBe(true);
    expect(result.scheduledCount).toBe(5);
    expect(result.requiredCount).toBe(5);
    expect(result.gapFilled).toBe(0);
    expect(result.issues).toEqual([]);

    const statusFilter = (
      listPostsVariables[0] as { input: { filter: { status: string[] } } }
    ).input.filter.status;
    expect(statusFilter).toEqual(expect.arrayContaining(['scheduled', 'sent']));
    // Only one ListPosts call — quota already met, so no gap-fill / re-count.
    expect(listPostsVariables).toHaveLength(1);
  });

  it('sets ok false when count meets MIN_POSTS_PER_DAY but not postsPerDay', async () => {
    process.env.BUFFER_SCHEDULER_POSTS_PER_FEED = '7';
    const posts = Array.from({ length: 5 }, (_, i) => ({
      id: `sent-${i}`,
      text: `Post ${i} https://testsite.com/Blog/a-${i}`,
      status: i < 4 ? 'sent' : 'scheduled',
      dueAt: `2026-06-28T0${i + 8}:00:00+01:00`,
      sentAt: i < 4 ? `2026-06-28T0${i + 8}:00:00+01:00` : null,
      createdAt: '',
      channelId: 'b'.repeat(24),
      channelService: 'twitter',
    }));
    installFetchMock(posts);

    const adapter = makeAdapter(makeKV());
    const result = await verifySiteBufferSchedule(adapter, {
      now: new Date('2026-06-28T16:00:00Z'),
      gapFill: false,
    });

    expect(result.requiredCount).toBe(7);
    expect(result.scheduledCount).toBe(5);
    expect(result.ok).toBe(false);
    expect(result.issues[0]).toMatch(/Only 5\/7/);
  });
});
