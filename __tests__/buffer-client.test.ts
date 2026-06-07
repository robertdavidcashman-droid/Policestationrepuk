import { afterEach, describe, expect, it, vi } from 'vitest';
import { BufferApiError, createScheduledBufferPost } from '@/lib/buffer/client';

describe('buffer client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a twitter post with customScheduled dueAt', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          createPost: {
            __typename: 'PostActionSuccess',
            post: {
              id: 'post-twitter',
              dueAt: '2026-06-08T10:00:00.000Z',
              channelId: 'tw-id',
              channelService: 'twitter',
            },
          },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const post = await createScheduledBufferPost('api-key', {
      channelId: 'tw-id',
      channelService: 'twitter',
      text: 'Hello\n\nhttps://policestationrepuk.org/Blog/example',
      dueAt: '2026-06-08T11:00:00+01:00',
      url: 'https://policestationrepuk.org/Blog/example',
    });

    expect(post.id).toBe('post-twitter');
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.variables.input.mode).toBe('customScheduled');
    expect(body.variables.input.schedulingType).toBe('automatic');
    expect(body.variables.input.metadata).toBeUndefined();
  });

  it('adds google business whats_new metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          createPost: {
            __typename: 'PostActionSuccess',
            post: {
              id: 'post-gb',
              dueAt: '2026-06-08T12:00:00.000Z',
              channelId: 'gb-id',
              channelService: 'googlebusiness',
            },
          },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await createScheduledBufferPost('api-key', {
      channelId: 'gb-id',
      channelService: 'googlebusiness',
      text: 'Title\n\nhttps://policestationrepuk.org/Blog/example',
      dueAt: '2026-06-08T13:00:00+01:00',
      url: 'https://policestationrepuk.org/Blog/example',
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.variables.input.metadata.google).toEqual({
      type: 'whats_new',
      detailsWhatsNew: {
        button: 'learn_more',
        link: 'https://policestationrepuk.org/Blog/example',
      },
    });
  });

  it('throws BufferApiError on GraphQL errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          errors: [{ message: 'Not authorized' }],
        }),
      }),
    );

    await expect(
      createScheduledBufferPost('bad-key', {
        channelId: 'tw-id',
        channelService: 'twitter',
        text: 'x',
        dueAt: '2026-06-08T10:00:00+01:00',
        url: 'https://example.com',
      }),
    ).rejects.toBeInstanceOf(BufferApiError);
  });

  it('throws BufferApiError on mutation failure union', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
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
      }),
    );

    await expect(
      createScheduledBufferPost('api-key', {
        channelId: 'tw-id',
        channelService: 'twitter',
        text: 'x',
        dueAt: '2020-01-01T10:00:00+00:00',
        url: 'https://example.com',
      }),
    ).rejects.toThrow(/dueAt is in the past/);
  });
});
