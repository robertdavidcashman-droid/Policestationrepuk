import type { BufferChannelService } from './types';
declare const STATUS_LOOKUP_DELAY_MS = 400;
declare function sleep(ms: number): Promise<void>;
export interface BufferGraphQLError {
    message: string;
    extensions?: {
        code?: string;
    };
}
export declare class BufferApiError extends Error {
    readonly details?: unknown | undefined;
    constructor(message: string, details?: unknown | undefined);
}
export interface CreatedBufferPost {
    id: string;
    dueAt: string | null;
    channelId: string;
    channelService: string;
    imageUrl?: string;
}
export interface BufferPostWithMetrics {
    id: string;
    text: string;
    status: string;
    dueAt: string | null;
    sentAt: string | null;
    createdAt: string;
    channelId: string;
    channelService: string;
    clicks?: number;
    impressions?: number;
    reactions?: number;
    comments?: number;
}
export declare function createScheduledBufferPost(apiKey: string, input: {
    channelId: string;
    channelService: BufferChannelService;
    text: string;
    dueAt: string;
    url: string;
    imageUrl?: string;
    imageAlt?: string;
    feedId?: string;
    siteUrl: string;
}): Promise<CreatedBufferPost>;
export declare function listPostsInWindow(apiKey: string, organizationId: string, input: {
    status: Array<'scheduled' | 'sent' | 'error' | 'draft' | 'sending' | 'needs_approval'>;
    dueAtStart?: string;
    dueAtEnd?: string;
    createdAtStart?: string;
    channelIds?: string[];
    includeMetrics?: boolean;
}): Promise<BufferPostWithMetrics[]>;
export declare function getBufferPostById(apiKey: string, postId: string): Promise<{
    id: string;
    dueAt: string | null;
    status: string;
    channelService: string;
} | null>;
export declare function deleteBufferPost(apiKey: string, postId: string): Promise<void>;
export { sleep, STATUS_LOOKUP_DELAY_MS };
//# sourceMappingURL=client.d.ts.map