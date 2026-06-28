"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATUS_LOOKUP_DELAY_MS = exports.BufferApiError = void 0;
exports.createScheduledBufferPost = createScheduledBufferPost;
exports.listPostsInWindow = listPostsInWindow;
exports.getBufferPostById = getBufferPostById;
exports.deleteBufferPost = deleteBufferPost;
exports.sleep = sleep;
const assets_1 = require("./assets");
const google_business_text_1 = require("./google-business-text");
const image_url_1 = require("./image-url");
const BUFFER_API_URL = 'https://api.buffer.com';
const STATUS_LOOKUP_DELAY_MS = 400;
exports.STATUS_LOOKUP_DELAY_MS = STATUS_LOOKUP_DELAY_MS;
const GRAPHQL_MAX_RETRIES = 5;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function isRateLimitError(message) {
    return /too many requests/i.test(message);
}
function retryAfterMs(errors) {
    for (const err of errors ?? []) {
        const retryAfter = err.extensions?.retryAfter;
        if (typeof retryAfter === 'number' && retryAfter > 0)
            return retryAfter * 1000;
    }
    return null;
}
class BufferApiError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'BufferApiError';
    }
}
exports.BufferApiError = BufferApiError;
async function bufferGraphql(apiKey, query, variables) {
    let lastError = null;
    for (let attempt = 0; attempt <= GRAPHQL_MAX_RETRIES; attempt++) {
        const res = await fetch(BUFFER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ query, variables }),
        });
        const json = (await res.json());
        if (json.errors?.length) {
            const message = json.errors.map((e) => e.message).join('; ');
            const notFoundOnly = json.errors.every((e) => e.extensions?.code === 'NOT_FOUND');
            if (notFoundOnly)
                throw new BufferApiError(message, json.errors);
            if (isRateLimitError(message) && attempt < GRAPHQL_MAX_RETRIES) {
                const waitMs = retryAfterMs(json.errors) ?? Math.min(60000, 2000 * 2 ** attempt);
                await sleep(waitMs);
                continue;
            }
            throw new BufferApiError(message, json.errors);
        }
        if (!json.data) {
            lastError = new BufferApiError(`Buffer API returned no data (HTTP ${res.status})`, json);
            if (res.status === 429 && attempt < GRAPHQL_MAX_RETRIES) {
                const headerWait = Number(res.headers.get('retry-after'));
                await sleep(Number.isFinite(headerWait) && headerWait > 0
                    ? headerWait * 1000
                    : Math.min(60000, 2000 * 2 ** attempt));
                continue;
            }
            throw lastError;
        }
        return json.data;
    }
    throw lastError ?? new BufferApiError('Buffer API request failed after retries');
}
function postMetadataForService(service, url) {
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
async function createScheduledBufferPost(apiKey, input) {
    const validatedImageUrl = await (0, image_url_1.assertBufferPostImageReady)(input.imageUrl, input.siteUrl, fetch, {
        channelService: input.channelService,
        feedId: input.feedId,
    });
    const metadata = postMetadataForService(input.channelService, input.url);
    const text = input.channelService === 'googlebusiness'
        ? (0, google_business_text_1.sanitizeGoogleBusinessPostText)(input.text)
        : input.text;
    const assets = (0, assets_1.buildBufferImageAssets)({
        imageUrl: validatedImageUrl,
        imageAlt: input.imageAlt,
        title: input.text.split('\n')[0] ?? input.text,
    });
    const data = await bufferGraphql(apiKey, `mutation CreateScheduledPost($input: CreatePostInput!) {
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
    }`, {
        input: {
            channelId: input.channelId,
            schedulingType: 'automatic',
            mode: 'customScheduled',
            dueAt: input.dueAt,
            text,
            assets,
            ...(metadata ? { metadata } : {}),
        },
    });
    const result = data.createPost;
    if (result.__typename !== 'PostActionSuccess' || !('post' in result)) {
        const message = 'message' in result ? result.message : result.__typename;
        throw new BufferApiError(`createPost failed: ${message}`, result);
    }
    return { ...result.post, imageUrl: validatedImageUrl };
}
async function listPostsInWindow(apiKey, organizationId, input) {
    const posts = [];
    let after;
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
        const data = await bufferGraphql(apiKey, `query ListPosts($input: PostsInput!, $first: Int!, $after: String) {
        posts(input: $input, first: $first, after: $after) {
          edges {
            node {
              id text status dueAt sentAt createdAt channelId channelService
              ${metricsFragment}
            }
          }
          pageInfo { hasNextPage endCursor }
        }
      }`, {
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
        });
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
async function getBufferPostById(apiKey, postId) {
    try {
        const data = await bufferGraphql(apiKey, `query GetPostStatus($input: PostInput!) {
        post(input: $input) { id dueAt status channelService }
      }`, { input: { id: postId } });
        return data.post;
    }
    catch (err) {
        if (err instanceof BufferApiError && /not found/i.test(err.message))
            return null;
        throw err;
    }
}
async function deleteBufferPost(apiKey, postId) {
    const data = await bufferGraphql(apiKey, `mutation DeletePost($input: DeletePostInput!) {
      deletePost(input: $input) {
        __typename
        ... on DeletePostSuccess { id }
        ... on VoidMutationError { message }
      }
    }`, { input: { id: postId } });
    if (data.deletePost.__typename !== 'DeletePostSuccess') {
        throw new BufferApiError(`deletePost failed: ${data.deletePost.message ?? data.deletePost.__typename}`);
    }
}
