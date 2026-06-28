"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSlugFromPostText = extractSlugFromPostText;
exports.ingestMetricsFromPosts = ingestMetricsFromPosts;
exports.siteHostnameFromUrl = siteHostnameFromUrl;
/** Extract blog slug from post text URL for this site. */
function extractSlugFromPostText(text, siteHostname) {
    const urlMatch = text.match(/https?:\/\/[^\s)]+/);
    if (!urlMatch)
        return null;
    try {
        const url = new URL(urlMatch[0]);
        if (!url.hostname.includes(siteHostname.replace(/^www\./, '')))
            return null;
        const parts = url.pathname.split('/').filter(Boolean);
        return parts[parts.length - 1] ?? null;
    }
    catch {
        return null;
    }
}
function ingestMetricsFromPosts(posts, siteHostname) {
    const bySlug = new Map();
    for (const post of posts) {
        const slug = extractSlugFromPostText(post.text, siteHostname);
        if (!slug)
            continue;
        const prev = bySlug.get(slug) ?? {
            slug,
            clicks: 0,
            impressions: 0,
            reactions: 0,
            timesPosted: 0,
            lastPostedAt: null,
        };
        bySlug.set(slug, {
            slug,
            clicks: prev.clicks + (post.clicks ?? 0),
            impressions: prev.impressions + (post.impressions ?? 0),
            reactions: prev.reactions + (post.reactions ?? 0),
            timesPosted: prev.timesPosted + (post.status === 'sent' ? 1 : 0),
            lastPostedAt: post.sentAt ?? prev.lastPostedAt,
        });
    }
    return [...bySlug.values()];
}
function siteHostnameFromUrl(siteUrl) {
    try {
        return new URL(siteUrl).hostname.replace(/^www\./, '');
    }
    catch {
        return siteUrl;
    }
}
