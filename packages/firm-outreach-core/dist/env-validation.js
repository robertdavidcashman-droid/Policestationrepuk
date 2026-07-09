"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOutreachEnv = validateOutreachEnv;
function hasKvCreds() {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim() || '';
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim() || '';
    return Boolean(url && token);
}
function validateOutreachEnv(opts) {
    const errors = [];
    if (!process.env.RESEND_API_KEY?.trim()) {
        errors.push('RESEND_API_KEY missing');
    }
    if (!hasKvCreds()) {
        errors.push('UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_*) missing');
    }
    if (opts?.requireCronSecret && !process.env.CRON_SECRET?.trim()) {
        errors.push('CRON_SECRET missing');
    }
    const digest = process.env.FIRM_OUTREACH_DIGEST_EMAIL?.trim() ||
        process.env.BUFFER_SCHEDULER_NOTIFY_EMAIL?.trim() ||
        process.env.OWNER_EMAIL?.trim();
    if (!digest) {
        errors.push('FIRM_OUTREACH_DIGEST_EMAIL (or BUFFER_SCHEDULER_NOTIFY_EMAIL / OWNER_EMAIL) missing');
    }
    if (!process.env.FIRM_OUTREACH_FROM_EMAIL?.trim()) {
        errors.push('FIRM_OUTREACH_FROM_EMAIL missing (recommended for outreach + digest FROM)');
    }
    return { ok: errors.length === 0, errors };
}
