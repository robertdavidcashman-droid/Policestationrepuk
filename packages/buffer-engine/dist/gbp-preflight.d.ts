import type { SchedulablePost } from './types';
export interface GbpPreflightIssue {
    feedId: string;
    slug: string;
    rawImageUrl?: string;
    gbpImageUrl?: string;
    reason: string;
}
export declare function isDisallowedGbpAssetUrl(url: string): boolean;
export declare function isAllowedGbpAssetUrl(url: string, siteUrl: string): boolean;
export declare function collectGoogleBusinessPreflightIssues(posts: SchedulablePost[], siteUrl: string, fetchFn?: typeof fetch): Promise<GbpPreflightIssue[]>;
export declare function expectedGbpFallbackForFeed(feedId: string, siteUrl: string): string;
//# sourceMappingURL=gbp-preflight.d.ts.map