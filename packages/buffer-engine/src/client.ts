import type { BufferChannelService } from './types';
import { buildBufferImageAssets } from './assets';
import { sanitizeGoogleBusinessPostText } from './google-business-text';
import { assertBufferPostImageReady } from './image-url';

const BUFFER_API_URL = 'https://api.buffer.com';
const STATUS_LOOKUP_DELAY_MS = 400;
const GRAPHQL_MAX_RETRIES = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(message: string): boolean {
  return /too many requests/i.test(message);
}

function retryAfterMs(errors: BufferGraphQLError[] | undefined): number | null {
  for (const err of errors ?? []) {
    const retryAfter = (err.extensions as { retryAfter?: number } | undefined)?.retryAfter;
    if (typeof retryAfter === 'number' && retryAfter > 0) return retryAfter * 1000;
  }
  return null;
}

export interface BufferGraphQLError {
  message: string;
  extensions?: { code?: string };
}

type BufferMutationError = { __typename: string; message: string };

export class BufferApiError extends Error {
  constructor(
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'BufferApiError';
  }
}

async function bufferGraphql<T>(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  let lastError: BufferApiError | null = null;

  for (let attempt = 0; attempt <= GRAPHQL_MAX_RETRIES; attempt++) {
    const res = await fetch(BUFFER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = (await res.json()) as { data?: T; errors?: BufferGraphQLError[] };

    if (json.errors?.length) {
      const message = json.errors.map((e) => e.message).join('; ');
      const notFoundOnly = json.errors.every(
        (e) => (e.extensions as { code?: string } | undefined)?.code === 'NOT_FOUND',
      );
      if (notFoundOnly) throw new BufferApiError(message, json.errors);
      if (isRateLimitError(message) && attempt < GRAPHQL_MAX_RETRIES) {
        const waitMs = retryAfterMs(json.errors) ?? Math.min(60_000, 2000 * 2 ** attempt);
        await sleep(waitMs);
        continue;
      }
      throw new BufferApiError(message, json.errors);
    }

    if (!json.data) {
      lastError = new BufferApiError(`Buffer API returned no data (HTTP ${res.status})`, json);
      if (res.status === 429 && attempt < GRAPHQL_MAX_RETRIES) {
        const headerWait = Number(res.headers.get('retry-after'));
        await sleep(
          Number.isFinite(headerWait) && headerWait > 0
            ? headerWait * 1000
            : Math.min(60_000, 2000 * 2 ** attempt),
        );
        continue;
      }
      throw lastError;
    }

    return json.data;
  }

  throw lastError ?? new BufferApiError('Buffer API request failed after retries');
}

export interface CreatedBufferPost {
  id: string;
  dueAt: string | null;
  channelId: string;
  channelService: string;
  imageUrl?: string;
}

export interface BufferPostWithMetrics {
  id: string;
  text: string;
  status: string;
  dueAt: string | null;
  sentAt: string | null;
  createdAt: string;
  channelId: string;
  channelService: string;
  clicks?: number;
  impressions?: number;
  reactions?: number;
  comments?: number;
}

function postMetadataForService(service: BufferChannelService, url: string): Record<string, unknown> | undefined {
  if (service === 'googlebusiness') {
    return {
      google: {
        type: 'whats_new',
        detailsWhatsNew: { button: 'learn_more', link: url },
      },
    };
  }
  if (service === 'facebook') {
    return { facebook: { type: 'post' } };
  }
  return undefined;
}

export async function createScheduledBufferPost(
  apiKey: string,
  input: {
    channelId: string;
    channelService: BufferChannelService;
    text: string;
    dueAt: string;
    url: string;
    imageUrl?: string;
    imageAlt?: string;
    feedId?: string;
    siteUrl: string;
  },
): Promise<CreatedBufferPost> {
  const validatedImageUrl = await assertBufferPostImageReady(input.imageUrl, input.siteUrl, fetch, {
    channelService: input.channelService,
    feedId: input.feedId,
  });

  const metadata = postMetadataForService(input.channelService, input.url);
  const text =
    input.channelService === 'googlebusiness'
      ? sanitizeGoogleBusinessPostText(input.text)
      : input.text;
  const assets = buildBufferImageAssets({
    imageUrl: validatedImageUrl,
    imageAlt: input.imageAlt,
    title: input.text.split('\n')[0] ?? input.text,
  });

  const data = await bufferGraphql<{
    createPost:
      | { __typename: 'PostActionSuccess'; post: CreatedBufferPost }
      | BufferMutationError;
  }>(
    apiKey,
    `mutation CreateScheduledPost($input: CreatePostInput!) {
      createPost(input: $input) {
        __typename
        ... on PostActionSuccess {
          post { id dueAt channelId channelService }
        }
        ... on InvalidInputError { message }
        ... on UnauthorizedError { message }
        ... on UnexpectedError { message }
        ... on LimitReachedError { message }
        ... on NotFoundError { message }
      }
    }`,
    {
      input: {
        channelId: input.channelId,
        schedulingType: 'automatic',
        mode: 'customScheduled',
        dueAt: input.dueAt,
        text,
        assets,
        ...(metadata ? { metadata } : {}),
      },
    },
  );

  const result = data.createPost;
  if (result.__typename !== 'PostActionSuccess' || !('post' in result)) {
    const message = 'message' in result ? result.message : result.__typename;
    throw new BufferApiError(`createPost failed: ${message}`, result);
  }

  return { ...result.post, imageUrl: validatedImageUrl };
}

export async function listPostsInWindow(
  apiKey: string,
  organizationId: string,
  input: {
    status: Array<'scheduled' | 'sent' | 'error' | 'draft' | 'sending' | 'needs_approval'>;
    dueAtStart?: string;
    dueAtEnd?: string;
    createdAtStart?: string;
    channelIds?: string[];
    includeMetrics?: boolean;
  },
): Promise<BufferPostWithMetrics[]> {
  const posts: BufferPostWithMetrics[] = [];
  let after: string | undefined;

  const metricsFragment = input.includeMetrics
    ? `
      metrics {
        clicks
        impressions
        reactions
        comments
      }
    `
    : '';

  do {
    const data = await bufferGraphql<{
      posts: {
        edges: Array<{
          node: BufferPostWithMetrics & {
            metrics?: { clicks?: number; impressions?: number; reactions?: number; comments?: number };
          };
        }>;
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    }>(
      apiKey,
      `query ListPosts($input: PostsInput!, $first: Int!, $after: String) {
        posts(input: $input, first: $first, after: $after) {
          edges {
            node {
              id text status dueAt sentAt createdAt channelId channelService
              ${metricsFragment}
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      {
        first: 100,
        after,
        input: {
          organizationId,
          filter: {
            status: input.status,
            ...(input.dueAtStart || input.dueAtEnd
              ? { dueAt: { start: input.dueAtStart, end: input.dueAtEnd } }
              : {}),
            ...(input.createdAtStart ? { createdAt: { start: input.createdAtStart } } : {}),
            ...(input.channelIds?.length ? { channelIds: input.channelIds } : {}),
          },
        },
      },
    );

    for (const edge of data.posts.edges) {
      const node = edge.node;
      posts.push({
        ...node,
        clicks: node.metrics?.clicks ?? 0,
        impressions: node.metrics?.impressions ?? 0,
        reactions: node.metrics?.reactions ?? 0,
        comments: node.metrics?.comments ?? 0,
      });
    }

    after = data.posts.pageInfo.hasNextPage ? (data.posts.pageInfo.endCursor ?? undefined) : undefined;
  } while (after);

  return posts;
}

export async function getBufferPostById(
  apiKey: string,
  postId: string,
): Promise<{ id: string; dueAt: string | null; status: string; channelService: string } | null> {
  try {
    const data = await bufferGraphql<{
      post: { id: string; dueAt: string | null; status: string; channelService: string };
    }>(
      apiKey,
      `query GetPostStatus($input: PostInput!) {
        post(input: $input) { id dueAt status channelService }
      }`,
      { input: { id: postId } },
    );
    return data.post;
  } catch (err) {
    if (err instanceof BufferApiError && /not found/i.test(err.message)) return null;
    throw err;
  }
}

export async function deleteBufferPost(apiKey: string, postId: string): Promise<void> {
  const data = await bufferGraphql<{
    deletePost: { __typename: string; id?: string; message?: string };
  }>(
    apiKey,
    `mutation DeletePost($input: DeletePostInput!) {
      deletePost(input: $input) {
        __typename
        ... on DeletePostSuccess { id }
        ... on VoidMutationError { message }
      }
    }`,
    { input: { id: postId } },
  );

  if (data.deletePost.__typename !== 'DeletePostSuccess') {
    throw new BufferApiError(`deletePost failed: ${data.deletePost.message ?? data.deletePost.__typename}`);
  }
}

export { sleep, STATUS_LOOKUP_DELAY_MS };
