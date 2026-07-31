"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIRM_SEND_COOLDOWN_DAYS = exports.FOLLOWUP_DAY_2 = exports.FOLLOWUP_DAY_1 = exports.DEFAULT_EMAIL_JOB_LEASE_SECONDS = exports.DEFAULT_EMAIL_JOB_MAX_ATTEMPTS = exports.EMAIL_JOB_CLAIMABLE_STATUSES = exports.EMAIL_JOB_TERMINAL_STATUSES = void 0;
exports.buildOutreachIdempotencyKey = buildOutreachIdempotencyKey;
exports.sequenceStepOf = sequenceStepOf;
exports.daysSince = daysSince;
exports.dueForFollowUp = dueForFollowUp;
exports.nextOutreachStep = nextOutreachStep;
exports.retryDelayMs = retryDelayMs;
exports.classifyProviderError = classifyProviderError;
exports.isRetryableProviderError = isRetryableProviderError;
const node_crypto_1 = require("node:crypto");
const normalize_1 = require("./normalize");
exports.EMAIL_JOB_TERMINAL_STATUSES = new Set([
    'accepted',
    'delivered',
    'bounced',
    'complained',
    'unsubscribed',
    'suppressed',
    'permanently_failed',
]);
exports.EMAIL_JOB_CLAIMABLE_STATUSES = new Set([
    'pending',
    'retry_scheduled',
]);
exports.DEFAULT_EMAIL_JOB_MAX_ATTEMPTS = 5;
exports.DEFAULT_EMAIL_JOB_LEASE_SECONDS = 120;
exports.FOLLOWUP_DAY_1 = 7;
exports.FOLLOWUP_DAY_2 = 21;
exports.FIRM_SEND_COOLDOWN_DAYS = 90;
function buildOutreachIdempotencyKey(campaignId, email, sequenceStep) {
    const normalized = (0, normalize_1.normalizeEmail)(email);
    const material = `${campaignId.trim().toLowerCase()}|${normalized}|${sequenceStep}`;
    return (0, node_crypto_1.createHash)('sha256').update(material).digest('hex').slice(0, 40);
}
function sequenceStepOf(prospect) {
    const n = prospect.sequenceStep;
    return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}
function daysSince(iso, nowMs = Date.now()) {
    if (!iso)
        return Infinity;
    const t = Date.parse(iso);
    if (!Number.isFinite(t))
        return Infinity;
    return (nowMs - t) / (1000 * 60 * 60 * 24);
}
function dueForFollowUp(prospect, nowMs = Date.now()) {
    if (prospect.waLinkClickedAt || prospect.joinedWhatsAppAt)
        return false;
    if (!prospect.lastEmailAt)
        return prospect.status === 'ready_to_send';
    const step = sequenceStepOf(prospect);
    const days = daysSince(prospect.lastEmailAt, nowMs);
    if (step === 0 && days >= exports.FOLLOWUP_DAY_1)
        return true;
    if (step === 1 && days >= exports.FOLLOWUP_DAY_2 - exports.FOLLOWUP_DAY_1)
        return true;
    return false;
}
/**
 * Next sequence step for a prospect, or null when nothing is due.
 * Treats missing sequenceStep as 0 (legacy KV rows).
 */
function nextOutreachStep(prospect, nowMs = Date.now()) {
    const step = sequenceStepOf(prospect);
    if (prospect.status === 'ready_to_send' && step === 0 && !prospect.lastEmailAt) {
        return 0;
    }
    // Stale ready+lastEmailAt: treat as sent for follow-up scheduling.
    const effectivelySent = prospect.status === 'sent' ||
        (prospect.status === 'ready_to_send' && Boolean(prospect.lastEmailAt));
    if (effectivelySent && step === 0 && dueForFollowUp(prospect, nowMs))
        return 1;
    if (effectivelySent && step === 1 && dueForFollowUp(prospect, nowMs))
        return 2;
    return null;
}
/** Exponential backoff with full jitter. attempt is 1-based. */
function retryDelayMs(attempt, opts) {
    const base = opts?.baseMs ?? 30000;
    const max = opts?.maxMs ?? 6 * 60 * 60 * 1000;
    const exp = Math.min(max, base * 2 ** Math.max(0, attempt - 1));
    return Math.floor(Math.random() * (exp + 1));
}
function classifyProviderError(error, statusCode) {
    if (statusCode != null) {
        if ([408, 409, 425, 429, 500, 502, 503, 504].includes(statusCode))
            return 'transient';
        if (statusCode === 401 || statusCode === 403)
            return 'permanent';
        if (statusCode >= 400 && statusCode < 500)
            return 'permanent';
    }
    if (!error)
        return 'unknown';
    const m = error.toLowerCase();
    if (m.includes('429') ||
        m.includes('rate limit') ||
        m.includes('too many requests') ||
        m.includes('timeout') ||
        m.includes('timed out') ||
        m.includes('econnreset') ||
        m.includes('econnrefused') ||
        m.includes('enotfound') ||
        m.includes('dns') ||
        m.includes('network') ||
        m.includes('temporarily') ||
        m.includes('try again') ||
        m.includes('503') ||
        m.includes('502') ||
        m.includes('500') ||
        m.includes('504') ||
        m.includes('408') ||
        m.includes('425')) {
        return 'transient';
    }
    if (m.includes('invalid') ||
        m.includes('bounce') ||
        m.includes('not verified') ||
        m.includes('unsubscribed') ||
        m.includes('complaint') ||
        m.includes('suppressed') ||
        m.includes('forbidden') ||
        m.includes('unauthorized') ||
        m.includes('validation') ||
        m.includes('no_email') ||
        m.includes('no_resend') ||
        m.includes('no_message_id')) {
        return 'permanent';
    }
    return 'unknown';
}
function isRetryableProviderError(error, statusCode) {
    return classifyProviderError(error, statusCode) === 'transient';
}
