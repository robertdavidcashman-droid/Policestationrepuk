import { test, expect } from '@playwright/test';

test.describe('Legacy URL redirects', () => {
  const permanentRedirect = (status: number) => status === 301 || status === 308;

  test('/Home and /home redirect to homepage', async ({ request, baseURL }) => {
    for (const path of ['/Home', '/home']) {
      const res = await request.get(new URL(path, baseURL!).toString(), { maxRedirects: 0 });
      expect(permanentRedirect(res.status()), `${path} should permanently redirect`).toBe(true);
      expect(res.headers().location).toMatch(/\/$/);
    }
  });

  test('unknown Wix blog slug redirects to /Blog hub', async ({ request, baseURL }) => {
    const res = await request.get(
      new URL('/Blog/welcome-to-our-blog', baseURL!).toString(),
      { maxRedirects: 0 },
    );
    expect(permanentRedirect(res.status())).toBe(true);
    expect(res.headers().location).toMatch(/\/Blog$/);
  });

  test('known legacy blog slug redirects to canonical article', async ({ request, baseURL }) => {
    const res = await request.get(
      new URL('/Blog/police-station-representation', baseURL!).toString(),
      { maxRedirects: 0 },
    );
    expect(permanentRedirect(res.status())).toBe(true);
    expect(res.headers().location).toMatch(
      /\/Blog\/what-does-a-freelance-police-station-representative-do$/,
    );
  });
});
