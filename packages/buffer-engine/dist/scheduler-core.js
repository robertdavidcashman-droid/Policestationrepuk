"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashSeed = hashSeed;
exports.mulberry32 = mulberry32;
exports.withBufferSocialUtm = withBufferSocialUtm;
exports.buildSchedulablePostText = buildSchedulablePostText;
exports.buildSchedulablePostTextForService = buildSchedulablePostTextForService;
exports.postCooldownKey = postCooldownKey;
exports.londonOffsetForDate = londonOffsetForDate;
exports.timezoneOffsetForDate = timezoneOffsetForDate;
exports.generateRandomPostTimes = generateRandomPostTimes;
exports.addDaysToLocalDate = addDaysToLocalDate;
exports.generateDayNightPostTimes = generateDayNightPostTimes;
exports.ensurePostTimeCount = ensurePostTimeCount;
exports.localDateInTimezone = localDateInTimezone;
exports.shuffleChannels = shuffleChannels;
exports.slugsInCooldown = slugsInCooldown;
exports.effectiveCooldownDays = effectiveCooldownDays;
exports.slugsInCooldownForFeed = slugsInCooldownForFeed;
exports.appendRecentSlugs = appendRecentSlugs;
const utm_1 = require("./utm");
const google_business_text_1 = require("./google-business-text");
function hashSeed(input) {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
/** Deterministic PRNG — same seed yields same sequence (stable if cron retries before lock). */
function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
function withBufferSocialUtm(url, feedId, service) {
    return (0, utm_1.appendUtm)(url, {
        source: 'buffer',
        medium: 'social',
        campaign: `${feedId}_${service}`,
    });
}
function buildSchedulablePostText(post, options) {
    const url = options?.feedId && options?.service
        ? withBufferSocialUtm(post.url, options.feedId, options.service)
        : post.url;
    const excerpt = post.excerpt.trim();
    if (excerpt) {
        return `${post.title}\n\n${excerpt}\n\n${url}`;
    }
    return `${post.title}\n\n${url}`;
}
const TWITTER_MAX_CHARS = 280;
/** Twitter/X posts must stay within 280 characters — title + URL only when needed. */
function buildSchedulablePostTextForService(post, service) {
    const trackedUrl = withBufferSocialUtm(post.url, post.feedId, service);
    const full = buildSchedulablePostText(post, { feedId: post.feedId, service });
    if (service === 'googlebusiness') {
        return (0, google_business_text_1.sanitizeGoogleBusinessPostText)(full);
    }
    if (service !== 'twitter' || full.length <= TWITTER_MAX_CHARS) {
        return full;
    }
    const suffix = `\n\n${trackedUrl}`;
    const budget = TWITTER_MAX_CHARS - suffix.length;
    if (budget <= 0) {
        return trackedUrl.slice(0, TWITTER_MAX_CHARS);
    }
    const title = post.title.trim();
    if (title.length <= budget) {
        return `${title}${suffix}`;
    }
    const trimmedTitle = title.slice(0, Math.max(1, budget - 1)).trimEnd();
    return `${trimmedTitle}…${suffix}`;
}
function postCooldownKey(feedId, slug) {
    return `${feedId}:${slug}`;
}
function formatOffsetIso(localDate, hour, minute, offset) {
    const hh = String(hour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    return `${localDate}T${hh}:${mm}:00${offset}`;
}
/** London/BST offset for scheduling — Europe/London only for now. */
function londonOffsetForDate(localDate) {
    const [y, m, d] = localDate.split('-').map(Number);
    const month = m - 1;
    const lastSunday = (year, mon) => {
        const last = new Date(Date.UTC(year, mon + 1, 0));
        return last.getUTCDate() - last.getUTCDay();
    };
    const bstStartDay = lastSunday(y, 2) + 1; // last Sunday in March
    const bstEndDay = lastSunday(y, 9); // last Sunday in October
    const isBst = (month > 2 && month < 9) ||
        (month === 2 && d >= bstStartDay) ||
        (month === 9 && d < bstEndDay);
    return isBst ? '+01:00' : '+00:00';
}
function timezoneOffsetForDate(localDate, timeZone) {
    if (timeZone === 'Europe/London') {
        return londonOffsetForDate(localDate);
    }
    return '+00:00';
}
function generateRandomPostTimes(localDate, count, window, random, timeZone = 'Europe/London') {
    if (count <= 0)
        return [];
    const offset = timezoneOffsetForDate(localDate, timeZone);
    const startMinutes = window.startHour * 60;
    const endMinutes = window.endHour * 60;
    const span = endMinutes - startMinutes;
    if (span <= 0) {
        throw new Error('Invalid scheduler time window');
    }
    const slots = [];
    const maxAttempts = 200;
    for (let attempt = 0; attempt < maxAttempts && slots.length < count; attempt++) {
        const candidate = startMinutes + Math.floor(random() * span);
        const rounded = Math.round(candidate / 5) * 5;
        if (rounded < startMinutes || rounded > endMinutes)
            continue;
        if (slots.every((s) => Math.abs(s - rounded) >= window.minGapMinutes)) {
            slots.push(rounded);
        }
    }
    while (slots.length < count) {
        const evenlySpaced = startMinutes +
            Math.floor((slots.length * span) / Math.max(count, 1)) +
            Math.floor(random() * 15);
        const rounded = Math.min(endMinutes, Math.max(startMinutes, Math.round(evenlySpaced / 5) * 5));
        if (slots.every((s) => Math.abs(s - rounded) >= Math.min(window.minGapMinutes, 45))) {
            slots.push(rounded);
        }
        else if (slots.length === 0) {
            slots.push(rounded);
        }
        else {
            break;
        }
    }
    slots.sort((a, b) => a - b);
    return slots.map((mins) => {
        const hour = Math.floor(mins / 60);
        const minute = mins % 60;
        return formatOffsetIso(localDate, hour, minute, offset);
    });
}
function addDaysToLocalDate(localDate, days) {
    const [y, m, d] = localDate.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + days));
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
}
/**
 * Schedule day + night slots: e.g. 3 between 08:00–21:00 and 2 in the evening
 * (21:00–23:59). If two night slots are needed, the second uses early morning
 * (00:00–07:00) on the following calendar day.
 */
