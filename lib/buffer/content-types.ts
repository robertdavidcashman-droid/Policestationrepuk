/** Normalised post from any content feed (local blog or RSS). */
export interface SchedulablePost {
  feedId: string;
  slug: string;
  title: string;
  excerpt: string;
  url: string;
  imageUrl?: string;
  /** Resolved self-hosted JPEG/PNG for Google Business scheduling. */
  googleBusinessImageUrl?: string;
  imageAlt?: string;
}

type FeedScheduleOverrides = {
  /** Posts per day for this feed (default: BUFFER_SCHEDULER_POSTS_PER_FEED). */
  postsPerDay?: number;
  /** Daytime slots; must sum with nightPosts to postsPerDay when both are set. */
  dayPosts?: number;
  /** Nighttime slots; must sum with dayPosts to postsPerDay when both are set. */
  nightPosts?: number;
};

export type ContentFeedSource =
  | ({ id: string; type: 'local' } & FeedScheduleOverrides)
  | ({ id: string; type: 'rss'; url: string } & FeedScheduleOverrides);
