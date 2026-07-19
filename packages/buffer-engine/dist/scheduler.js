"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSiteBufferScheduler = runSiteBufferScheduler;
const client_1 = require("./client");
const gbp_preflight_1 = require("./gbp-preflight");
const config_1 = require("./config");
const scheduler_core_1 = require("./scheduler-core");
const bandit_1 = require("./bandit");
const reconcile_1 = require("./reconcile");
const image_corrector_1 = require("./image-corrector");
const image_url_1 = require("./image-url");
const storage_1 = require("./storage");
const idempotency_1 = require("./idempotency");
const node_path_1 = require("node:path");
function shuffleChannelsRepeated(items, count, random) {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const out = [];
    for (let i = 0; i < count; i++) {
        out.push(shuffled[i % shuffled.length]);
    }
    return out;
}
async function preparePostImages(adapter, posts) {
    const publicDir = adapter.publicDir ?? (0, node_path_1.join)(process.cwd(), 'public');
    const out = [];
    for (const post of posts) {
        const corrected = await (0, image_corrector_1.ensureCompliantPostImage)({
            siteId: adapter.siteId,
            siteUrl: adapter.siteUrl,
            slug: post.slug,
            sourceImageUrl: post.imageUrl,
            publicDir,
        });
        if (corrected) {
            if (corrected.publicUrl !== post.imageUrl && adapter.correctSourceImage) {
                await adapter.correctSourceImage({
                    slug: post.slug,
                    publicPath: corrected.publicPath,
                    publicUrl: corrected.publicUrl,
                    contentType: corrected.contentType,
                });
            }
            out.push({
                ...post,
                imageUrl: corrected.publicUrl,
                googleBusinessImageUrl: corrected.contentType === 'image/jpeg' || corrected.contentType === 'image/png'
                    ? corrected.publicUrl
                    : post.googleBusinessImageUrl,
            });
        }
        else {
            out.push(post);
        }
    }
    await (0, image_url_1.hydratePostImagesForBuffer)(out, adapter.siteUrl);
    return out;
}
async function runSiteBufferScheduler(adapter, options = {}) {
    const envConfig = (0, config_1.getSiteBufferEnvConfig)();
    const apiKey = envConfig.apiKey;
    if (!apiKey) {
        return { ok: false, reason: 'BUFFER_API_KEY is not configured' };
    }
    if (envConfig.channels.length === 0) {
        return { ok: false, reason: 'No BUFFER_CHANNEL_*_ID configured' };
    }
    const now = options.now ?? new Date();
    const timezone = envConfig.timezone;
    const localDate = (0, scheduler_core_1.localDateInTimezone)(now, timezone);
    const kv = adapter.kv ?? null;
    let claimedRunLock = false;
    if (!options.force && !options.dryRun) {
        const existingRun = await (0, storage_1.getSchedulerRunForDate)(kv, adapter.siteId, localDate);
        if (existingRun) {
            return {
                ok: true,
                skipped: true,
                reason: 'Already scheduled for this date',
                date: localDate,
                posts: existingRun.slugs.map((slug, i) => ({
                    postId: existingRun.postIds[i] ?? '',
                    slug,
                    feedId: existingRun.feedIds?.[i] ?? adapter.siteId,
                    channelId: existingRun.channels[i] ?? '',
                    channelService: '',
                    dueAt: existingRun.dueAts[i] ?? null,
                    title: slug,
                })),
            };
        }
        claimedRunLock = await (0, storage_1.claimSchedulerRun)(kv, adapter.siteId, localDate);
        if (!claimedRunLock) {
            const concurrentRun = await (0, storage_1.getSchedulerRunForDate)(kv, adapter.siteId, localDate);
            if (concurrentRun) {
                return {
                    ok: true,
                    skipped: true,
                    reason: 'Already scheduled for this date',
                    date: localDate,
                };
            }
            return {
                ok: true,
                skipped: true,
                reason: 'Another scheduler run in progress',
                date: localDate,
            };
        }
    }
    const releaseLockIfClaimed = async () => {
        if (claimedRunLock) {
            await (0, storage_1.releaseSchedulerRunLock)(kv, adapter.siteId, localDate);
            claimedRunLock = false;
        }
    };
    let runPersisted = false;
    try {
        let rawPosts = await Promise.resolve(adapter.getSchedulablePosts());
        rawPosts = rawPosts.map((p) => ({ ...p, feedId: p.feedId || adapter.siteId }));
        if (options.slugs?.length) {
            const set = new Set(options.slugs);
            rawPosts = rawPosts.filter((p) => set.has(p.slug));
        }
        const schedule = (0, config_1.resolveFeedSchedule)(envConfig);
        const targetCount = options.limit && options.limit > 0
            ? Math.max(schedule.postsPerFeed, options.limit)
            : schedule.postsPerFeed;
        if (rawPosts.length === 0) {
            return { ok: false, reason: 'No schedulable posts available', date: localDate };
        }
        const recentEntries = await (0, storage_1.getRecentSlugEntries)(kv, adapter.siteId);
        const statsMap = await (0, storage_1.getSlugEngagementStats)(kv, adapter.siteId);
        const feedCooldown = (0, scheduler_core_1.effectiveCooldownDays)(rawPosts.length, targetCount, envConfig.cooldownDays);
        const excludeKeys = (0, scheduler_core_1.slugsInCooldownForFeed)(recentEntries, adapter.siteId, feedCooldown, now);
        const rng = (0, scheduler_core_1.mulberry32)((0, scheduler_core_1.hashSeed)(`buffer-engine:${adapter.siteId}:${localDate}`));
        const poolCoverage = (0, bandit_1.computePoolCoverage)(rawPosts, statsMap);
        let picked = (0, bandit_1.pickBanditSchedulablePosts)(rawPosts, {
            count: Math.min(targetCount, rawPosts.length),
            excludeKeys,
            stats: statsMap,
            explorationRate: envConfig.explorationRate,
            poolCoverage,
            random: rng,
        });
        if (picked.length < targetCount && rawPosts.length >= targetCount) {
            const fallbackRng = (0, scheduler_core_1.mulberry32)((0, scheduler_core_1.hashSeed)(`buffer-fallback:${adapter.siteId}:${localDate}`));
            const extra = (0, bandit_1.pickBanditSchedulablePosts)(rawPosts, {
                count: targetCount - picked.length,
                excludeKeys: new Set([...excludeKeys, ...picked.map((p) => (0, scheduler_core_1.postCooldownKey)(p.feedId, p.slug))]),
                stats: statsMap,
                explorationRate: 1,
                poolCoverage,
                random: fallbackRng,
            });
            picked = [...picked, ...extra];
        }
        if (picked.length === 0) {
            const reconciled = await tryReconcileExistingSchedule(envConfig, adapter, localDate, targetCount, kv);
            if (reconciled) {
                console.info(`[buffer-engine:${adapter.siteId}] Reconciled day ${localDate}: ${reconciled.reason}`);
                return reconciled;
            }
            return {
                ok: false,
                reason: `No posts after cooldown (pool ${rawPosts.length}, cooldown ${feedCooldown}d)`,
                date: localDate,
            };
        }
        picked = await preparePostImages(adapter, picked);
        for (const post of picked) {
            if (!post.imageUrl?.trim()) {
                return {
                    ok: false,
                    reason: `Post "${post.slug}" has no Buffer-compatible image after correction`,
                    date: localDate,
                };
            }
        }
        let dayWindow = (0, config_1.getSchedulerDayWindow)();
        let nightWindow = (0, config_1.getSchedulerNightWindow)();
        if (options.respectCurrentTime) {
            const parts = new Intl.DateTimeFormat('en-GB', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            }).formatToParts(now);
            const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
            const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
            const nowSlotHour = minute > 0 ? hour + 1 : hour;
            dayWindow = {
                ...dayWindow,
                startHour: Math.min(Math.max(dayWindow.startHour, nowSlotHour), dayWindow.endHour),
                minGapMinutes: Math.min(dayWindow.minGapMinutes, 45),
            };
            nightWindow = {
                ...nightWindow,
                startHour: Math.min(Math.max(nightWindow.startHour, nowSlotHour), nightWindow.endHour),
                minGapMinutes: Math.min(nightWindow.minGapMinutes, 45),
            };
        }
        let dueAts = (0, scheduler_core_1.generateDayNightPostTimes)(localDate, {
            dayCount: schedule.dayPosts,
            nightCount: schedule.nightPosts,
            dayWindow,
            nightWindow,
            earlyMorningWindow: (0, config_1.getSchedulerEarlyMorningWindow)(),
        }, rng, timezone);
        if (dueAts.length < picked.length) {
            dueAts = (0, scheduler_core_1.ensurePostTimeCount)(localDate, dueAts, picked.length, [nightWindow, { ...(0, config_1.getSchedulerEarlyMorningWindow)(), date: (0, scheduler_core_1.addDaysToLocalDate)(localDate, 1) }], rng, timezone);
        }
        if (dueAts.length < picked.length) {
            return {
                ok: false,
                reason: `Could not allocate ${picked.length} schedule times (got ${dueAts.length})`,
                date: localDate,
            };
        }
        const channelOrder = shuffleChannelsRepeated(envConfig.channels, picked.length, rng);
        const gbpPosts = picked.filter((_, i) => channelOrder[i].service === 'googlebusiness');
        const gbpIssues = await (0, gbp_preflight_1.collectGoogleBusinessPreflightIssues)(gbpPosts, adapter.siteUrl);
        if (gbpIssues.length > 0) {
            return { ok: false, reason: 'GBP preflight failed', gbpIssues, date: localDate };
        }
        if (options.dryRun) {
            return {
                ok: true,
                dryRun: true,
                date: localDate,
                posts: picked.map((post, i) => ({
                    postId: 'dry-run',
                    slug: post.slug,
                    feedId: post.feedId,
                    channelId: channelOrder[i].id,
                    channelService: channelOrder[i].service,
                    dueAt: dueAts[i] ?? null,
                    title: post.title,
                    imageUrl: post.imageUrl,
                })),
            };
        }
        const created = [];
        const newRecent = [];
        const errors = [];
        const updatedStats = new Map(statsMap);
        for (let i = 0; i < picked.length; i++) {
            const post = picked[i];
            const channel = channelOrder[i];
            const dueAt = dueAts[i];
            const idemKey = (0, idempotency_1.bufferPostIdempotencyKey)({
                siteId: adapter.siteId,
                date: localDate,
                channelId: channel.id,
                slug: post.slug,
            });
            try {
                const claim = await (0, idempotency_1.claimBufferPostIdempotency)(kv, idemKey, 'pending');
                if (!claim.claimed) {
                    if (claim.existingPostId && claim.existingPostId !== 'pending') {
                        console.info(`[buffer-engine:${adapter.siteId}] Idempotency skipped duplicate ${post.slug} on ${channel.service} (postId=${claim.existingPostId})`);
                        created.push({
                            postId: claim.existingPostId,
                            slug: post.slug,
                            feedId: post.feedId,
                            channelId: channel.id,
                            channelService: channel.service,
                            dueAt,
                            title: post.title,
                            imageUrl: post.imageUrl,
                        });
                        newRecent.push({ slug: post.slug, feedId: post.feedId, scheduledAt: now.toISOString() });
                        continue;
                    }
                    console.info(`[buffer-engine:${adapter.siteId}] Idempotency in-flight for ${post.slug} on ${channel.service} — skipping`);
                    continue;
                }
                const text = (0, scheduler_core_1.buildSchedulablePostTextForService)(post, channel.service);
                const imageUrlForChannel = channel.service === 'googlebusiness'
                    ? (post.googleBusinessImageUrl ?? post.imageUrl)
                    : post.imageUrl;
                const createdPost = await createScheduledBufferPostWithRetry(apiKey, {
                    channelId: channel.id,
                    channelService: channel.service,
                    text,
                    dueAt,
                    url: post.url,
                    imageUrl: imageUrlForChannel,
                    imageAlt: post.imageAlt,
                    feedId: post.feedId,
                    siteUrl: adapter.siteUrl,
                });
                await (0, idempotency_1.finalizeBufferPostIdempotency)(kv, idemKey, createdPost.id);
                created.push({
                    postId: createdPost.id,
                    slug: post.slug,
                    feedId: post.feedId,
                    channelId: channel.id,
                    channelService: createdPost.channelService,
                    dueAt: createdPost.dueAt,
                    title: post.title,
                    imageUrl: createdPost.imageUrl ?? post.imageUrl,
                });
                newRecent.push({ slug: post.slug, feedId: post.feedId, scheduledAt: now.toISOString() });
                const prev = updatedStats.get(post.slug) ?? {
                    slug: post.slug,
                    clicks: 0,
                    impressions: 0,
                    reactions: 0,
                    timesPosted: 0,
                    lastPostedAt: null,
                };
                updatedStats.set(post.slug, {
                    ...prev,
                    timesPosted: prev.timesPosted + 1,
                    lastPostedAt: now.toISOString(),
                });
            }
            catch (err) {
                // Release pending claim so a later retry can re-attempt.
                if (kv?.del) {
                    try {
                        await kv.del(`${'buffer-engine:idem:'}${idemKey}`);
                    }
                    catch {
                        // ignore
                    }
                }
                errors.push({
                    slug: post.slug,
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        }
        if (created.length === 0) {
            const reconciled = await tryReconcileExistingSchedule(envConfig, adapter, localDate, targetCount, kv);
            if (reconciled) {
                console.info(`[buffer-engine:${adapter.siteId}] Reconciled after schedule failures for ${localDate}: ${reconciled.reason}`);
                return reconciled;
            }
            return { ok: false, reason: 'All schedule attempts failed', date: localDate, errors };
        }
        await (0, storage_1.saveSchedulerRun)(kv, adapter.siteId, {
            date: localDate,
            scheduledAt: now.toISOString(),
            postIds: created.map((p) => p.postId),
            slugs: created.map((p) => p.slug),
            feedIds: created.map((p) => p.feedId),
            channels: created.map((p) => p.channelId),
            dueAts: created.map((p) => p.dueAt ?? ''),
        });
        runPersisted = true;
        await (0, storage_1.saveRecentSlugEntries)(kv, adapter.siteId, (0, scheduler_core_1.appendRecentSlugs)(recentEntries, newRecent, 500));
        await (0, storage_1.saveSlugEngagementStats)(kv, adapter.siteId, updatedStats);
        return {
            ok: created.length >= targetCount || rawPosts.length < targetCount,
            date: localDate,
            posts: created,
            errors: errors.length ? errors : undefined,
            reason: created.length < targetCount ? `Scheduled ${created.length}/${targetCount}` : undefined,
        };
    }
    finally {
        if (claimedRunLock && !runPersisted) {
            await (0, storage_1.releaseSchedulerRunLock)(kv, adapter.siteId, localDate);
        }
    }
}
async function createScheduledBufferPostWithRetry(apiKey, input, maxAttempts = 6) {
    let lastError;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            if (attempt > 0)
                await new Promise((r) => setTimeout(r, 4000 * attempt));
            return await (0, client_1.createScheduledBufferPost)(apiKey, input);
        }
        catch (err) {
            lastError = err;
            const message = err instanceof Error ? err.message : '';
            if (!/too many requests/i.test(message) || attempt === maxAttempts - 1)
                throw err;
        }
    }
    throw lastError;
}
/**
 * Before reporting failure, check KV run record and Buffer API for posts already
 * scheduled for this day — cooldown exhaustion is not a failure when the day is covered.
 */
