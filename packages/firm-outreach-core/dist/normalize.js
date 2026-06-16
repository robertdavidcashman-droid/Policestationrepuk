"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeFirmName = normalizeFirmName;
exports.slugifyFirmKey = slugifyFirmKey;
exports.firmKeyFromParts = firmKeyFromParts;
exports.normalizeEmail = normalizeEmail;
exports.emailHash = emailHash;
exports.prospectIdFromKey = prospectIdFromKey;
exports.prospectIdForCampaign = prospectIdForCampaign;
exports.isEnglandWalesPostcode = isEnglandWalesPostcode;
exports.registrableDomain = registrableDomain;
exports.domainFromUrl = domainFromUrl;
const crypto_1 = __importDefault(require("crypto"));
const shared_constants_1 = require("./shared-constants");
function normalizeFirmName(name) {
    return name
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\b(ltd|limited|llp|plc|solicitors?|law|legal)\b/gi, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}
function slugifyFirmKey(parts) {
    const slug = parts
        .map((p) => p
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''))
        .filter(Boolean)
        .join('-');
    return slug.slice(0, 120) || 'firm';
}
function firmKeyFromParts(firmName, postcode, town) {
    const name = normalizeFirmName(firmName);
    const pc = (postcode ?? '').replace(/\s+/g, '').toUpperCase().slice(0, 4);
    const t = town ? normalizeFirmName(town).replace(/\s+/g, '-') : '';
    return slugifyFirmKey([name.replace(/\s+/g, '-'), pc, t].filter(Boolean));
}
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function emailHash(email) {
    return crypto_1.default.createHash('sha256').update(normalizeEmail(email)).digest('hex');
}
function prospectIdFromKey(key) {
    const hash = crypto_1.default.createHash('sha256').update(key).digest('hex').slice(0, 16);
    return `fop_${hash}`;
}
/** Prospect ids are scoped per campaign so shared Redis can hold PSA + RepUK queues. */
function prospectIdForCampaign(campaignId, idKey) {
    return prospectIdFromKey(`${campaignId}:${idKey}`);
}
function isEnglandWalesPostcode(postcode) {
    const pc = (postcode ?? '').trim().toUpperCase().replace(/\s+/g, '');
    if (!pc || pc.length < 2)
        return true;
    const area = pc.match(/^([A-Z]{1,2})/)?.[1] ?? '';
    if (!area)
        return true;
    if (area === 'G')
        return false;
    return !shared_constants_1.NON_EW_POSTCODE_PREFIXES.includes(area);
}
function registrableDomain(host) {
    const h = host.toLowerCase().replace(/^www\./, '');
    const parts = h.split('.').filter(Boolean);
    if (parts.length < 2)
        return null;
    if (parts.length === 2)
        return h;
    const tld = parts.slice(-2).join('.');
    if (tld === 'co.uk' || tld === 'org.uk' || tld === 'gov.uk') {
        return parts.slice(-3).join('.');
    }
    return parts.slice(-2).join('.');
}
function domainFromUrl(url) {
    if (!url?.trim())
        return null;
    try {
        const u = new URL(url.startsWith('http') ? url : `https://${url}`);
        return registrableDomain(u.hostname);
    }
    catch {
        return null;
    }
}
