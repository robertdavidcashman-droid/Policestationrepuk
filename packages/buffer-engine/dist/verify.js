"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySiteBufferSchedule = verifySiteBufferSchedule;
const client_1 = require("./client");
const config_1 = require("./config");
const scheduler_core_1 = require("./scheduler-core");
const scheduler_1 = require("./scheduler");
const metrics_1 = require("./metrics");
async function verifySiteBufferSchedule(adapter, options) {
    const env = (0, config_1.getSiteBufferEnvConfig)();
    const now = options?.now ?? new Date();
    const localDate = (0, scheduler_core_1.localDateInTimezone)(now, env.timezone);
    const issues = [];
    if (!env.apiKey) {
        return { ok: false, date: localDate, scheduledCount: 0, requiredCount: env.postsPerDay, gapFilled: 0, issues: ['BUFFER_API_KEY missing'] };
    }
    const offset = (0, scheduler_core_1.timezoneOffsetForDate)(localDate, env.timezone);
    const dayStart = `${localDate}T00:00:00${offset}`;
    const dayEnd = `${(0, scheduler_core_1.addDaysToLocalDate)(localDate, 1)}T00:00:00${offset}`;
    const hostname = (0, metrics_1.siteHostnameFromUrl)(adapter.siteUrl);
    const scheduled = await (0, client_1.listPostsInWindow)(env.apiKey, env.organizationId, {
        status: ['scheduled'],
        dueAtStart: dayStart,
        dueAtEnd: dayEnd,
        channelIds: env.channels.map((c) => c.id),
    });
    const sitePosts = scheduled.filter((p) => p.text.includes(hostname));
    let scheduledCount = sitePosts.length;
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
                scheduledCount += gapFilled;
            }
            if (!result.ok && result.reason)
                issues.push(`Gap-fill: ${result.reason}`);
        }
    }
    return {
        ok: scheduledCount >= config_1.MIN_POSTS_PER_DAY,
        date: localDate,
        scheduledCount,
        requiredCount: env.postsPerDay,
        gapFilled,
        issues,
    };
}
