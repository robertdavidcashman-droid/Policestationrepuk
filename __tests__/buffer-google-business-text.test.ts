import { describe, expect, it } from 'vitest';
import {
  containsGoogleBusinessPhoneNumber,
  sanitizeGoogleBusinessPostText,
} from '@/lib/buffer/google-business-text';
import { buildSchedulablePostTextForService } from '@/lib/buffer/scheduler-core';
import type { SchedulablePost } from '@/lib/buffer/content-types';

describe('sanitizeGoogleBusinessPostText', () => {
  it('strips UK mobile numbers', () => {
    const text = 'Join our WhatsApp group — text 07535 494446 with your name.';
    expect(sanitizeGoogleBusinessPostText(text)).toBe(
      'Join our WhatsApp group — text with your name.',
    );
    expect(containsGoogleBusinessPhoneNumber(text)).toBe(true);
    expect(containsGoogleBusinessPhoneNumber(sanitizeGoogleBusinessPostText(text))).toBe(false);
  });

  it('strips landline and parenthesised formats', () => {
    const text = 'Kent cover: call (01732) 247427 or use the directory.';
    expect(sanitizeGoogleBusinessPostText(text)).toBe('Kent cover: call or use the directory.');
  });

  it('strips +44 international format', () => {
    const text = 'Contact +44 7535 494446 for urgent cover.';
    expect(sanitizeGoogleBusinessPostText(text)).toBe('Contact for urgent cover.');
  });

  it('preserves URLs without phone-like segments', () => {
    const url = 'https://policestationrepuk.org/Blog/example?utm_source=buffer';
    const text = `New guide\n\nRead more.\n\n${url}`;
    expect(sanitizeGoogleBusinessPostText(text)).toBe(`New guide\nRead more.\n${url}`);
  });
});

describe('buildSchedulablePostTextForService googlebusiness', () => {
  const post: SchedulablePost = {
    feedId: 'policestationrepuk',
    slug: 'arrange-solicitor-someone-in-custody',
    title: 'Arrange a solicitor for someone in custody',
    excerpt: 'Family can call 07535 494446 or search the free rep directory.',
    url: 'https://policestationrepuk.org/Blog/arrange-solicitor-someone-in-custody',
    imageAlt: 'Custody advice',
  };

  it('removes phone numbers from GBP post text', () => {
    const text = buildSchedulablePostTextForService(post, 'googlebusiness');
    expect(text).not.toMatch(/07535/);
    expect(text).toContain('utm_source=buffer');
    expect(text).toContain(post.title);
  });

  it('leaves linkedin text unchanged', () => {
    const text = buildSchedulablePostTextForService(post, 'linkedin');
    expect(text).toContain('07535 494446');
  });
});
