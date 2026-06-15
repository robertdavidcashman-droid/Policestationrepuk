import { describe, expect, it } from 'vitest';
import { shouldIncludeMirrorPathInSitemap } from '@/lib/mirror-data';

describe('shouldIncludeMirrorPathInSitemap', () => {
  it('excludes legacy /blog paths that 301 to /Blog/', () => {
    expect(shouldIncludeMirrorPathInSitemap('blog')).toBe(false);
    expect(shouldIncludeMirrorPathInSitemap('blog/my-post-slug')).toBe(false);
  });

  it('allows canonical /Blog/ mirror paths (deduped with getAllBlogArticles)', () => {
    expect(shouldIncludeMirrorPathInSitemap('Blog/my-post-slug')).toBe(true);
  });

  it('includes normal mirror paths', () => {
    expect(shouldIncludeMirrorPathInSitemap('About')).toBe(true);
    expect(shouldIncludeMirrorPathInSitemap('Wiki/some-article')).toBe(true);
  });

  it('excludes register and legacy county landing paths', () => {
    expect(shouldIncludeMirrorPathInSitemap('register')).toBe(false);
    expect(shouldIncludeMirrorPathInSitemap('PoliceStationRepsKent')).toBe(false);
    expect(shouldIncludeMirrorPathInSitemap('policestationrepskent')).toBe(false);
  });
});
