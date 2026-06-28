"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAbsoluteImageUrl = resolveAbsoluteImageUrl;
exports.buildBufferImageAssets = buildBufferImageAssets;
exports.imageAssetsFromPost = imageAssetsFromPost;
/** Resolve a relative or protocol-relative image path to an absolute HTTPS URL. */
function resolveAbsoluteImageUrl(baseUrl, src) {
    if (!src?.trim())
        return undefined;
    const trimmed = src.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
        return trimmed;
    if (trimmed.startsWith('//'))
        return `https:${trimmed}`;
    const base = baseUrl.replace(/\/$/, '');
    if (trimmed.startsWith('/'))
        return `${base}${trimmed}`;
    return `${base}/${trimmed}`;
}
function buildBufferImageAssets(input) {
    if (!input.imageUrl?.trim())
        return [];
    return [
        {
            image: {
                url: input.imageUrl.trim(),
                metadata: { altText: (input.imageAlt || input.title).trim() || input.title },
            },
        },
    ];
}
function imageAssetsFromPost(post) {
    return buildBufferImageAssets({
        imageUrl: post.imageUrl,
        imageAlt: post.imageAlt,
        title: post.title,
    });
}
