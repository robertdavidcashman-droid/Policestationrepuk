import type { BufferChannelService } from './config';
import { buildBufferImageAssets } from './assets';
import { assertBufferPostImageReady } from './image-url';

const BUFFER_API_URL = 'https://api.buffer.com';

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
    throw new BufferApiError(json.errors.map((e) => e.message).join('; '), json.errors);
  }

  if (!json.data) {
    throw new BufferApiError(`Buffer API returned no data (HTTP ${res.status})`, json);
  }

  return json.data;
}

export interface CreatedBufferPost {
  id: string;
  dueAt: string | null;
  channelId: string;
  channelService: string;
}

export interface BufferScheduledPostSummary {
  id: string;
  dueAt: string | null;
  channelId: string;
  channelService: string;
  text: string;
  allowedActions: string[];
  hasImage: boolean;
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
  },
): Promise<CreatedBufferPost> {
  const validatedImageUrl = await assertBufferPostImageReady(input.imageUrl, fetch, {
    channelService: input.channelService,
  });

  const metadata = postMetadataForService(input.channelService, input.url);
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
        text: input.text,
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

  return result.post;
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
            assets: Array<{ __typename?: string }>;
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
      posts.push({
        id: node.id,
        dueAt: node.dueAt,
        channelId: node.channelId,
        channelService: node.channelService,
        text: node.text,
        allowedActions: node.allowedActions ?? [],
        hasImage: (node.assets?.length ?? 0) > 0,
      });
    }

    after = data.posts.pageInfo.hasNextPage ? (data.posts.pageInfo.endCursor ?? undefined) : undefined;
  } while (after);

  return posts;
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
