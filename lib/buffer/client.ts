import type { BufferChannelService } from './config';
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
    if (typeof retryAfter === 'number' && retryAfter > 0) {
      return retryAfter * 1000;
    }
  }
  return null;
}

export interface BufferGraphQLError {
  message: string;
  extensions?: { code?: string };
}

type BufferMutationError = {
  __typename: string;
  message: string;
};

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

    const json = (await res.json()) as {
      data?: T;
      errors?: BufferGraphQLError[];
    };

    if (json.errors?.length) {
      const message = json.errors.map((e) => e.message).join('; ');
      const notFoundOnly = json.errors.every(
        (e) => (e.extensions as { code?: string } | undefined)?.code === 'NOT_FOUND',
      );
      if (notFoundOnly) {
        throw new BufferApiError(message, json.errors);
      }
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
  /** Validated image URL sent to Buffer (JPEG for Google Business). */
  imageUrl?: string;
}

export interface BufferScheduledPostSummary {
  id: string;
  dueAt: string | null;
  channelId: string;
  channelService: string;
  text: string;
  allowedActions: string[];
  hasImage: boolean;
  /** First image asset URL attached to the post, when exposed by Buffer. */
  imageUrl?: string;
  /** MIME type reported by Buffer for the first image asset. */
  mimeType?: string | null;
}

function postMetadataForService(
  service: BufferChannelService,
  url: string,
): Record<string, unknown> | undefined {
  if (service === 'googlebusiness') {
    return {
      google: {
        type: 'whats_new',
        detailsWhatsNew: {
          button: 'learn_more',
          link: url,
        },
      },
    };
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
  },
): Promise<CreatedBufferPost> {
  const validatedImageUrl = await assertBufferPostImageReady(input.imageUrl, fetch, {
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
      | {
          __typename: 'PostActionSuccess';
          post: CreatedBufferPost;
        }
      | BufferMutationError;
  }>(
    apiKey,
    `mutation CreateScheduledPost($input: CreatePostInput!) {
      createPost(input: $input) {
        __typename
        ... on PostActionSuccess {
          post {
            id
            dueAt
            channelId
            channelService
          }
        }
        ... on InvalidInputError {
          message
        }
        ... on UnauthorizedError {
          message
        }
        ... on UnexpectedError {
          message
        }
        ... on LimitReachedError {
          message
        }
        ... on NotFoundError {
          message
        }
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

export async function listScheduledBufferPosts(
  apiKey: string,
  organizationId: string,
  input: {
    dueAtStart: string;
    dueAtEnd: string;
    channelIds?: string[];
  },
): Promise<BufferScheduledPostSummary[]> {
  const posts: BufferScheduledPostSummary[] = [];
  let after: string | undefined;

  do {
    const data = await bufferGraphql<{
      posts: {
        edges: Array<{
          node: {
            id: string;
            dueAt: string | null;
            channelId: string;
            channelService: string;
            text: string;
            allowedActions: string[];
            assets: Array<{ __typename?: string; source?: string; mimeType?: string | null }>;
          };
        }>;
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    }>(
      apiKey,
      `query ListScheduledPosts($input: PostsInput!, $first: Int!, $after: String) {
        posts(input: $input, first: $first, after: $after) {
          edges {
            node {
              id
              dueAt
              channelId
              channelService
              text
              allowedActions
              assets {
              __typename
              ... on ImageAsset {
                source
                mimeType
              }
            }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`,
      {
        first: 100,
        after,
        input: {
          organizationId,
          filter: {
            status: ['scheduled'],
            dueAt: { start: input.dueAtStart, end: input.dueAtEnd },
            ...(input.channelIds?.length ? { channelIds: input.channelIds } : {}),
          },
        },
      },
    );

    for (const edge of data.posts.edges) {
      const node = edge.node;
      const imageAsset = node.assets?.find((a) => a.source);
      posts.push({
        id: node.id,
        dueAt: node.dueAt,
        channelId: node.channelId,
        channelService: node.channelService,
        text: node.text,
        allowedActions: node.allowedActions ?? [],
        hasImage: (node.assets?.length ?? 0) > 0,
        imageUrl: imageAsset?.source,
        mimeType: imageAsset?.mimeType ?? null,
      });
    }

    after = data.posts.pageInfo.hasNextPage ? (data.posts.pageInfo.endCursor ?? undefined) : undefined;
  } while (after);

  return posts;
}

export interface BufferPostStatusSummary {
  id: string;
  dueAt: string | null;
  status: string;
  channelService: string;
}

/** Look up a single post by id (cheap vs paginating the whole org). */
export async function getBufferPostById(
  apiKey: string,
  postId: string,
): Promise<BufferPostStatusSummary | null> {
  try {
    const data = await bufferGraphql<{
      post: {
        id: string;
        dueAt: string | null;
        status: string;
        channelService: string;
      };
    }>(
      apiKey,
      `query GetPostStatus($input: PostInput!) {
        post(input: $input) {
          id
          dueAt
          status
          channelService
        }
      }`,
      { input: { id: postId } },
    );
    return {
      id: data.post.id,
      dueAt: data.post.dueAt,
      status: data.post.status,
      channelService: data.post.channelService,
    };
  } catch (err) {
    if (err instanceof BufferApiError) {
      const notFound = Array.isArray(err.details)
        && err.details.some(
          (e) => (e as BufferGraphQLError).extensions?.code === 'NOT_FOUND',
        );
      if (notFound || /post not found/i.test(err.message)) {
        return null;
      }
    }
    throw err;
  }
}

/** Fetch status for specific post IDs (one lookup per id; avoids org-wide pagination rate limits). */
export async function fetchBufferPostStatusMap(
  apiKey: string,
  _organizationId: string,
  postIds: string[],
): Promise<Map<string, BufferPostStatusSummary>> {
  const found = new Map<string, BufferPostStatusSummary>();
  const unique = [...new Set(postIds)];
  if (unique.length === 0) return found;

  for (let i = 0; i < unique.length; i++) {
    if (i > 0) await sleep(STATUS_LOOKUP_DELAY_MS);
    const post = await getBufferPostById(apiKey, unique[i]);
    if (post) found.set(post.id, post);
  }

  return found;
}

export async function deleteBufferPost(apiKey: string, postId: string): Promise<void> {
  const data = await bufferGraphql<{
    deletePost:
      | { __typename: 'DeletePostSuccess'; id: string }
      | BufferMutationError;
  }>(
    apiKey,
    `mutation DeletePost($input: DeletePostInput!) {
      deletePost(input: $input) {
        __typename
        ... on DeletePostSuccess {
          id
        }
        ... on VoidMutationError {
          message
        }
      }
    }`,
    { input: { id: postId } },
  );

  const result = data.deletePost;
  if (result.__typename !== 'DeletePostSuccess') {
    const message = 'message' in result ? result.message : result.__typename;
    throw new BufferApiError(`deletePost failed: ${message}`, result);
  }
}
