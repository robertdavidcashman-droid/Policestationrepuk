"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchedulerRunForDate = getSchedulerRunForDate;
exports.saveSchedulerRun = saveSchedulerRun;
exports.deleteSchedulerRunForDate = deleteSchedulerRunForDate;
exports.getRecentSlugEntries = getRecentSlugEntries;
exports.saveRecentSlugEntries = saveRecentSlugEntries;
exports.getSlugEngagementStats = getSlugEngagementStats;
exports.saveSlugEngagementStats = saveSlugEngagementStats;
exports.mergeSlugStats = mergeSlugStats;
const RUN_KEY = (siteId, date) => `buffer-engine:run:${siteId}:${date}`;
const RECENT_KEY = (siteId) => `buffer-engine:recent-slugs:${siteId}`;
const STATS_KEY = (siteId) => `buffer-engine:slug-stats:${siteId}`;
async function getSchedulerRunForDate(kv, siteId, date) {
    if (!kv)
        return null;
    return (await kv.get(RUN_KEY(siteId, date))) ?? null;
}
async function saveSchedulerRun(kv, siteId, record) {
    if (!kv)
        return;
    await kv.set(RUN_KEY(siteId, record.date), record, { ex: 60 * 60 * 24 * 45 });
}
async function deleteSchedulerRunForDate(kv, siteId, date) {
    if (!kv?.del)
        return;
    await kv.del(RUN_KEY(siteId, date));
}
async function getRecentSlugEntries(kv, siteId) {
    if (!kv)
        return [];
    return (await kv.get(RECENT_KEY(siteId))) ?? [];
}
async function saveRecentSlugEntries(kv, siteId, entries) {
    if (!kv)
        return;
    await kv.set(RECENT_KEY(siteId), entries);
}
async function getSlugEngagementStats(kv, siteId) {
    if (!kv)
        return new Map();
    const raw = await kv.get(STATS_KEY(siteId));
    if (!raw)
        return new Map();
    return new Map(Object.entries(raw));
}
async function saveSlugEngagementStats(kv, siteId, stats) {
    if (!kv)
        return;
    const obj = Object.fromEntries(stats.entries());
    await kv.set(STATS_KEY(siteId), obj);
}
function mergeSlugStats(existing, updates) {
    const out = new Map(existing);
    for (const u of updates) {
        const prev = out.get(u.slug) ?? {
            slug: u.slug,
            clicks: 0,
            impressions: 0,
            reactions: 0,
            timesPosted: 0,
            lastPostedAt: null,
        };
        out.set(u.slug, {
            slug: u.slug,
            clicks: prev.clicks + u.clicks,
            impressions: prev.impressions + u.impressions,
            reactions: prev.reactions + u.reactions,
            timesPosted: Math.max(prev.timesPosted, u.timesPosted),
            lastPostedAt: u.lastPostedAt ?? prev.lastPostedAt,
        });
    }
    return out;
}
