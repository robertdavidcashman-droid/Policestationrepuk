import { afterEach, describe, expect, it } from 'vitest';
import {
  getBufferApiKey,
  getBufferChannels,
  getSchedulerCooldownDays,
  getSchedulerDayPosts,
  getSchedulerMinPostsPerFeed,
  getSchedulerNightPosts,
  getSchedulerPostsPerFeed,
  getSchedulerTimeWindow,
  resolveFeedSchedule,
} from '@/lib/buffer/config';
import { getContentFeeds } from '@/lib/buffer/feeds';

const ENV = process.env;

describe('buffer config', () => {
  afterEach(() => {
    process.env = { ...ENV };
  });

  it('reads BUFFER_API_KEY when set', () => {
    process.env.BUFFER_API_KEY = ' test-key ';
    expect(getBufferApiKey()).toBe('test-key');
  });

  it('returns null when BUFFER_API_KEY is missing', () => {
    delete process.env.BUFFER_API_KEY;
    expect(getBufferApiKey()).toBeNull();
  });

  it('uses default channels when env channel ids are incomplete', () => {
    process.env.BUFFER_CHANNEL_TWITTER_ID = 'abc123';
    delete process.env.BUFFER_CHANNEL_LINKEDIN_ID;
    const channels = getBufferChannels();
    expect(channels).toHaveLength(3);
    expect(channels.map((c) => c.service)).toEqual(['twitter', 'linkedin', 'googlebusiness']);
  });

  it('uses env channel ids when all three are set', () => {
    process.env.BUFFER_CHANNEL_TWITTER_ID = '111111111111111111111111';
    process.env.BUFFER_CHANNEL_LINKEDIN_ID = '222222222222222222222222';
    process.env.BUFFER_CHANNEL_GOOGLEBUSINESS_ID = '333333333333333333333333';
    const channels = getBufferChannels();
    expect(channels.map((c) => c.id)).toEqual([
      '111111111111111111111111',
      '222222222222222222222222',
      '333333333333333333333333',
    ]);
  });

  it('clamps scheduler numeric settings to safe defaults', () => {
    process.env.BUFFER_SCHEDULER_POSTS_PER_FEED = '99';
    process.env.BUFFER_SCHEDULER_COOLDOWN_DAYS = '-1';
    process.env.BUFFER_SCHEDULER_DAY_START_HOUR = 'not-a-number';
    expect(getSchedulerPostsPerFeed()).toBe(15);
    expect(getSchedulerDayPosts()).toBe(3);
    expect(getSchedulerNightPosts()).toBe(2);
    expect(getSchedulerCooldownDays()).toBe(14);
    expect(getSchedulerTimeWindow().startHour).toBe(8);
  });

  it('enforces minimum posts per feed of 4', () => {
    expect(getSchedulerMinPostsPerFeed()).toBe(4);
    process.env.BUFFER_SCHEDULER_POSTS_PER_FEED = '1';
    expect(getSchedulerPostsPerFeed()).toBe(4);
    process.env.BUFFER_SCHEDULER_POSTS_PER_FEED = '2';
    expect(getSchedulerPostsPerFeed()).toBe(4);
    expect(resolveFeedSchedule({ postsPerDay: 2 })).toEqual({
      postsPerFeed: 4,
      dayPosts: 2,
      nightPosts: 2,
    });
  });

  it('defaults to four content feeds including psrtrain', () => {
    delete process.env.BUFFER_CONTENT_FEEDS;
    const feeds = getContentFeeds();
    expect(feeds.length).toBe(4);
    expect(feeds.map((f) => f.id)).toEqual([
      'policestationrepuk',
      'custodynote',
      'policestationagent',
      'psrtrain',
    ]);
    const psrtrain = feeds.find((f) => f.id === 'psrtrain');
    expect(psrtrain).toMatchObject({
      type: 'rss',
      url: 'https://psrtrain.com/feed',
      postsPerDay: 4,
      dayPosts: 2,
      nightPosts: 2,
    });
  });

  it('resolveFeedSchedule scales day/night for per-feed post counts', () => {
    process.env.BUFFER_SCHEDULER_POSTS_PER_FEED = '5';
    process.env.BUFFER_SCHEDULER_DAY_POSTS = '3';
    process.env.BUFFER_SCHEDULER_NIGHT_POSTS = '2';

    expect(resolveFeedSchedule({})).toEqual({ postsPerFeed: 5, dayPosts: 3, nightPosts: 2 });
    expect(resolveFeedSchedule({ postsPerDay: 4 })).toEqual({ postsPerFeed: 4, dayPosts: 2, nightPosts: 2 });
    expect(resolveFeedSchedule({ postsPerDay: 4, dayPosts: 3, nightPosts: 1 })).toEqual({
      postsPerFeed: 4,
      dayPosts: 3,
      nightPosts: 1,
    });
  });
});
