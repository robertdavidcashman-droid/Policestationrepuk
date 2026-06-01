import { describe, expect, it } from 'vitest';
import {
  HEADER_NAV_DROPDOWNS,
  HEADER_NAV_MORE,
  HEADER_NAV_PRIMARY,
  buildHeaderMobileLinks,
} from '@/lib/site-navigation';

describe('site navigation', () => {
  it('has five desktop dropdown groups', () => {
    expect(HEADER_NAV_DROPDOWNS.map((g) => g.label)).toEqual([
      'Blog',
      'For Reps',
      'Guides',
      'Fees & Forms',
      'More',
    ]);
  });

  it('every dropdown has at least one link with href and text', () => {
    for (const group of HEADER_NAV_DROPDOWNS) {
      expect(group.links.length, group.label).toBeGreaterThan(0);
      for (const link of group.links) {
        expect(link.href, `${group.label}: href`).toBeTruthy();
        expect(link.text.trim(), `${group.label}: text`).toBeTruthy();
      }
    }
  });

  it('More menu includes directories, community, and legal entries', () => {
    const texts = HEADER_NAV_MORE.map((l) => l.text);
    expect(texts).toContain('Find a Rep');
    expect(texts.some((t) => /WhatsApp/i.test(t))).toBe(true);
    expect(texts).toContain('About');
    expect(HEADER_NAV_MORE.some((l) => l.href === '/HelpUsStationNumbers')).toBe(true);
  });

  it('mobile link builder dedupes hrefs', () => {
    const mobile = buildHeaderMobileLinks();
    const hrefs = mobile.map((l) => l.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(mobile.length).toBeGreaterThan(HEADER_NAV_PRIMARY.length);
  });
});
