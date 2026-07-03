/** Extract and normalize article URLs embedded in Buffer post text. */

const ARTICLE_URL_RE = /https?:\/\/[^\s)\]>]+/;

/** Strip trailing punctuation often captured when parsing URLs from prose. */
export function stripTrailingUrlPunctuation(url: string): string {
  return url.trim().replace(/[.,;:!?)]+$/g, '');
}

/** First http(s) URL in post text, normalized (no trailing punctuation). */
export function extractArticleUrlFromText(text: string): string {
  const match = text.match(ARTICLE_URL_RE);
  if (!match) return '';
  try {
    const cleaned = stripTrailingUrlPunctuation(match[0]);
    return new URL(cleaned).href;
  } catch {
    return '';
  }
}

/** Slug from the last path segment of a URL in post text. */
export function slugFromPostText(text: string): string | null {
  const url = extractArticleUrlFromText(text);
  if (!url) return null;
  try {
    return new URL(url).pathname.split('/').filter(Boolean).pop() ?? null;
  } catch {
    return null;
  }
}

export function parseFeedFromArticleUrl(url: string): string {
  if (url.includes('policestationrepuk.org')) return 'policestationrepuk';
  if (url.includes('custodynote.com')) return 'custodynote';
  if (url.includes('policestationagent.com')) return 'policestationagent';
  if (url.includes('psrtrain.com')) return 'psrtrain';
  return 'unknown';
}