async function tryReconcileExistingSchedule(envConfig, adapter, localDate, targetCount, kv) {
    const apiKey = envConfig.apiKey;
    if (!apiKey)
        return null;
    const existingRun = await (0, storage_1.getSchedulerRunForDate)(kv, adapter.siteId, localDate);
    if (existingRun && existingRun.postIds.length >= targetCount) {
        return {
            ok: true,
            skipped: true,
            reason: 'Already scheduled for this date',
            date: localDate,
            posts: existingRun.slugs.map((slug, i) => ({
                postId: existingRun.postIds[i] ?? '',
                slug,
                feedId: existingRun.feedIds?.[i] ?? adapter.siteId,
                channelId: existingRun.channels[i] ?? '',
                channelService: '',
                dueAt: existingRun.dueAts[i] ?? null,
                title: slug,
            })),
        };
    }
    const channelIds = envConfig.channels.map((c) => c.id);
    const bufferCount = await (0, reconcile_1.countSitePostsInBufferForDay)(apiKey, envConfig.organizationId, adapter.siteUrl, localDate, envConfig.timezone, channelIds);
    if (bufferCount.count >= targetCount) {
        return {
            ok: true,
            skipped: true,
            reconciled: true,
            scheduledInBuffer: bufferCount.count,
            reason: `Buffer already has ${bufferCount.count}/${targetCount} posts scheduled for today (cooldown exhausted)`,
            date: localDate,
        };
    }
    return null;
}
