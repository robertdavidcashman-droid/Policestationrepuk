import type { SchedulablePost, SlugEngagementStats } from './types';
import type { RandomFn } from './scheduler-core';
import { postCooldownKey } from './scheduler-core';

export interface BanditPickOptions {
  count: number;
  excludeKeys: Set<string>;
  stats: Map<string, SlugEngagementStats>;
  explorationRate: number;
  poolCoverage: number;
  random: RandomFn;
}

/** Click-through rate with Laplace smoothing. */
export function slugClickRate(stats: SlugEngagementStats): number {
  const clicks = stats.clicks + 1;
  const impressions = stats.impressions + 10;
  return clicks / impressions;
}

/** Epsilon decays as more of the pool has been posted at least once. */
export function effectiveExplorationRate(baseRate: number, poolCoverage: number): number {
  const decay = Math.max(0.05, baseRate * (1 - poolCoverage * 0.75));
  return Math.min(baseRate, decay);
}

/**
 * Epsilon-greedy bandit: exploit high click-rate slugs, explore least-tested slugs.
 * Hard cooldown filter applied before selection.
 */
export function pickBanditSchedulablePosts(
  posts: SchedulablePost[],
  options: BanditPickOptions,
): SchedulablePost[] {
  const pool = posts.filter((p) => !options.excludeKeys.has(postCooldownKey(p.feedId, p.slug)));
  if (pool.length === 0) return [];

  const eps = effectiveExplorationRate(options.explorationRate, options.poolCoverage);
  const picked: SchedulablePost[] = [];
  const usedSlugs = new Set<string>();

  while (picked.length < options.count && usedSlugs.size < pool.length) {
    const remaining = pool.filter((p) => !usedSlugs.has(p.slug));
    if (remaining.length === 0) break;

    const explore = options.random() < eps;
    let choice: SchedulablePost;

    if (explore) {
      choice = remaining.reduce((best, p) => {
        const bestStats = options.stats.get(best.slug) ?? emptyStats(best.slug);
        const pStats = options.stats.get(p.slug) ?? emptyStats(p.slug);
        if (pStats.timesPosted < bestStats.timesPosted) return p;
        if (pStats.timesPosted === bestStats.timesPosted && pStats.lastPostedAt == null) return p;
        return best;
      });
    } else {
      choice = remaining.reduce((best, p) => {
        const bestRate = slugClickRate(options.stats.get(best.slug) ?? emptyStats(best.slug));
        const pRate = slugClickRate(options.stats.get(p.slug) ?? emptyStats(p.slug));
        return pRate > bestRate ? p : best;
      });
    }

    picked.push(choice);
    usedSlugs.add(choice.slug);
  }

  return picked;
}

function emptyStats(slug: string): SlugEngagementStats {
  return { slug, clicks: 0, impressions: 0, reactions: 0, timesPosted: 0, lastPostedAt: null };
}

export function computePoolCoverage(
  posts: SchedulablePost[],
  stats: Map<string, SlugEngagementStats>,
): number {
  if (posts.length === 0) return 1;
  const tested = posts.filter((p) => (stats.get(p.slug)?.timesPosted ?? 0) > 0).length;
  return tested / posts.length;
}
