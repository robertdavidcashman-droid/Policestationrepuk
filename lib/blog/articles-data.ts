import type { BlogArticle } from './types';
import { ARTICLES_BATCH_1 } from './articles-batch-1';
import { ARTICLES_BATCH_2 } from './articles-batch-2';
import { ARTICLES_BATCH_3 } from './articles-batch-3';
import { ARTICLES_BATCH_4 } from './articles-batch-4';
import { ARTICLES_BATCH_5 } from './articles-batch-5';
import { NEW_BLOG_SLUGS_LIST } from './legacy-blog-slugs';

export const BLOG_ARTICLES: BlogArticle[] = [
  ...ARTICLES_BATCH_1,
  ...ARTICLES_BATCH_2,
  ...ARTICLES_BATCH_3,
  ...ARTICLES_BATCH_4,
  ...ARTICLES_BATCH_5,
].sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());

const fromArticles = new Set(BLOG_ARTICLES.map((x) => x.slug));
const fromList = new Set<string>(NEW_BLOG_SLUGS_LIST as readonly string[]);
if (fromArticles.size !== fromList.size || ![...fromArticles].every((s) => fromList.has(s))) {
  throw new Error('lib/blog: BLOG_ARTICLES slugs must match NEW_BLOG_SLUGS_LIST in legacy-blog-slugs.ts');
}
