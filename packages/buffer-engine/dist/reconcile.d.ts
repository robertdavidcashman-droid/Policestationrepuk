export interface BufferDayPostCount {
    count: number;
    postIds: string[];
    statuses: Array<'scheduled' | 'sent'>;
}
/** Count posts in Buffer due on `localDate` whose text links to this site. */
export declare function countSitePostsInBufferForDay(apiKey: string, organizationId: string, siteUrl: string, localDate: string, timezone: string, channelIds: string[]): Promise<BufferDayPostCount>;
//# sourceMappingURL=reconcile.d.ts.map