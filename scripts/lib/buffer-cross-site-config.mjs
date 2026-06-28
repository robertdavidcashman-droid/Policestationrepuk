/**
 * Shared Buffer cross-site constants (org, channels, per-site env blocks).
 * Source of truth for sync + Vercel setup scripts.
 */
import path from 'path';
import { fileURLToPath } from 'url';

const SCRIPT_LIB = path.dirname(fileURLToPath(import.meta.url));
export const REPUK_ROOT = path.dirname(path.dirname(SCRIPT_LIB));
export const HOME = path.dirname(REPUK_ROOT);

export const BUFFER_ORG_ID = '69d26bdf0f822245c9a723c4';

export const BUFFER_CHANNELS = {
  linkedin: '69d26c06031bfa423cd0c50d',
  twitter: '69d26c3d031bfa423cd0c6b3',
  googlebusiness: '69d26c8b031bfa423cd0c8b7',
  facebook_criminal_solicitor: '6a304bd838b55793459b4247',
  facebook_robert_cashman: '6a304bd838b55793459b4248',
  facebook_repuk: '6a304bd938b55793459b4254',
  facebook_psa: '6a304bd938b55793459b4255',
};

/** REPUK-only: stop scheduling psrtrain/custodynote/PSA RSS once they self-post. */
export const REPUK_BUFFER_CONTENT_FEEDS = JSON.stringify([
  { id: 'policestationrepuk', type: 'local' },
]);

export const LOCAL_ENV_MARK_START = '# --- four-site Buffer (synced from policestationrepuk.org) ---';
export const LOCAL_ENV_MARK_END = '# --- end four-site Buffer ---';

export const SIBLING_LOCAL_TARGETS = [
  {
    site: 'psrtrain.com',
    dir: path.join(HOME, 'pstrain-rebuild'),
    lines: [
      `BUFFER_ORGANIZATION_ID=${BUFFER_ORG_ID}`,
      `BUFFER_CHANNEL_LINKEDIN_ID=${BUFFER_CHANNELS.linkedin}`,
      `BUFFER_CHANNEL_TWITTER_ID=${BUFFER_CHANNELS.twitter}`,
      `BUFFER_CHANNEL_FACEBOOK_ID=${BUFFER_CHANNELS.facebook_robert_cashman}`,
      'BUFFER_DEDUP_WINDOW_DAYS=30',
      'BUFFER_SCHEDULER_POSTS_PER_FEED=5',
    ],
    testSlug: 'first-week-psras-revision-plan',
    productionUrl: 'https://psrtrain.com',
  },
  {
    site: 'custodynote.com',
    dir: path.join(HOME, 'custody-note-website'),
    lines: [
      `BUFFER_ORGANIZATION_ID=${BUFFER_ORG_ID}`,
      `BUFFER_CHANNEL_LINKEDIN_ID=${BUFFER_CHANNELS.linkedin}`,
      `BUFFER_CHANNEL_FACEBOOK_ID=${BUFFER_CHANNELS.facebook_criminal_solicitor}`,
      `BUFFER_CHANNEL_GOOGLEBUSINESS_ID=${BUFFER_CHANNELS.googlebusiness}`,
      'BUFFER_DEDUP_WINDOW_DAYS=30',
      'BUFFER_SCHEDULER_POSTS_PER_FEED=5',
    ],
    testSlug: 'what-makes-a-good-attendance-note',
    productionUrl: 'https://custodynote.com',
  },
  {
    site: 'policestationagent.com',
    dir: path.join(HOME, 'policestationagent'),
    lines: [
      `BUFFER_ORGANIZATION_ID=${BUFFER_ORG_ID}`,
      `BUFFER_CHANNEL_LINKEDIN_ID=${BUFFER_CHANNELS.linkedin}`,
      `BUFFER_CHANNEL_TWITTER_ID=${BUFFER_CHANNELS.twitter}`,
      `BUFFER_CHANNEL_FACEBOOK_ID=${BUFFER_CHANNELS.facebook_psa}`,
      `BUFFER_CHANNEL_GOOGLEBUSINESS_ID=${BUFFER_CHANNELS.googlebusiness}`,
      'BUFFER_DEDUP_WINDOW_DAYS=30',
      'BUFFER_SCHEDULER_POSTS_PER_FEED=5',
    ],
    testSlug: 'police-station-rep-kent',
    productionUrl: 'https://www.policestationagent.com',
  },
];

