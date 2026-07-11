import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { BufferEngineAdapter, BufferKV } from './types';
import { runSiteBufferSelfTest } from './selftest';

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
  return {
    siteId: 'testsite',
    siteUrl: 'https://testsite.com',
    kv,
    getSchedulablePosts: () => [],
  };
}

let listPostsVariables: Array<Record<string, unknown>>;

function installFetchMock() {
  listPostsVariables = [];
  const mock = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.startsWith('https://api.buffer.com')) {
      const body = JSON.parse((init?.body as string) ?? '{}');
      if (/ListPosts/.test(body.query)) {
        listPostsVariables.push(body.variables);
      }
      return Response.json({
        data: { posts: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } },
      });
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
  const vars = listPostsVariables[0] as {
    input: { filter: { dueAt: { start: string; end: string } } };
  };
  return vars.input.filter.dueAt;
}

describe('runSiteBufferSelfTest day-window timezone offset', () => {
  it('uses a BST (+01:00) offset for a summer date', async () => {
    const adapter = makeAdapter(makeKV());
    await runSiteBufferSelfTest(adapter, {
      now: new Date('2026-06-29T05:00:00Z'),
    });
    const { start, end } = dueAtWindow();
    expect(start).toBe('2026-06-28T00:00:00+01:00');
    expect(end).toBe('2026-06-29T00:00:00+01:00');
  });

  it('uses a GMT (+00:00) offset for a winter date', async () => {
    const adapter = makeAdapter(makeKV());
    await runSiteBufferSelfTest(adapter, {
      now: new Date('2026-01-16T05:00:00Z'),
    });
    const { start, end } = dueAtWindow();
    expect(start).toBe('2026-01-15T00:00:00+00:00');
    expect(end).toBe('2026-01-16T00:00:00+00:00');
  });
});
