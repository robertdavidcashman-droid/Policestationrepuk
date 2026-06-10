import { afterEach, describe, expect, it, vi } from 'vitest';
import { BufferApiError, createScheduledBufferPost } from '@/lib/buffer/client';

function mockImageProbeHeaders() {
  return new Headers({
    'content-type': 'image/webp',
    'content-length': '5000',
  });
}

function mockBufferCreateSuccess(post: {
  id: string;
  dueAt: string;
  channelId: string;
  channelService: string;
}) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      data: {
        createPost: {
          __typename: 'PostActionSuccess',
          post,
        },
      },
    }),
  };
}

function stubFetchWithImageProbe(
  bufferResponse: ReturnType<typeof mockBufferCreateSuccess>,
  imageUrl = 'https://example.com/hero.webp',
) {
  const fetchMock = vi.fn().mockImplementation(async (url: string) => {
    if (String(url).includes('api.buffer.com')) {
      return bufferResponse;
    }
    if (String(url) === imageUrl) {
      return {
        ok: true,
        status: 200,
        headers: mockImageProbeHeaders(),
      };
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('buffer client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects posts without a blog image URL before calling Buffer', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createScheduledBufferPost('api-key', {
        channelId: 'tw-id',
        channelService: 'twitter',
        text: 'Hello\n\nhttps://policestationrepuk.org/Blog/example',
        dueAt: '2026-06-08T11:00:00+01:00',
        url: 'https://policestationrepuk.org/Blog/example',
      }),
    ).rejects.toThrow(/requires a blog image URL/i);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects oversized images before calling Buffer', async () => {
    const imageUrl = 'https://example.com/huge.jpg';
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (String(url) === imageUrl) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({
            'content-type': 'image/jpeg',
            'content-length': String(6 * 1024 * 1024),
          }),
        };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createScheduledBufferPost('api-key', {
        channelId: 'tw-id',
        channelService: 'twitter',
        text: 'Hello\n\nhttps://example.com/post',
        dueAt: '2026-06-08T11:00:00+01:00',
        url: 'https://example.com/post',
        imageUrl,
      }),
    ).rejects.toThrow(/too large/i);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(imageUrl);
  });

  it('creates a twitter post with customScheduled dueAt after image validation', async () => {
    const imageUrl = 'https://policestationrepuk.org/images/blog/hero.webp';
    const fetchMock = stubFetchWithImageProbe(
      mockBufferCreateSuccess({
        id: 'post-twitter',
        dueAt: '2026-06-08T10:00:00.000Z',
        channelId: 'tw-id',
        channelService: 'twitter',
      }),
      imageUrl,
    );

    const post = await createScheduledBufferPost('api-key', {
      channelId: 'tw-id',
      channelService: 'twitter',
      text: 'Hello\n\nhttps://policestationrepuk.org/Blog/example',
      dueAt: '2026-06-08T11:00:00+01:00',
      url: 'https://policestationrepuk.org/Blog/example',
      imageUrl,
    });

    expect(post.id).toBe('post-twitter');
    const bufferCall = fetchMock.mock.calls.find((c) => String(c[0]).includes('api.buffer.com'));
    const body = JSON.parse(String(bufferCall?.[1]?.body));
    expect(body.variables.input.mode).toBe('customScheduled');
    expect(body.variables.input.schedulingType).toBe('automatic');
    expect(body.variables.input.metadata).toBeUndefined();
    expect(body.variables.input.assets).toEqual([
      {
        image: {
          url: imageUrl,
          metadata: { altText: 'Hello' },
        },
      },
    ]);
  });

  it('sends image assets when imageUrl is provided', async () => {
    const imageUrl = 'https://example.com/hero.webp';
    const fetchMock = stubFetchWithImageProbe(
      mockBufferCreateSuccess({
        id: 'post-image',
        dueAt: '2026-06-08T10:00:00.000Z',
        channelId: 'li-id',
        channelService: 'linkedin',
      }),
      imageUrl,
    );

    await createScheduledBufferPost('api-key', {
      channelId: 'li-id',
      channelService: 'linkedin',
      text: 'Title\n\nhttps://example.com/post',
      dueAt: '2026-06-08T11:00:00+01:00',
      url: 'https://example.com/post',
      imageUrl,
      imageAlt: 'Hero alt',
    });

    const bufferCall = fetchMock.mock.calls.find((c) => String(c[0]).includes('api.buffer.com'));
    const body = JSON.parse(String(bufferCall?.[1]?.body));
    expect(body.variables.input.assets).toEqual([
      {
        image: {
          url: imageUrl,
          metadata: { altText: 'Hero alt' },
        },
      },
    ]);
  });

  it('adds google business whats_new metadata and uses jpeg not webp', async () => {
    const imageUrl = 'https://policestationrepuk.org/images/blog/raster/hero.webp';
    const jpegUrl = 'https://policestationrepuk.org/images/blog/raster/hero.jpg';
    const fetchMock = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (String(url).includes('api.buffer.com')) {
        return mockBufferCreateSuccess({
          id: 'post-gb',
          dueAt: '2026-06-08T12:00:00.000Z',
          channelId: 'gb-id',
          channelService: 'googlebusiness',
        });
      }
      const range =
        init?.headers instanceof Headers
          ? init.headers.get('Range')
          : (init?.headers as Record<string, string> | undefined)?.Range;
      if (range) {
        return {
          ok: true,
          status: 206,
          headers: new Headers({ 'content-type': 'image/jpeg' }),
          arrayBuffer: async () => new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer.slice(0),
        };
      }
      if (String(url) === jpegUrl) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'image/jpeg', 'content-length': '12000' }),
        };
      }
      if (String(url) === imageUrl) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'image/webp', 'content-length': '5000' }),
        };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await createScheduledBufferPost('api-key', {
      channelId: 'gb-id',
      channelService: 'googlebusiness',
      text: 'Title\n\nhttps://policestationrepuk.org/Blog/example',
      dueAt: '2026-06-08T13:00:00+01:00',
      url: 'https://policestationrepuk.org/Blog/example',
      imageUrl,
      feedId: 'policestationrepuk',
    });

    const bufferCall = fetchMock.mock.calls.find((c) => String(c[0]).includes('api.buffer.com'));
    const body = JSON.parse(String(bufferCall?.[1]?.body));
    expect(body.variables.input.assets[0].image.url).toBe(jpegUrl);
    expect(body.variables.input.metadata.google).toEqual({
      type: 'whats_new',
      detailsWhatsNew: {
        button: 'learn_more',
        link: 'https://policestationrepuk.org/Blog/example',
      },
    });
  });

  it('throws BufferApiError on GraphQL errors', async () => {
    const imageUrl = 'https://example.com/hero.webp';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        if (String(url).includes('api.buffer.com')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              errors: [{ message: 'Not authorized' }],
            }),
          };
        }
        return { ok: true, status: 200, headers: mockImageProbeHeaders() };
      }),
    );

    await expect(
      createScheduledBufferPost('bad-key', {
        channelId: 'tw-id',
        channelService: 'twitter',
        text: 'x',
        dueAt: '2026-06-08T10:00:00+01:00',
        url: 'https://example.com',
        imageUrl,
      }),
    ).rejects.toBeInstanceOf(BufferApiError);
  });

  it('throws BufferApiError on mutation failure union', async () => {
    const imageUrl = 'https://example.com/hero.webp';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        if (String(url).includes('api.buffer.com')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              data: {
                createPost: {
                  __typename: 'InvalidInputError',
                  message: 'dueAt is in the past',
                },
              },
            }),
          };
        }
        return { ok: true, status: 200, headers: mockImageProbeHeaders() };
      }),
    );

    await expect(
      createScheduledBufferPost('api-key', {
        channelId: 'tw-id',
        channelService: 'twitter',
        text: 'x',
        dueAt: '2020-01-01T10:00:00+00:00',
        url: 'https://example.com',
        imageUrl,
      }),
    ).rejects.toThrow(/dueAt is in the past/);
  });
});
