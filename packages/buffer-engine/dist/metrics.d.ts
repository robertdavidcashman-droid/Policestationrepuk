import type { BufferPostWithMetrics } from './client';
import type { SlugEngagementStats } from './types';
/** Extract blog slug from post text URL for this site. */
export declare function extractSlugFromPostText(text: string, siteHostname: string): string | null;
export declare function ingestMetricsFromPosts(posts: BufferPostWithMetrics[], siteHostname: string): SlugEngagementStats[];
export declare function siteHostnameFromUrl(siteUrl: string): string;
//# sourceMappingURL=metrics.d.ts.map