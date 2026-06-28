"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNonFirmEmailDomain = isNonFirmEmailDomain;
exports.isPlausibleOutreachEmail = isPlausibleOutreachEmail;
exports.isValidEmailFormat = isValidEmailFormat;
exports.hasMxRecord = hasMxRecord;
exports.validateEmailForSend = validateEmailForSend;
exports.isFreeEmailDomain = isFreeEmailDomain;
const promises_1 = __importDefault(require("dns/promises"));
const shared_constants_1 = require("../shared-constants");
const normalize_1 = require("../normalize");
const RFC5322 = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const DISPOSABLE_DOMAINS = new Set([
    'mailinator.com',
    'guerrillamail.com',
    'tempmail.com',
    'yopmail.com',
]);
const JUNK_EMAIL_DOMAIN_PATTERNS = [
    /sentry-next\.wixpress\.com$/i,
    /sentry\.wixpress\.com$/i,
    /\.wixpress\.com$/i,
    /sentry\.io$/i,
    /cloudflare\.com$/i,
    /\.(png|jpe?g|gif|webp|svg)$/i,
    /\.cjsm\.net$/i,
    /\.gsx\.gov\.uk$/i,
    /(^|\.)gov\.uk$/i,
];
const JUNK_EMAIL_LOCAL_PATTERNS = [/\.(png|jpe?g|gif|webp|svg)$/i, /\[email/i];
/** True when the email's (registrable) domain is a known non-firm third party. */
function isNonFirmEmailDomain(email) {
    const domain = (0, normalize_1.normalizeEmail)(email).split('@')[1];
    if (!domain)
        return false;
    if (shared_constants_1.NON_FIRM_EMAIL_DOMAINS.has(domain))
        return true;
    const registrable = (0, normalize_1.registrableDomain)(domain);
    return registrable ? shared_constants_1.NON_FIRM_EMAIL_DOMAINS.has(registrable) : false;
}
/** Reject obvious crawler artefacts before MX lookup. */
function isPlausibleOutreachEmail(email) {
    const norm = (0, normalize_1.normalizeEmail)(email);
    if (!isValidEmailFormat(norm))
        return false;
    const [local, domain] = norm.split('@');
    if (!local || !domain)
        return false;
    if (JUNK_EMAIL_LOCAL_PATTERNS.some((re) => re.test(local)))
        return false;
    if (JUNK_EMAIL_DOMAIN_PATTERNS.some((re) => re.test(domain)))
        return false;
    if (shared_constants_1.OPERATOR_OUTREACH_EMAILS.has(norm))
        return false;
    if (isNonFirmEmailDomain(norm))
        return false;
    return true;
}
function isValidEmailFormat(email) {
    const norm = (0, normalize_1.normalizeEmail)(email);
    return norm.length <= 320 && RFC5322.test(norm);
}
async function hasMxRecord(email) {
    const domain = (0, normalize_1.normalizeEmail)(email).split('@')[1];
    if (!domain || DISPOSABLE_DOMAINS.has(domain))
        return false;
    try {
        const mx = await promises_1.default.resolveMx(domain);
        return mx.length > 0;
    }
    catch {
        return false;
    }
}
async function validateEmailForSend(email) {
    if (!isPlausibleOutreachEmail(email))
        return { ok: false, reason: 'invalid_format' };
    const domain = (0, normalize_1.normalizeEmail)(email).split('@')[1];
    if (DISPOSABLE_DOMAINS.has(domain))
        return { ok: false, reason: 'disposable_domain' };
    if (!(await hasMxRecord(email)))
        return { ok: false, reason: 'no_mx' };
    return { ok: true };
}
function isFreeEmailDomain(email) {
    const domain = (0, normalize_1.normalizeEmail)(email).split('@')[1];
    return shared_constants_1.FREE_EMAIL_DOMAINS.has(domain);
}