/** Vercel project names from `vercel project ls` (team: robert-cashmans-projects). */
export const VERCEL_BUFFER_PROJECTS = [
  {
    site: 'policestationrepuk.org',
    project: 'policestationrepuk-new',
    cwd: REPUK_ROOT,
    productionUrl: 'https://policestationrepuk.org',
    env: {
      BUFFER_ORGANIZATION_ID: BUFFER_ORG_ID,
      BUFFER_CHANNEL_TWITTER_ID: BUFFER_CHANNELS.twitter,
      BUFFER_CHANNEL_LINKEDIN_ID: BUFFER_CHANNELS.linkedin,
      BUFFER_CHANNEL_GOOGLEBUSINESS_ID: BUFFER_CHANNELS.googlebusiness,
      BUFFER_CONTENT_FEEDS: REPUK_BUFFER_CONTENT_FEEDS,
      BUFFER_DEDUP_WINDOW_DAYS: '30',
      BUFFER_SCHEDULER_POSTS_PER_FEED: '5',
    },
    secretKeys: ['BUFFER_API_KEY', 'CRON_SECRET'],
  },
  {
    site: 'psrtrain.com',
    project: 'pstrain-rebuild',
    cwd: path.join(HOME, 'pstrain-rebuild'),
    productionUrl: 'https://psrtrain.com',
    env: {
      BUFFER_ORGANIZATION_ID: BUFFER_ORG_ID,
      BUFFER_CHANNEL_LINKEDIN_ID: BUFFER_CHANNELS.linkedin,
      BUFFER_CHANNEL_TWITTER_ID: BUFFER_CHANNELS.twitter,
      BUFFER_CHANNEL_FACEBOOK_ID: BUFFER_CHANNELS.facebook_robert_cashman,
      BUFFER_DEDUP_WINDOW_DAYS: '30',
      BUFFER_SCHEDULER_POSTS_PER_FEED: '5',
    },
    secretKeys: ['BUFFER_API_KEY', 'CRON_SECRET'],
    testSlug: 'first-week-psras-revision-plan',
    cron: { path: '/api/buffer/schedule', schedule: '15 6 * * *' },
  },
  {
    site: 'custodynote.com',
    project: 'custody-note-website',
    cwd: path.join(HOME, 'custody-note-website'),
    productionUrl: 'https://custodynote.com',
    env: {
      BUFFER_ORGANIZATION_ID: BUFFER_ORG_ID,
      BUFFER_CHANNEL_LINKEDIN_ID: BUFFER_CHANNELS.linkedin,
      BUFFER_CHANNEL_FACEBOOK_ID: BUFFER_CHANNELS.facebook_criminal_solicitor,
      BUFFER_CHANNEL_GOOGLEBUSINESS_ID: BUFFER_CHANNELS.googlebusiness,
      BUFFER_DEDUP_WINDOW_DAYS: '30',
      BUFFER_SCHEDULER_POSTS_PER_FEED: '5',
    },
    secretKeys: ['BUFFER_API_KEY', 'CRON_SECRET'],
    testSlug: 'what-makes-a-good-attendance-note',
    cron: { path: '/api/buffer/schedule', schedule: '25 6 * * *' },
  },
  {
    site: 'policestationagent.com',
    project: 'web44ai',
    cwd: path.join(HOME, 'policestationagent'),
    productionUrl: 'https://www.policestationagent.com',
    env: {
      BUFFER_ORGANIZATION_ID: BUFFER_ORG_ID,
      BUFFER_CHANNEL_LINKEDIN_ID: BUFFER_CHANNELS.linkedin,
      BUFFER_CHANNEL_TWITTER_ID: BUFFER_CHANNELS.twitter,
      BUFFER_CHANNEL_FACEBOOK_ID: BUFFER_CHANNELS.facebook_psa,
      BUFFER_CHANNEL_GOOGLEBUSINESS_ID: BUFFER_CHANNELS.googlebusiness,
      BUFFER_DEDUP_WINDOW_DAYS: '30',
      BUFFER_SCHEDULER_POSTS_PER_FEED: '5',
    },
    secretKeys: ['BUFFER_API_KEY', 'CRON_SECRET'],
    testSlug: 'police-station-rep-kent',
    cron: { path: '/api/buffer/schedule', schedule: '10 6 * * *' },
  },
];
