"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDisallowedGbpAssetUrl = isDisallowedGbpAssetUrl;
exports.isAllowedGbpAssetUrl = isAllowedGbpAssetUrl;
exports.collectGoogleBusinessPreflightIssues = collectGoogleBusinessPreflightIssues;
exports.expectedGbpFallbackForFeed = expectedGbpFallbackForFeed;
const image_url_1 = require("./image-url");
function isDisallowedGbpAssetUrl(url) {
    const trimmed = url.trim();
    if (!trimmed)
        return true;
    if (/\.webp(\?|$)/i.test(trimmed))
        return true;
    if (/opengraph-image/i.test(trimmed))
        return true;
    return false;
}
function isAllowedGbpAssetUrl(url, siteUrl) {
    const trimmed = url.trim();
    if (!trimmed || isDisallowedGbpAssetUrl(trimmed))
        return false;
    try {
        const parsed = new URL(trimmed);
        const siteHost = new URL(siteUrl.replace(/\/$/, '')).hostname;
        if (parsed.hostname === siteHost)
            return true;
        if (parsed.pathname.includes('/images/buffer/'))
            return true;
        return false;
    }
    catch {
        return false;
    }
}
async function collectGoogleBusinessPreflightIssues(posts, siteUrl, fetchFn = fetch) {
    const issues = [];
    for (const post of posts) {
        const rawImageUrl = post.imageUrl?.trim();
        const gbpImageUrl = post.googleBusinessImageUrl?.trim() ??
            (await (0, image_url_1.resolveGoogleBusinessImageUrlForPost)(post, fetchFn, siteUrl));
        if (!gbpImageUrl) {
            issues.push({
                feedId: post.feedId,
                slug: post.slug,
                rawImageUrl,
                reason: 'no Google Business compatible JPEG/PNG image',
            });
            continue;
        }
        if (!isAllowedGbpAssetUrl(gbpImageUrl, siteUrl)) {
            issues.push({
                feedId: post.feedId,
                slug: post.slug,
                rawImageUrl,
                gbpImageUrl,
                reason: `GBP image must be self-hosted JPEG/PNG on ${new URL(siteUrl).hostname}`,
            });
            continue;
        }
        const probe = await (0, image_url_1.probeGoogleBusinessImageUrl)(gbpImageUrl, fetchFn, siteUrl);
        if (!probe.ok) {
            issues.push({
                feedId: post.feedId,
                slug: post.slug,
                rawImageUrl,
                gbpImageUrl,
                reason: probe.reason ?? 'Google Business image probe failed',
            });
        }
    }
    return issues;
}
function expectedGbpFallbackForFeed(feedId, siteUrl) {
    return (0, image_url_1.googleBusinessFeedFallbackUrl)(feedId, siteUrl);
}
