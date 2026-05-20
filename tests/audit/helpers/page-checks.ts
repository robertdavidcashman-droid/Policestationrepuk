import type { Page, Response } from '@playwright/test';

export interface PageRenderReport {
  url: string;
  status: number | null;
  redirected: boolean;
  finalUrl: string;
  title: string;
  description: string;
  canonical: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  h1Count: number;
  h1Texts: string[];
  longestParagraphChars: number;
  longestParagraphSnippet: string;
  rawMarkdownDetected: boolean;
  objectObjectDetected: boolean;
  duplicateTitleInBody: boolean;
}

const MAX_PARAGRAPH_CHARS = 2000;

export async function gotoQuiet(page: Page, url: string): Promise<Response | null> {
  return page.goto(url, { waitUntil: 'domcontentloaded' });
}

export async function collectRenderReport(page: Page, url: string, response: Response | null): Promise<PageRenderReport> {
  const title = await page.title().catch(() => '');
  const description = (await page.locator('meta[name="description"]').first().getAttribute('content').catch(() => null)) ?? '';
  const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href').catch(() => null);
  const ogTitle = await page.locator('meta[property="og:title"]').first().getAttribute('content').catch(() => null);
  const ogDescription = await page.locator('meta[property="og:description"]').first().getAttribute('content').catch(() => null);

  const h1Texts = await page.locator('h1').allInnerTexts().catch(() => []);

  const bodySample = await page
    .locator('main, article, .page-container')
    .first()
    .innerText({ timeout: 5_000 })
    .catch(() => '');

  const paragraphChars = await page
    .locator('p:not([data-legal-text])')
    .evaluateAll((nodes) =>
      nodes.map((el) => {
        const text = (el.textContent || '').trim();
        return { length: text.length, snippet: text.slice(0, 120) };
      }),
    )
    .catch(() => [] as Array<{ length: number; snippet: string }>);

  const longest = paragraphChars.reduce(
    (acc, cur) => (cur.length > acc.length ? cur : acc),
    { length: 0, snippet: '' },
  );

  const rawMarkdownDetected = /(^|\n)(#{1,6})\s+\S/.test(bodySample) || /(^|\s)\*\*[^*\n]+\*\*/.test(bodySample);
  const objectObjectDetected = bodySample.includes('[object Object]');

  // Title-in-body duplicate heuristic. The bodySample includes H1, breadcrumb, related-content
  // and footer CTA — so the title can legitimately appear several times. We only flag pages where
  // the title appears > 6 times AND the article body is short enough that the repetition is
  // structurally suspicious (we don't want to flag long-form pages where the title naturally
  // recurs in body prose, TOC, related links and footer CTAs).
  const titleStub = title.split('|')[0].split('—')[0].trim();
  let duplicateTitleInBody = false;
  if (titleStub.length > 12) {
    const occurrences = (bodySample.match(new RegExp(escapeRegExp(titleStub), 'g')) || []).length;
    duplicateTitleInBody = occurrences > 6;
  }

  return {
    url,
    status: response?.status() ?? null,
    redirected: response ? response.url() !== new URL(url, response.url()).href : false,
    finalUrl: response?.url() ?? url,
    title,
    description,
    canonical,
    ogTitle,
    ogDescription,
    h1Count: h1Texts.length,
    h1Texts,
    longestParagraphChars: longest.length,
    longestParagraphSnippet: longest.snippet,
    rawMarkdownDetected,
    objectObjectDetected,
    duplicateTitleInBody,
  };
}

export function flaggedIssues(report: PageRenderReport): string[] {
  const issues: string[] = [];
  if (report.status !== 200) issues.push(`status=${report.status}`);
  if (report.h1Count === 0) issues.push('no h1');
  if (report.h1Count > 1) issues.push(`multiple h1 (${report.h1Count})`);
  if (report.longestParagraphChars > MAX_PARAGRAPH_CHARS) {
    issues.push(`flattened paragraph (${report.longestParagraphChars} chars)`);
  }
  if (report.rawMarkdownDetected) issues.push('raw markdown visible');
  if (report.objectObjectDetected) issues.push('[object Object] visible');
  if (!report.title) issues.push('missing <title>');
  if (!report.description) issues.push('missing meta description');
  if (!report.canonical) issues.push('missing canonical');
  return issues;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export { MAX_PARAGRAPH_CHARS };
