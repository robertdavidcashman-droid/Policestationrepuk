"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferPostIdempotencyKey = bufferPostIdempotencyKey;
exports.claimBufferPostIdempotency = claimBufferPostIdempotency;
exports.finalizeBufferPostIdempotency = finalizeBufferPostIdempotency;
const IDEM_PREFIX = 'buffer-engine:idem:';
const IDEM_TTL = 60 * 60 * 24 * 45;
function bufferPostIdempotencyKey(input) {
    return `${input.siteId}|${input.date}|${input.channelId}|${input.slug}`;
}
/**
 * Claim a post-level idempotency key. Returns existing postId if already claimed.
 * Fail-open when KV is unavailable (scheduler day-lock still protects overlaps).
 */
async function claimBufferPostIdempotency(kv, key, value) {
    if (!kv)
        return { claimed: true, existingPostId: null };
    const fullKey = `${IDEM_PREFIX}${key}`;
    const result = await kv.set(fullKey, value, { nx: true, ex: IDEM_TTL });
    if (result === 'OK') {
        return { claimed: true, existingPostId: null };
    }
    const existing = await kv.get(fullKey);
    return { claimed: false, existingPostId: existing ?? null };
}
async function finalizeBufferPostIdempotency(kv, key, postId) {
    if (!kv)
        return;
    await kv.set(`${IDEM_PREFIX}${key}`, postId, { ex: IDEM_TTL });
}
