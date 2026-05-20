import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:3100/directory';
const width = parseInt(process.argv[3] || '390', 10);
const height = parseInt(process.argv[4] || '844', 10);

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width, height } });
const p = await ctx.newPage();
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
console.log('scrollWidth=', await p.evaluate(() => document.body.scrollWidth), 'innerWidth=', await p.evaluate(() => window.innerWidth));
const offenders = await p.evaluate((vw) => {
  const out = [];
  const walk = (el) => {
    if (!el || !(el instanceof HTMLElement)) return;
    const rect = el.getBoundingClientRect();
    const overflow = rect.right - vw;
    if (overflow > 4) {
      const id = el.id ? `#${el.id}` : '';
      const cls = el.className && typeof el.className === 'string' ? `.${el.className.split(/\s+/).slice(0, 3).join('.')}` : '';
      out.push({
        tag: el.tagName.toLowerCase(),
        id,
        cls,
        rectRight: Math.round(rect.right),
        scrollWidth: el.scrollWidth,
        text: (el.textContent || '').slice(0, 70).replace(/\s+/g, ' ').trim(),
      });
    }
    for (const c of Array.from(el.children)) walk(c);
  };
  walk(document.body);
  return out.slice(0, 20);
}, width);
for (const o of offenders) {
  console.log(`${o.tag}${o.id}${o.cls} right=${o.rectRight} scrollW=${o.scrollWidth} :: ${o.text}`);
}
await b.close();
