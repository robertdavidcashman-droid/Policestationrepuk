/** Normalised post from any content feed (local blog or RSS). */
export interface SchedulablePost {
  feedId: string;
  slug: string;
  title: string;
  excerpt: string;
  url: string;
}

export type ContentFeedSource =
  | { id: string; type: 'local' }
  | { id: string; type: 'rss'; url: string };