function generateDayNightPostTimes(localDate, options, random, timeZone = 'Europe/London') {
    const dayWindowValid = options.dayWindow.startHour < options.dayWindow.endHour;
    const dayTimes = options.dayCount > 0 && dayWindowValid
        ? generateRandomPostTimes(localDate, options.dayCount, options.dayWindow, random, timeZone)
        : [];
    const nightTimes = [];
    const nightWindowValid = options.nightWindow.startHour < options.nightWindow.endHour;
    const extraDaySlots = dayWindowValid ? 0 : options.dayCount;
    const totalNightSlots = options.nightCount + extraDaySlots;
    if (totalNightSlots <= 0) {
        return [...dayTimes].sort();
    }
    const eveningCount = totalNightSlots >= 2 ? Math.min(1, totalNightSlots) : totalNightSlots;
    const earlyCount = totalNightSlots - eveningCount;
    if (eveningCount > 0 && nightWindowValid) {
        nightTimes.push(...generateRandomPostTimes(localDate, eveningCount, options.nightWindow, random, timeZone));
    }
    const earlyMorningValid = options.earlyMorningWindow.startHour < options.earlyMorningWindow.endHour;
    const needEarly = earlyCount + (eveningCount > 0 && !nightWindowValid ? eveningCount : 0);
    if (needEarly > 0 && earlyMorningValid) {
        const nextDate = addDaysToLocalDate(localDate, 1);
        nightTimes.push(...generateRandomPostTimes(nextDate, needEarly, options.earlyMorningWindow, random, timeZone));
    }
    return [...dayTimes, ...nightTimes].sort();
}
/** Ensure exactly `count` schedule times, topping up from fallback windows when day slots are tight. */
function ensurePostTimeCount(localDate, initial, count, fallbackWindows, random, timeZone = 'Europe/London') {
    const out = [...initial];
    for (const window of fallbackWindows) {
        if (out.length >= count)
            break;
        const need = count - out.length;
        try {
            const extra = generateRandomPostTimes(window.date ?? localDate, need, window, random, timeZone);
            for (const slot of extra) {
                if (out.length >= count)
                    break;
                if (!out.includes(slot))
                    out.push(slot);
            }
        }
        catch {
            /* skip invalid window */
        }
    }
    return out.sort().slice(0, count);
}
function localDateInTimezone(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
    const m = parts.find((p) => p.type === 'month')?.value ?? '01';
    const d = parts.find((p) => p.type === 'day')?.value ?? '01';
    return `${y}-${m}-${d}`;
}
function shuffleChannels(items, random) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}
function slugsInCooldown(entries, cooldownDays, now = new Date()) {
    const cutoff = now.getTime() - cooldownDays * 24 * 60 * 60 * 1000;
    const excluded = new Set();
    for (const entry of entries) {
        if (new Date(entry.scheduledAt).getTime() >= cutoff) {
            const feedId = entry.feedId ?? 'policestationrepuk';
            excluded.add(postCooldownKey(feedId, entry.slug));
        }
    }
    return excluded;
}
/** Per-feed cooldown capped by pool size so small RSS feeds can rotate without exhausting slugs. */
function effectiveCooldownDays(poolSize, postsPerFeed, globalCooldown) {
    if (poolSize <= 0 || postsPerFeed <= 0)
        return globalCooldown;
    return Math.max(1, Math.min(globalCooldown, Math.floor(poolSize / postsPerFeed)));
}
function slugsInCooldownForFeed(entries, feedId, cooldownDays, now = new Date()) {
    const cutoff = now.getTime() - cooldownDays * 24 * 60 * 60 * 1000;
    const excluded = new Set();
    for (const entry of entries) {
        const entryFeedId = entry.feedId ?? 'policestationrepuk';
        if (entryFeedId !== feedId)
            continue;
        if (new Date(entry.scheduledAt).getTime() >= cutoff) {
            excluded.add(postCooldownKey(entryFeedId, entry.slug));
        }
    }
    return excluded;
}
function appendRecentSlugs(entries, added, maxEntries = 120) {
    return [...added, ...entries].slice(0, maxEntries);
}
