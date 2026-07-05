import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import sharp from 'sharp';
import { createScheduledBufferPost, metricsFromPostMetricArray } from './client';
import type { BufferChannelService } from './types';

let jpegBytes: Buffer;
let createdInputs: Array<Record<string, unknown>>;

function installFetchMock() {
  createdInputs = [];
  const mock = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = (init?.method ?? 'GET').toUpperCase();

    if (url.startsWith('https://api.buffer.com')) {
      const body = JSON.parse((init?.body as string) ?? '{}');
      if (/createPost/.test(body.query)) {
        createdInputs.push(body.variables.input);
        return Response.json({
          data: {
            createPost: {
              __typename: 'PostActionSuccess',
              post: {
                id: `id-${createdInputs.length}`,
                dueAt: body.variables.input.dueAt,
                channelId: body.variables.input.channelId,
                channelService: 'facebook',
              },
            },
          },
        });
      }
      return Response.json({ data: {} });
    }

    const headers = new Headers({
      'content-type': 'image/jpeg',
      'content-length': String(jpegBytes.length),
    });
    if (method === 'HEAD') return new Response(null, { status: 200, headers });
    return new Response(jpegBytes, { status: 200, headers });
  }) as unknown as typeof fetch;

  vi.stubGlobal('fetch', mock);
}

beforeEach(async () => {
  jpegBytes = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#224488' } })
    .jpeg()
    .toBuffer();
  installFetchMock();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function create(service: BufferChannelService) {
  return createScheduledBufferPost('test-key', {
    channelId: 'c'.repeat(24),
    channelService: service,
    text: 'Hello world\nMore body text',
    dueAt: '2026-06-28T10:00:00+01:00',
    url: 'https://testsite.com/blog/post-1',
    imageUrl: 'https://testsite.com/images/post-1.jpg',
    imageAlt: 'Post 1',
    feedId: 'testsite',
    siteUrl: 'https://testsite.com',
  });
}

describe('createScheduledBufferPost metadata', () => {
  it("attaches facebook { type: 'post' } metadata for Facebook channels", async () => {
    await create('facebook');
    expect(createdInputs).toHaveLength(1);
    const input = createdInputs[0] as { metadata?: { facebook?: { type?: string } } };
    expect(input.metadata).toEqual({ facebook: { type: 'post' } });
  });

  it('does not attach metadata for plain Twitter posts', async () => {
    await create('twitter');
    expect(createdInputs).toHaveLength(1);
    const input = createdInputs[0] as { metadata?: unknown };
    expect(input.metadata).toBeUndefined();
  });
});

describe('metricsFromPostMetricArray', () => {
  it('maps Buffer PostMetric type/value pairs to legacy counters', () => {
    expect(
      metricsFromPostMetricArray([
        { type: 'clicks', value: 3 },
        { type: 'impressions', value: 40 },
        { type: 'reactions', value: 5 },
        { type: 'comments', value: 2 },
      ]),
    ).toEqual({ clicks: 3, impressions: 40, reactions: 5, comments: 2 });
  });
});
