import type { BufferChannelConfig, SiteBufferEnvConfig } from './types';
export declare const MIN_POSTS_PER_DAY = 5;
export declare function getSiteBufferEnvConfig(): SiteBufferEnvConfig;
export declare function getBufferChannelsFromEnv(): BufferChannelConfig[];
export declare function resolveFeedSchedule(config: SiteBufferEnvConfig): {
    postsPerFeed: number;
    dayPosts: number;
    nightPosts: number;
};
export interface SchedulerTimeWindow {
    startHour: number;
    endHour: number;
    minGapMinutes: number;
}
export declare function getSchedulerDayWindow(): SchedulerTimeWindow;
export declare function getSchedulerNightWindow(): SchedulerTimeWindow;
export declare function getSchedulerEarlyMorningWindow(): SchedulerTimeWindow;
//# sourceMappingURL=config.d.ts.map