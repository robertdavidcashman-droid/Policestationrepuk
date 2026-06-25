"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEmailsFromHtml = extractEmailsFromHtml;
exports.scoreEmailCandidate = scoreEmailCandidate;
exports.pickBestEmail = pickBestEmail;
exports.guessEmailsForDomain = guessEmailsForDomain;
const shared_constants_1 = require("../shared-constants");
const validator_1 = require("./validator");
const normalize_1 = require("../normalize");
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
function extractEmailsFromHtml(html) {
    const found = new Set();
    for (const m of html.matchAll(/mailto:([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi)) {
        const norm = (0, normalize_1.normalizeEmail)(m[1]);
        if ((0, validator_1.isPlausibleOutreachEmail)(norm))
            found.add(norm);
    }
    for (const m of html.matchAll(EMAIL_RE)) {
        const norm = (0, normalize_1.normalizeEmail)(m[0]);
        if ((0, validator_1.isPlausibleOutreachEmail)(norm))
            found.add(norm);
    }
    return [...found];
}
function scoreEmailCandidate(email, opts) {
    const norm = (0, normalize_1.normalizeEmail)(email);
    if (!(0, validator_1.isPlausibleOutreachEmail)(norm))
        return 0;
    const [local, domain] = norm.split('@');
    if (!local || !domain)
        return 0;
    if (shared_constants_1.REJECTED_EMAIL_LOCALS.has(local))
        return 0;
    let score = 40;
    const localBase = local.split('+')[0];
    for (const [key, boost] of Object.entries(shared_constants_1.PREFERRED_EMAIL_LOCALS)) {
        if (localBase.includes(key))
            score += boost;
    }
    const siteDomain = (0, normalize_1.domainFromUrl)(opts.websiteUrl);
    const emailRegistrable = (0, normalize_1.registrableDomain)(domain) ?? domain;
    const onFirmDomain = !!siteDomain &&
        (emailRegistrable === siteDomain || domain === siteDomain || domain.endsWith(`.${siteDomain}`));
    const isFree = shared_constants_1.FREE_EMAIL_DOMAINS.has(domain);
    if (onFirmDomain)
        score += 20;
    else if (isFree) {
        score -= opts.prospectType === 'firm' ? 25 : 5;
    }
    else if (siteDomain) {
        // Firm's own website domain is known, but this address is on neither it nor
        // a free/ISP provider — most likely a third-party address scraped from the
        // page (footer, badge, widget). Heavily penalise so an on-domain or free
        // address always wins; keep it positive only so a genuine alternate-domain
        // firm email can still be used as a last resort when nothing better exists.
        score -= 35;
    }
    if (opts.surname && localBase.includes(opts.surname.toLowerCase().slice(0, 4))) {
        score += 25;
    }
    if (opts.forename && localBase.includes(opts.forename.toLowerCase().slice(0, 3))) {
        score += 10;
    }
    const text = (opts.pageText ?? '').toLowerCase();
    for (const kw of shared_constants_1.CRIMINAL_KEYWORDS) {
        if (text.includes(kw)) {
            score += 5;
            break;
        }
    }
    return Math.min(100, Math.max(0, score));
}
function pickBestEmail(candidates, opts) {
    const filtered = candidates.filter((address) => (0, validator_1.isPlausibleOutreachEmail)(address));
    const ranked = filtered
        .map((address) => ({
        address,
        score: scoreEmailCandidate(address, opts),
        confidence: 'crawled',
        source: 'website_crawl',
    }))
        .filter((c) => c.score > 0)
        .sort((a, b) => b.score - a.score);
    return ranked[0] ?? null;
}
function guessEmailsForDomain(domain) {
    const locals = ['info', 'enquiries', 'contact', 'crime', 'criminal', 'duty', 'police'];
    return locals.map((l) => `${l}@${domain}`);
}
