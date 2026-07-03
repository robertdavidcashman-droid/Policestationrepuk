import { describe, expect, it } from 'vitest';
import {
  extractArticleUrlFromText,
  slugFromPostText,
  stripTrailingUrlPunctuation,
} from '@/lib/buffer/article-url';

describe('buffer article-url helpers', () => {
  it('strips trailing punctuation from URLs', () => {
    expect(stripTrailingUrlPunctuation('https://example.com/post.')).toBe('https://example.com/post');
    expect(stripTrailingUrlPunctuation('https://example.com/post)')).toBe('https://example.com/post');
  });

  it('extracts clean article URL from post text', () => {
    const text =
      'Title here\n\nRead more at https://policestationrepuk.org/Blog/my-slug.\n\nThanks!';
    expect(extractArticleUrlFromText(text)).toBe('https://policestationrepuk.org/Blog/my-slug');
  });

  it('derives slug from post text URL', () => {
    const text = 'Hello\n\nhttps://www.policestationagent.com/blog/kent-cover';
    expect(slugFromPostText(text)).toBe('kent-cover');
  });
});
