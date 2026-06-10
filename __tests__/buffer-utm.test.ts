import { describe, expect, it } from 'vitest';
import {
  buildSchedulablePostText,
  buildSchedulablePostTextForService,
  withBufferSocialUtm,
} from '@/lib/buffer/scheduler-core';
import type { SchedulablePost } from '@/lib/buffer/content-types';

const post: SchedulablePost = {
  feedId: 'psrtrain',
  slug: 'cit-prep',
  title: 'CIT prep guide',
  excerpt: 'Practice scenarios for the Critical Incidents Test.',
  url: 'https://psrtrain.com/guides/cit-prep',
  imageAlt: 'CIT prep',
};

describe('buffer social UTM tagging', () => {
  it('appends buffer UTMs to schedulable post URLs', () => {
    const url = withBufferSocialUtm(post.url, 'psrtrain', 'twitter');
    expect(url).toContain('utm_source=buffer');
    expect(url).toContain('utm_medium=social');
    expect(url).toContain('utm_campaign=psrtrain_twitter');
  });

  it('includes tagged URL in full post text', () => {
    const text = buildSchedulablePostText(post, { feedId: 'psrtrain', service: 'linkedin' });
    expect(text).toContain('utm_source=buffer');
    expect(text).toContain('utm_campaign=psrtrain_linkedin');
  });

  it('uses tagged URL in twitter-truncated text suffix', () => {
    const long: SchedulablePost = {
      ...post,
      title: 'A'.repeat(300),
    };
    const text = buildSchedulablePostTextForService(long, 'twitter');
    expect(text).toContain('utm_source=buffer');
    expect(text.length).toBeLessThanOrEqual(280);
  });
});
