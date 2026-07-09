"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RESEND_DAILY_LIMIT = exports.DEFAULT_RESEND_HEADROOM = exports.RESEND_COUNT_KEY_PREFIX = void 0;
exports.resendQuotaKey = resendQuotaKey;
exports.resendDailyLimit = resendDailyLimit;
exports.resendDailyHeadroom = resendDailyHeadroom;
exports.resendOutreachBudget = resendOutreachBudget;
exports.resendQuotaRemaining = resendQuotaRemaining;
exports.isTransientResendError = isTransientResendError;
exports.isPermanentResendError = isPermanentResendError;
exports.DEFAULT_RESEND_DAILY_LIMIT = 100;
exports.DEFAULT_RESEND_HEADROOM = 10;
exports.RESEND_COUNT_KEY_PREFIX = 'firmoutreach:resend:count:';
function resendQuotaKey(utcDate) {
    return `${exports.RESEND_COUNT_KEY_PREFIX}${utcDate}`;
}
function resendDailyLimit() {
    return (Number(process.env.FIRM_OUTREACH_RESEND_DAILY_LIMIT ?? exports.DEFAULT_RESEND_DAILY_LIMIT) ||
        exports.DEFAULT_RESEND_DAILY_LIMIT);
}
function resendDailyHeadroom() {
    return (Number(process.env.FIRM_OUTREACH_RESEND_HEADROOM ?? exports.DEFAULT_RESEND_HEADROOM) ||
        exports.DEFAULT_RESEND_HEADROOM);
}
function resendOutreachBudget() {
    return Math.max(0, resendDailyLimit() - resendDailyHeadroom());
}
function resendQuotaRemaining(count) {
    return Math.max(0, resendOutreachBudget() - count);
}
function isTransientResendError(error) {
    if (!error)
        return false;
    const m = error.toLowerCase();
    if (m.includes('429') || m.includes('rate limit') || m.includes('too many requests')) {
        return true;
    }
    if (m.includes('timeout') ||
        m.includes('503') ||
        m.includes('502') ||
        m.includes('500') ||
        m.includes('econnreset') ||
        m.includes('network')) {
        return true;
    }
    return false;
}
function isPermanentResendError(error) {
    if (!error)
        return false;
    const m = error.toLowerCase();
    if (isTransientResendError(error))
        return false;
    if (m.includes('invalid') || m.includes('bounce') || m.includes('not verified')) {
        return true;
    }
    if (m.includes('validation') || m.includes('forbidden') || m.includes('unauthorized')) {
        return true;
    }
    return m.includes('4') && !m.includes('429');
}
