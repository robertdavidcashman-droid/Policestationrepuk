import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { segmentCrawlContent } from '@/lib/segment-crawl-content';

function loadCrawl(slug: string) {
  const filePath = path.join(process.cwd(), 'content', 'crawl', `${slug}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

describe('segmentCrawlContent', () => {
  it('strips Wix breadcrumb junk and drops empty Contents TOC from InterviewUnderCaution mirror', () => {
    const data = loadCrawl('InterviewUnderCaution');
    const { intro, sections } = segmentCrawlContent(data);

    expect(intro.join(' ')).not.toMatch(/HomeResources/i);
    expect(sections.map((s) => s.text)).not.toContain('Contents');
    expect(sections.some((s) => /Police Caution/i.test(s.text))).toBe(true);
  });

  it('dedupes repeated headings and keeps the richer section body', () => {
    const { sections } = segmentCrawlContent({
      title: 'Test Guide',
      headings: [
        { level: 1, text: 'Test Guide' },
        { level: 2, text: 'Overview' },
        { level: 2, text: 'Overview' },
      ],
      content:
        'HomeResourcesTest GuideOverviewShort.OverviewThis is the longer overview body with enough detail for advice.',
    });

    const overview = sections.filter((s) => s.text === 'Overview');
    expect(overview).toHaveLength(1);
    expect(overview[0].paragraphs.join(' ')).toContain('longer overview');
  });

  it('filters footer noise headings on crawl mirrors', () => {
    const data = loadCrawl('WhatDoesRepDo');
    const { sections } = segmentCrawlContent(data);
    const texts = sections.map((s) => s.text.toLowerCase());
    expect(texts).not.toContain('directories');
    expect(texts).not.toContain('regulatory notice');
  });
});
