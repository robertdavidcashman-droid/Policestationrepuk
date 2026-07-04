"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countSitePostsInBufferForDay = countSitePostsInBufferForDay;
const client_1 = require("./client");
const scheduler_core_1 = require("./scheduler-core");
const metrics_1 = require("./metrics");
/** Count posts in Buffer due on `localDate` whose text links to this site. */
async function countSitePostsInBufferForDay(apiKey, organizationId, siteUrl, localDate, timezone, channelIds) {
    if (!channelIds.length) {
        return { count: 0, postIds: [], statuses: [] };
    }
    const offset = (0, scheduler_core_1.timezoneOffsetForDate)(localDate, timezone);
    const dayStart = `${localDate}T00:00:00${offset}`;
    const dayEnd = `${(0, scheduler_core_1.addDaysToLocalDate)(localDate, 1)}T00:00:00${offset}`;
    const hostname = (0, metrics_1.siteHostnameFromUrl)(siteUrl);
    const inBuffer = await (0, client_1.listPostsInWindow)(apiKey, organizationId, {
        status: ['scheduled', 'sent'],
        dueAtStart: dayStart,
        dueAtEnd: dayEnd,
        channelIds,
    });
    const sitePosts = inBuffer.filter((p) => postTextMatchesHostname(p.text, hostname));
    return {
        count: sitePosts.length,
        postIds: sitePosts.map((p) => p.id),
        statuses: sitePosts.map((p) => (p.status === 'sent' ? 'sent' : 'scheduled')),
    };
}
function postTextMatchesHostname(text, hostname) {
    const bare = hostname.replace(/^www\./, '');
    const match = text.match(/https?:\/\/[^\s)]+/);
    if (!match)
        return false;
    try {
        const host = new URL(match[0]).hostname.replace(/^www\./, '');
        return host === bare || host.endsWith(`.${bare}`);
    }
    catch {
        return false;
    }
}
