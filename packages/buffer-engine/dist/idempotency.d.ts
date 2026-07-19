import type { BufferKV } from './types';
export declare function bufferPostIdempotencyKey(input: {
    siteId: string;
    date: string;
    channelId: string;
    slug: string;
}): string;
/**
 * Claim a post-level idempotency key. Returns existing postId if already claimed.
 * Fail-open when KV is unavailable (scheduler day-lock still protects overlaps).
 */
export declare function claimBufferPostIdempotency(kv: BufferKV | null | undefined, key: string, value: string): Promise<{
    claimed: boolean;
    existingPostId: string | null;
}>;
export declare function finalizeBufferPostIdempotency(kv: BufferKV | null | undefined, key: string, postId: string): Promise<void>;
//# sourceMappingURL=idempotency.d.ts.map