import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { CRAWL_CONTENT_PAGES } from './helpers/routes';
import { collectRenderReport, flaggedIssues } from './helpers/page-checks';

const REPORT_DIR = path.join(process.cwd(), 'reports');

interface AuditEntry {
  url: string;
  issues: string[];
  h1Count: number;
  longestParagraphChars: number;
  longestParagraphSnippet: string;
  rawMarkdownDetected: boolean;
  objectObjectDetected: boolean;
  duplicateTitleInBody: boolean;
}

test.describe('Article rendering', () => {
  for (const route of CRAWL_CONTENT_PAGES) {
    test(`${route} renders cleanly`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `${route} status`).toBe(200);
      const report = await collectRenderReport(page, route, response);
      const issues = flaggedIssues(report);

      const perRouteDir = path.join(REPORT_DIR, 'article-rendering');
      fs.mkdirSync(perRouteDir, { recursive: true });
      const safe = route.replace(/[^A-Za-z0-9-]+/g, '_').replace(/^_|_$/g, '');
      const entry: AuditEntry = {
        url: route,
        issues,
        h1Count: report.h1Count,
        longestParagraphChars: report.longestParagraphChars,
        longestParagraphSnippet: report.longestParagraphSnippet,
        rawMarkdownDetected: report.rawMarkdownDetected,
        objectObjectDetected: report.objectObjectDetected,
        duplicateTitleInBody: report.duplicateTitleInBody,
      };
      fs.writeFileSync(path.join(perRouteDir, `${safe || 'root'}.json`), JSON.stringify(entry, null, 2));

      expect.soft(issues, `${route}: ${issues.join(', ')}`).toEqual([]);
      expect(issues).toEqual([]);
    });
  }
});

test.describe('Blog article rendering (sample)', () => {
  test('first 5 published blog posts render cleanly', async ({ page, request, baseURL }) => {
    const base = baseURL!;
    const res = await page.goto('/Blog');
    expect(res?.status()).toBe(200);
    const slugs = await page
      .locator('a[href^="/Blog/"]')
      .evaluateAll((nodes) =>
        nodes
          .map((el) => (el as HTMLAnchorElement).getAttribute('href') || '')
          .filter((h) => /^\/Blog\/[a-z0-9-]+$/i.test(h))
          .slice(0, 5),
      );

    if (slugs.length === 0) test.skip();

    const failures: string[] = [];
    for (const slug of slugs) {
      const r = await page.goto(slug, { waitUntil: 'domcontentloaded' });
      const report = await collectRenderReport(page, slug, r);
      const issues = flaggedIssues(report);
      if (issues.length) failures.push(`${slug}: ${issues.join(', ')}`);
    }

    expect.soft(failures, failures.join('\n')).toEqual([]);
    expect(failures).toEqual([]);
    void request;
    void base;
  });
});
