"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugClickRate = slugClickRate;
exports.effectiveExplorationRate = effectiveExplorationRate;
exports.pickBanditSchedulablePosts = pickBanditSchedulablePosts;
exports.computePoolCoverage = computePoolCoverage;
const scheduler_core_1 = require("./scheduler-core");
/** Click-through rate with Laplace smoothing. */
function slugClickRate(stats) {
    const clicks = stats.clicks + 1;
    const impressions = stats.impressions + 10;
    return clicks / impressions;
}
/** Epsilon decays as more of the pool has been posted at least once. */
function effectiveExplorationRate(baseRate, poolCoverage) {
    const decay = Math.max(0.05, baseRate * (1 - poolCoverage * 0.75));
    return Math.min(baseRate, decay);
}
/**
 * Epsilon-greedy bandit: exploit high click-rate slugs, explore least-tested slugs.
 * Hard cooldown filter applied before selection.
 */
function pickBanditSchedulablePosts(posts, options) {
    const pool = posts.filter((p) => !options.excludeKeys.has((0, scheduler_core_1.postCooldownKey)(p.feedId, p.slug)));
    if (pool.length === 0)
        return [];
    const eps = effectiveExplorationRate(options.explorationRate, options.poolCoverage);
    const picked = [];
    const usedSlugs = new Set();
    while (picked.length < options.count && usedSlugs.size < pool.length) {
        const remaining = pool.filter((p) => !usedSlugs.has(p.slug));
        if (remaining.length === 0)
            break;
        const explore = options.random() < eps;
        let choice;
        if (explore) {
            choice = remaining.reduce((best, p) => {
                const bestStats = options.stats.get(best.slug) ?? emptyStats(best.slug);
                const pStats = options.stats.get(p.slug) ?? emptyStats(p.slug);
                if (pStats.timesPosted < bestStats.timesPosted)
                    return p;
                if (pStats.timesPosted === bestStats.timesPosted && pStats.lastPostedAt == null)
                    return p;
                return best;
            });
        }
        else {
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
function emptyStats(slug) {
    return { slug, clicks: 0, impressions: 0, reactions: 0, timesPosted: 0, lastPostedAt: null };
}
function computePoolCoverage(posts, stats) {
    if (posts.length === 0)
        return 1;
    const tested = posts.filter((p) => (stats.get(p.slug)?.timesPosted ?? 0) > 0).length;
    return tested / posts.length;
}
