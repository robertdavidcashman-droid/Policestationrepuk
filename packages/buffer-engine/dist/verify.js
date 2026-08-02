"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySiteBufferSchedule = verifySiteBufferSchedule;
const config_1 = require("./config");
const reconcile_1 = require("./reconcile");
const scheduler_core_1 = require("./scheduler-core");
const scheduler_1 = require("./scheduler");
async function verifySiteBufferSchedule(adapter, options) {
    const env = (0, config_1.getSiteBufferEnvConfig)();
    const now = options?.now ?? new Date();
    const localDate = (0, scheduler_core_1.localDateInTimezone)(now, env.timezone);
    const issues = [];
    if (!env.apiKey) {
        return { ok: false, date: localDate, scheduledCount: 0, requiredCount: env.postsPerDay, gapFilled: 0, issues: ['BUFFER_API_KEY missing'] };
    }
    const channelIds = env.channels.map((c) => c.id);
    const counted = await (0, reconcile_1.countSitePostsInBufferForDay)(env.apiKey, env.organizationId, adapter.siteUrl, localDate, env.timezone, channelIds);
    let scheduledCount = counted.count;
    let gapFilled = 0;
    if (scheduledCount < env.postsPerDay) {
        issues.push(`Only ${scheduledCount}/${env.postsPerDay} posts scheduled for ${localDate}`);
        if (options?.gapFill !== false) {
            const result = await (0, scheduler_1.runSiteBufferScheduler)(adapter, {
                now,
                force: true,
                respectCurrentTime: true,
                limit: env.postsPerDay - scheduledCount,
            });
            if (result.posts?.length) {
                gapFilled = result.posts.length;
            }
            // Re-count from Buffer (scheduled + sent) rather than trusting local increment —
            // published slots become `sent` and must still count toward the day quota.
            const recounted = await (0, reconcile_1.countSitePostsInBufferForDay)(env.apiKey, env.organizationId, adapter.siteUrl, localDate, env.timezone, channelIds);
            scheduledCount = recounted.count;
            if (!result.ok && result.reason)
                issues.push(`Gap-fill: ${result.reason}`);
        }
    }
    return {
        ok: scheduledCount >= env.postsPerDay,
        date: localDate,
        scheduledCount,
        requiredCount: env.postsPerDay,
        gapFilled,
        issues,
    };
}
