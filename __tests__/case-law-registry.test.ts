import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { VERIFIED_CASES } from '@/lib/case-law-registry';
import { BLOG_ARTICLES } from '@/lib/blog/articles-data';

const KNOWN_BAD_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: 'ATH v R', re: /\bATH v R\b/i },
  { label: 'R v Dobson (BWV)', re: /R v Dobson.*BWV|BWV.*R v Dobson/i },
  { label: 'ex parte Dhesi', re: /ex parte Dhesi|Inland Revenue.*Dhesi/i },
  { label: 'R v Ghosh', re: /\bR v Ghosh\b/i },
  { label: 'Bail Act 2024', re: /Bail Act 2024/i },
];

function editorialCorpus(): string {
  const wikiPath = path.join(process.cwd(), 'data/wiki-articles.json');
  const wiki = JSON.parse(fs.readFileSync(wikiPath, 'utf8')) as Array<{ content: string }>;
  const blog = BLOG_ARTICLES.map((a) =>
    [a.bodyMarkdown, a.summary, ...(a.faqs?.map((f) => `${f.q} ${f.a}`) ?? [])].join('\n')
  ).join('\n');
  const wikiText = wiki.map((a) => a.content).join('\n');
  return `${blog}\n${wikiText}`;
}

describe('case-law registry', () => {
  it('has unique ids and citations', () => {
    const ids = VERIFIED_CASES.map((c) => c.id);
    const citations = VERIFIED_CASES.map((c) => c.citation);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(citations).size).toBe(citations.length);
  });

  it('every entry has at least one verified source URL', () => {
    for (const c of VERIFIED_CASES) {
      expect(c.verifiedSources.length, c.id).toBeGreaterThan(0);
      for (const url of c.verifiedSources) {
        expect(url).toMatch(/^https:\/\//);
      }
    }
  });

  it('does not include known hallucinated or removed citations', () => {
    const names = VERIFIED_CASES.map((c) => c.name);
    expect(names.some((n) => n.includes('ATH'))).toBe(false);
    expect(names.some((n) => n.includes('Dobson'))).toBe(false);
    expect(names.some((n) => n.includes('Dhesi'))).toBe(false);
    expect(names.some((n) => n === 'R v Ghosh')).toBe(false);
  });

  it('blog and wiki markdown contain no known-bad citation patterns', () => {
    const text = editorialCorpus();
    for (const { label, re } of KNOWN_BAD_PATTERNS) {
      expect(re.test(text), `found ${label} in blog/wiki corpus`).toBe(false);
    }
  });
});
