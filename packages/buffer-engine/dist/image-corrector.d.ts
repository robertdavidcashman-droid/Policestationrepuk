import type { CorrectedImageResult } from './types';
export interface ImageCorrectorOptions {
    siteId: string;
    siteUrl: string;
    slug: string;
    sourceImageUrl?: string;
    publicDir?: string;
    fetchFn?: typeof fetch;
    preferPng?: boolean;
}
/**
 * Ensure a post image is Buffer-compliant. Writes to public/images/buffer/{siteId}/{slug}.jpg
 * and returns the public URL.
 */
export declare function ensureCompliantPostImage(options: ImageCorrectorOptions): Promise<CorrectedImageResult | null>;
export declare function ensureCompliantGoogleBusinessImage(imageUrl: string, siteUrl: string, fetchFn?: typeof fetch): Promise<string | undefined>;
export declare function correctedImageExists(publicDir: string, siteId: string, slug: string): boolean;
//# sourceMappingURL=image-corrector.d.ts.map