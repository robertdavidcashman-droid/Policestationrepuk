import { describe, expect, it } from 'vitest';
import {
  NEW_BLOG_SLUGS_LIST,
  resolveLegacyBlogRedirect,
} from '@/lib/blog/legacy-blog-slugs';

describe('resolveLegacyBlogRedirect', () => {
  it('returns null for current editorial slugs', () => {
    for (const slug of NEW_BLOG_SLUGS_LIST.slice(0, 3)) {
      expect(resolveLegacyBlogRedirect(slug)).toBeNull();
    }
  });

  it('maps known Wix slugs to specific articles', () => {
    expect(resolveLegacyBlogRedirect('police-station-representation')).toBe(
      '/Blog/what-does-a-freelance-police-station-representative-do',
    );
    expect(resolveLegacyBlogRedirect('whats-a-duty-solicitor')).toBe(
      '/Blog/freelance-police-station-representative-vs-duty-solicitor',
    );
  });

  it('maps topic slugs via keyword rules', () => {
    expect(resolveLegacyBlogRedirect('some-unknown-voluntary-interview-guide')).toBe(
      '/Blog/police-station-attendance-checklist',
    );
  });

  it('redirects unknown legacy slugs to the blog hub instead of 404', () => {
    expect(resolveLegacyBlogRedirect('totally-unknown-wix-post-from-2019')).toBe('/Blog');
  });
});
