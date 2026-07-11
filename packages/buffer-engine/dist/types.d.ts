export type BufferChannelService = 'twitter' | 'linkedin' | 'googlebusiness' | 'facebook';
export interface BufferChannelConfig {
    id: string;
    service: BufferChannelService;
}
/** Normalised post from a site's blog store. */
export interface SchedulablePost {
    feedId: string;
    slug: string;
    title: string;
    excerpt: string;
    url: string;
    imageUrl?: string;
    /** Resolved self-hosted JPEG/PNG for Google Business scheduling. */
    googleBusinessImageUrl?: string;
    imageAlt?: string;
}
export interface SlugEngagementStats {
    slug: string;
    clicks: number;
    impressions: number;
    reactions: number;
    timesPosted: number;
    lastPostedAt: string | null;
}
export interface RecentSlugEntry {
    slug: string;
    feedId?: string;
    scheduledAt: string;
}
export interface SchedulerRunRecord {
    date: string;
    scheduledAt: string;
    postIds: string[];
    slugs: string[];
    feedIds?: string[];
    channels: string[];
    dueAts: string[];
}
/** Minimal KV adapter — Upstash Redis or compatible. */
export interface BufferKV {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, options?: {
        ex?: number;
        nx?: boolean;
    }): Promise<unknown>;
    del?(key: string): Promise<unknown>;
}
export interface CorrectedImageResult {
    /** Absolute public URL of the compliant image. */
    publicUrl: string;
    /** Repo-relative path under public/ (e.g. images/buffer/site/slug.jpg). */
    publicPath: string;
    contentType: 'image/jpeg' | 'image/png';
    bytes: number;
}
export interface ImageCorrectionInput {
    slug: string;
    sourceImageUrl?: string;
    fetchFn?: typeof fetch;
}
/** Site-specific adapter injected by each workspace. */
export interface BufferEngineAdapter {
    /** Site identifier used in KV keys and UTM (e.g. policestationagent). */
    siteId: string;
    siteUrl: string;
    /** Load all schedulable blog posts for this site. */
    getSchedulablePosts(): Promise<SchedulablePost[]> | SchedulablePost[];
    /**
     * Write a compliant hero image back to the blog source (registry, frontmatter, etc.).
     * Called after auto-correction when the source image was non-compliant.
     */
    correctSourceImage?(input: {
        slug: string;
        publicPath: string;
        publicUrl: string;
        contentType: 'image/jpeg' | 'image/png';
    }): Promise<void>;
    /** Optional KV — enables cooldown persistence and engagement stats. */
    kv?: BufferKV | null;
    /** Directory for corrected images (defaults to process.cwd()/public). */
    publicDir?: string;
}
export interface SiteBufferEnvConfig {
    apiKey: string | null;
    organizationId: string;
    channels: BufferChannelConfig[];
    postsPerDay: number;
    dayPosts: number;
    nightPosts: number;
    cooldownDays: number;
    timezone: string;
    dedupWindowDays: number;
    /** Initial exploration rate for bandit (0–1). Decays as coverage grows. */
    explorationRate: number;
}
export interface ScheduleOptions {
    now?: Date;
    force?: boolean;
    dryRun?: boolean;
    respectCurrentTime?: boolean;
    slugs?: string[];
    limit?: number;
}
export interface ScheduleResult {
    ok: boolean;
    skipped?: boolean;
    /** True when Buffer already had enough posts and no new scheduling was needed. */
    reconciled?: boolean;
    /** Posts already present in Buffer for this day when reconciled. */
    scheduledInBuffer?: number;
    reason?: string;
    date?: string;
    dryRun?: boolean;
    posts?: Array<{
        postId: string;
        slug: string;
        feedId: string;
        channelId: string;
        channelService: string;
        dueAt: string | null;
        title: string;
        imageUrl?: string;
    }>;
    gbpIssues?: Array<{
        feedId: string;
        slug: string;
        rawImageUrl?: string;
        gbpImageUrl?: string;
        reason: string;
    }>;
    errors?: Array<{
        slug: string;
        error: string;
    }>;
}
export interface VerifyResult {
    ok: boolean;
    date: string;
    scheduledCount: number;
    requiredCount: number;
    gapFilled: number;
    issues: string[];
}
export interface SelfTestResult {
    ok: boolean;
    date: string;
    sentCount: number;
    requiredCount: number;
    metricsIngested: number;
    issues: string[];
}
//# sourceMappingURL=types.d.ts.map