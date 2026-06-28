import type { SchedulablePost } from './types';
/** Resolve a relative or protocol-relative image path to an absolute HTTPS URL. */
export declare function resolveAbsoluteImageUrl(baseUrl: string, src: string | undefined | null): string | undefined;
export declare function buildBufferImageAssets(input: {
    imageUrl?: string;
    imageAlt?: string;
    title: string;
}): Array<{
    image: {
        url: string;
        metadata: {
            altText: string;
        };
    };
}>;
export declare function imageAssetsFromPost(post: SchedulablePost): ReturnType<typeof buildBufferImageAssets>;
//# sourceMappingURL=assets.d.ts.map