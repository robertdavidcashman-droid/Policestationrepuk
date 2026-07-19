"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOutreachEnv = validateOutreachEnv;
function hasKvCreds() {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim() || '';
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim() || '';
    return Boolean(url && token);
}
/**
 * Loud fail helper for cron routes — lists missing production config.
 * FROM/DIGEST are warnings only: runtime already falls back to
 * `PoliceStationRepUK <noreply@policestationrepuk.org>` and a digest default.
 */
function validateOutreachEnv(opts) {
    const errors = [];
    const warnings = [];
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
        warnings.push('FIRM_OUTREACH_DIGEST_EMAIL unset — using code fallback for operator notifications');
    }
    if (!process.env.FIRM_OUTREACH_FROM_EMAIL?.trim()) {
        warnings.push('FIRM_OUTREACH_FROM_EMAIL unset — using PoliceStationRepUK <noreply@policestationrepuk.org>');
    }
    return { ok: errors.length === 0, errors, warnings };
}
