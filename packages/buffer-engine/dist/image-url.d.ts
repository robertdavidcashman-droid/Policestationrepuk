import type { BufferChannelService } from './types';
export declare const BUFFER_MAX_IMAGE_BYTES: number;
export declare const GOOGLE_BUSINESS_RASTER_FALLBACK = "https://www.policestationagent.com/blog-images/blog-listing-0.jpg";
export declare const GBP_FEED_IDS: readonly ["policestationrepuk", "custodynote", "psrtrain", "policestationagent"];
export interface BufferImageProbeResult {
    ok: boolean;
    contentType?: string;
    contentLength?: number;
    reason?: string;
}
export declare class BufferPostImageError extends Error {
    constructor(message: string);
}
export declare function googleBusinessFeedFallbackUrl(feedId: string, siteUrl: string): string;
export declare function buildGoogleBusinessFeedFallbacks(siteUrl: string): Record<string, string>;
export declare function isGoogleBusinessImageContentType(contentType: string | null | undefined): boolean;
export declare function probeLocalPublicImageUrl(url: string, siteUrl: string): BufferImageProbeResult | null;
export declare function isJpegOrPngMagicBytes(bytes: Uint8Array): boolean;
export declare function googleBusinessImageCandidates(imageUrl: string, siteUrl: string, feedId?: string): string[];
export declare function probeGoogleBusinessImageUrl(url: string, fetchFn?: typeof fetch, siteUrl?: string): Promise<BufferImageProbeResult>;
export declare function resolveGoogleBusinessImageUrl(imageUrl: string, fetchFn: typeof fetch | undefined, siteUrl: string, feedId?: string): Promise<string | undefined>;
export declare function resolveGoogleBusinessImageUrlForPost(post: {
    feedId: string;
    imageUrl?: string;
}, fetchFn: typeof fetch | undefined, siteUrl: string): Promise<string | undefined>;
export declare function isBufferCompatibleContentType(contentType: string | null | undefined): boolean;
export declare function isRasterImagePath(url: string): boolean;
export declare function parseContentLength(header: string | null): number | undefined;
export declare function bufferImageRejectReason(input: {
    status: number;
    contentType?: string;
    contentLength?: number;
}): string | undefined;
export declare function probeBufferImageUrl(url: string, fetchFn?: typeof fetch, siteUrl?: string): Promise<BufferImageProbeResult>;
export declare function resolveBufferImageUrl(candidates: Array<string | undefined | null>, fetchFn?: typeof fetch, siteUrl?: string): Promise<string | undefined>;
export declare function assertBufferPostImageReady(imageUrl: string | undefined | null, siteUrl: string, fetchFn?: typeof fetch, options?: {
    channelService?: BufferChannelService;
    feedId?: string;
}): Promise<string>;
export declare function hydratePostImagesForBuffer(posts: Array<{
    feedId: string;
    slug: string;
    imageUrl?: string;
    googleBusinessImageUrl?: string;
}>, siteUrl: string, fetchFn?: typeof fetch): Promise<void>;
//# sourceMappingURL=image-url.d.ts.map