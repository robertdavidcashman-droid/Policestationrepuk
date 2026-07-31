"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESEND_COUNT_KEY_PREFIX = exports.DEFAULT_RESEND_HEADROOM = exports.DEFAULT_RESEND_DAILY_LIMIT = void 0;
exports.resendQuotaKey = resendQuotaKey;
exports.resendDailyLimit = resendDailyLimit;
exports.resendDailyHeadroom = resendDailyHeadroom;
exports.resendOutreachBudget = resendOutreachBudget;
exports.resendQuotaRemaining = resendQuotaRemaining;
exports.isTransientResendError = isTransientResendError;
exports.isPermanentResendError = isPermanentResendError;
/** Shared Resend free-tier ceiling — both workspaces share one API key. */
exports.DEFAULT_RESEND_DAILY_LIMIT = 100;
/** Headroom reserved for login codes, digests, Kent corrections, etc. */
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
/** Effective outreach budget across both sites for a UTC day. */
function resendOutreachBudget() {
    return Math.max(0, resendDailyLimit() - resendDailyHeadroom());
}
function resendQuotaRemaining(count) {
    return Math.max(0, resendOutreachBudget() - count);
}
const email_jobs_1 = require("./email-jobs");
function isTransientResendError(error, statusCode) {
    return (0, email_jobs_1.classifyProviderError)(error, statusCode) === 'transient';
}
function isPermanentResendError(error, statusCode) {
    return (0, email_jobs_1.classifyProviderError)(error, statusCode) === 'permanent';
}
