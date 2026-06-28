import type { SchedulablePost, SlugEngagementStats } from './types';
import type { RandomFn } from './scheduler-core';
export interface BanditPickOptions {
    count: number;
    excludeKeys: Set<string>;
    stats: Map<string, SlugEngagementStats>;
    explorationRate: number;
    poolCoverage: number;
    random: RandomFn;
}
/** Click-through rate with Laplace smoothing. */
export declare function slugClickRate(stats: SlugEngagementStats): number;
/** Epsilon decays as more of the pool has been posted at least once. */
export declare function effectiveExplorationRate(baseRate: number, poolCoverage: number): number;
/**
 * Epsilon-greedy bandit: exploit high click-rate slugs, explore least-tested slugs.
 * Hard cooldown filter applied before selection.
 */
export declare function pickBanditSchedulablePosts(posts: SchedulablePost[], options: BanditPickOptions): SchedulablePost[];
export declare function computePoolCoverage(posts: SchedulablePost[], stats: Map<string, SlugEngagementStats>): number;
//# sourceMappingURL=bandit.d.ts.map