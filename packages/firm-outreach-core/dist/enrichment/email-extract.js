"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEmailsFromHtml = extractEmailsFromHtml;
exports.scoreEmailCandidate = scoreEmailCandidate;
exports.pickBestEmail = pickBestEmail;
exports.guessEmailsForDomain = guessEmailsForDomain;
const shared_constants_1 = require("../shared-constants");
const normalize_1 = require("../normalize");
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
function extractEmailsFromHtml(html) {
    const found = new Set();
    for (const m of html.matchAll(/mailto:([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi)) {
        found.add((0, normalize_1.normalizeEmail)(m[1]));
    }
    for (const m of html.matchAll(EMAIL_RE)) {
        found.add((0, normalize_1.normalizeEmail)(m[0]));
    }
    return [...found];
}
function scoreEmailCandidate(email, opts) {
    const norm = (0, normalize_1.normalizeEmail)(email);
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
    if (siteDomain && domain.endsWith(siteDomain))
        score += 20;
    else if (shared_constants_1.FREE_EMAIL_DOMAINS.has(domain)) {
        score -= opts.prospectType === 'firm' ? 25 : 5;
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
    const ranked = candidates
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
