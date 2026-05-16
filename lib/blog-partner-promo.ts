import type { BlogCategoryId } from '@/lib/blog/types';

/** Slugs / topics where exam-prep (PSR Train) is more relevant than custody notes alone. */
const PSR_TRAIN_TOPIC_RE =
  /\b(psras|accreditation|accredited|critical incident|cit exam|become a rep|how to become|portfolio|probationary|cardiff university|datalaw)\b/i;

export function prefersPsrTrainBlogPromo(input: {
  slug: string;
  title: string;
  primaryKeyword: string;
  categories: BlogCategoryId[];
}): boolean {
  const haystack = `${input.slug} ${input.title} ${input.primaryKeyword}`;
  if (PSR_TRAIN_TOPIC_RE.test(haystack)) return true;
  return false;
}
