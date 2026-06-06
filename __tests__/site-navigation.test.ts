import { describe, expect, it } from 'vitest';
import {
  FOOTER_COMMUNITY,
  FOOTER_DIRECTORIES,
  FOOTER_FEES_FORMS,
  FOOTER_GUIDES,
  FOOTER_LEGAL,
  FOOTER_LINK_COLUMNS,
  FOOTER_PARTNERS,
  FOOTER_TOOLS,
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

  it('footer link grid has seven columns', () => {
    expect(FOOTER_LINK_COLUMNS).toHaveLength(7);
    expect(FOOTER_LINK_COLUMNS.map((c) => c.title)).toEqual([
      'Directories',
      'For reps',
      'Guides',
      'Fees & forms',
      'Community',
      'Legal',
      'Partners & SEO',
    ]);
  });

  it('each footer column has unique hrefs within the column', () => {
    for (const column of FOOTER_LINK_COLUMNS) {
      const hrefs = column.links.map((l) => l.href);
      expect(new Set(hrefs).size, column.title).toBe(hrefs.length);
    }
  });

  it('footer partners column does not repeat directory, community, or legal links', () => {
    const partnerHrefs = new Set(FOOTER_PARTNERS.map((l) => l.href));
    const sharedColumnHrefs = [
      ...FOOTER_DIRECTORIES,
      ...FOOTER_COMMUNITY,
      ...FOOTER_LEGAL,
    ].map((l) => l.href);
    for (const href of sharedColumnHrefs) {
      expect(partnerHrefs.has(href), href).toBe(false);
    }
  });

  it('FOOTER_TOOLS is guides plus fees only', () => {
    expect(FOOTER_TOOLS).toEqual([...FOOTER_GUIDES, ...FOOTER_FEES_FORMS]);
  });

  it('FOOTER_PARTNERS includes partner and SEO landing pages', () => {
    const hrefs = FOOTER_PARTNERS.map((l) => l.href);
    expect(hrefs).toContain('/links');
    expect(hrefs).toContain('/CustodyNote');
    expect(hrefs).toContain('/police-station-rep-kent');
    expect(hrefs.some((h) => h.includes('psrtrain'))).toBe(true);
  });
});
