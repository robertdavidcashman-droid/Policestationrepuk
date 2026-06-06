import { PSR_LEGAL_DIRECTORY_CATEGORY_SLUG } from './constants';

/** Footer label for category browse cards. */
export function getCategoryCardCountLabel(categorySlug: string, count: number): string {
  if (count > 0) {
    return `${count} provider${count === 1 ? '' : 's'}`;
  }
  if (categorySlug === PSR_LEGAL_DIRECTORY_CATEGORY_SLUG) {
    return '180+ reps in main directory →';
  }
  return 'No approved listings yet';
}
