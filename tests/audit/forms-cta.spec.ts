import { test, expect } from '@playwright/test';
import { ENTRY_POINTS } from './helpers/routes';

const EMAIL_RE = /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+/i;
// UK emergency numbers (999, 101) are 3 digits — allow 3+ digits.
const TEL_RE = /^tel:\+?[0-9 ()-]{3,}$/i;
const WHATSAPP_RE = /^https:\/\/(wa\.me|api\.whatsapp\.com)\//i;

test.describe('Forms and CTA links', () => {
  test('every form on key pages has a labelled action', async ({ page }) => {
    const failures: string[] = [];
    for (const route of ['/Contact', '/register', '/Account']) {
      const res = await page.goto(route, { waitUntil: 'domcontentloaded' });
      if (res?.status() !== 200) {
        failures.push(`${route} returned ${res?.status()}`);
        continue;
      }
      const forms = page.locator('form');
      const count = await forms.count();
      if (count === 0) {
        failures.push(`${route} has no <form>`);
        continue;
      }
      for (let i = 0; i < count; i++) {
        const form = forms.nth(i);
        const inputs = await form
          .locator('input:not([type=hidden]), textarea, select')
          .evaluateAll((nodes) =>
            nodes.map((el) => {
              const id = el.getAttribute('id') || '';
              const ariaLabel = el.getAttribute('aria-label') || '';
              const ariaLabelledBy = el.getAttribute('aria-labelledby') || '';
              const placeholder = (el as HTMLInputElement).placeholder || '';
              const required = el.hasAttribute('required');
              const type = (el as HTMLInputElement).type || el.tagName.toLowerCase();
              return { id, ariaLabel, ariaLabelledBy, placeholder, required, type };
            }),
          );
        for (const input of inputs) {
          const labelLocator = input.id ? `label[for="${input.id}"]` : null;
          const hasLabel = labelLocator
            ? (await page.locator(labelLocator).count()) > 0
            : Boolean(input.ariaLabel || input.ariaLabelledBy);
          if (input.required && !hasLabel && !input.placeholder) {
            failures.push(`${route} form ${i} input type=${input.type} missing label`);
          }
        }
      }
    }
    expect.soft(failures, failures.join('\n')).toEqual([]);
    expect(failures).toEqual([]);
  });

  test('mailto/tel/wa.me links use a valid format', async ({ page }) => {
    const bad: string[] = [];
    for (const route of ENTRY_POINTS.slice(0, 6)) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const hrefs = await page.locator('a[href]').evaluateAll((nodes) =>
        nodes.map((el) => (el as HTMLAnchorElement).getAttribute('href') || ''),
      );
      for (const href of hrefs) {
        if (href.startsWith('mailto:') && !EMAIL_RE.test(href)) bad.push(`${route}: malformed ${href}`);
        if (href.startsWith('tel:') && !TEL_RE.test(href)) bad.push(`${route}: malformed ${href}`);
        if (/wa\.me\//i.test(href) && !WHATSAPP_RE.test(href)) bad.push(`${route}: malformed ${href}`);
      }
    }
    expect.soft(bad, bad.join('\n')).toEqual([]);
    expect(bad).toEqual([]);
  });

  test('every target="_blank" link sets rel="noopener noreferrer"', async ({ page }) => {
    const missing: string[] = [];
    for (const route of ENTRY_POINTS.slice(0, 6)) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const offenders = await page
        .locator('a[target="_blank"]')
        .evaluateAll((nodes) =>
          nodes
            .map((el) => ({
              href: (el as HTMLAnchorElement).getAttribute('href') || '',
              rel: (el as HTMLAnchorElement).getAttribute('rel') || '',
            }))
            .filter(({ rel }) => !/noopener/i.test(rel) || !/noreferrer/i.test(rel)),
        );
      for (const o of offenders) missing.push(`${route}: ${o.href} rel="${o.rel}"`);
    }
    expect.soft(missing, missing.join('\n')).toEqual([]);
    expect(missing).toEqual([]);
  });
});
