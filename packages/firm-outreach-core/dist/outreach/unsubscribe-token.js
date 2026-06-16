"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueUnsubscribeToken = issueUnsubscribeToken;
exports.verifyUnsubscribeToken = verifyUnsubscribeToken;
const crypto_1 = __importDefault(require("crypto"));
function getSecret() {
    const raw = process.env.ADMIN_DECISION_TOKEN_SECRET ??
        process.env.CRON_SECRET ??
        'firm-outreach-dev-secret-change-me';
    return raw.trim();
}
function base64UrlEncode(input) {
    const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
    return buf
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}
function base64UrlDecodeToString(input) {
    const padded = input.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (padded.length % 4)) % 4;
    return Buffer.from(padded + '='.repeat(padLen), 'base64').toString('utf8');
}
function sign(payloadB64) {
    return base64UrlEncode(crypto_1.default.createHmac('sha256', getSecret()).update(payloadB64).digest());
}
function issueUnsubscribeToken(email, ttlDays = 90) {
    const payload = {
        email: email.trim().toLowerCase(),
        exp: Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60,
    };
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    return `${payloadB64}.${sign(payloadB64)}`;
}
function verifyUnsubscribeToken(token) {
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig)
        return null;
    if (sign(payloadB64) !== sig)
        return null;
    try {
        const payload = JSON.parse(base64UrlDecodeToString(payloadB64));
        if (!payload.email || payload.exp < Math.floor(Date.now() / 1000))
            return null;
        return payload;
    }
    catch {
        return null;
    }
}
