#!/usr/bin/env npx tsx
/** Build PSA Kent brochure PDF from HTML template. */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { buildBrochureHtml } from '../lib/firm-outreach/brochure/template.html';
import { BROCHURE_PUBLIC_PATH } from '../lib/firm-outreach/brochure/load-attachment';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const html = buildBrochureHtml();
  const chromePaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ].filter(Boolean) as string[];

  let browser;
  for (const executablePath of chromePaths) {
    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      break;
    } catch {
      // try next
    }
  }
  if (!browser) {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  }
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });
    mkdirSync(dirname(BROCHURE_PUBLIC_PATH), { recursive: true });
    writeFileSync(BROCHURE_PUBLIC_PATH, pdf);
    console.log('[brochure-pdf] wrote', BROCHURE_PUBLIC_PATH, `(${pdf.length} bytes)`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('[brochure-pdf] failed:', err);
  process.exit(1);
});
