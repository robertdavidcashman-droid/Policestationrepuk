import { describe, expect, it } from 'vitest';
import {
  isRejectedRepDirectoryPhone,
  isTrustworthyPsrCustodyCandidate,
  parseRepDirectoryStationHtml,
  repDirectoryUrlCandidates,
  repDirectoryUrlFromSlug,
} from '@/lib/rep-directory-parse';

describe('repDirectoryUrlFromSlug', () => {
  it('builds policestationreps.com URL from slug', () => {
    expect(repDirectoryUrlFromSlug('maidstone-police-station')).toBe(
      'https://www.policestationreps.com/Police_Stations/Maidstone-Police-Station.php',
    );
  });
});

describe('isRejectedRepDirectoryPhone', () => {
  it('rejects 0845 switchboards and No Comment mobile', () => {
    expect(isRejectedRepDirectoryPhone('08452 777444', 'custody')).toBe(true);
    expect(isRejectedRepDirectoryPhone('07534 533 070', 'custody')).toBe(true);
  });

  it('rejects mobile numbers for custody', () => {
    expect(isRejectedRepDirectoryPhone('07911 123456', 'custody')).toBe(true);
  });
});

describe('parseRepDirectoryStationHtml', () => {
  it('extracts labelled custody and main numbers', () => {
    const html = `
      <p>Custody: 01622 690999</p>
      <p>General: 101</p>
    `;
    const parsed = parseRepDirectoryStationHtml(html, 'https://example.com');
    expect(parsed.custodyPhone).toBe('01622 690999');
    expect(parsed.sourceUrl).toBe('https://example.com');
  });

  it('ignores custody lines that say see below', () => {
    const html = `<p>Custody: see below for number</p><p>Custody: 01234 567890</p>`;
    const parsed = parseRepDirectoryStationHtml(html, 'https://example.com');
    expect(parsed.custodyPhone).toBe('01234 567890');
  });

  it('does not use General line when Custody is See Below', () => {
    const html = `
      <tr><td id='tdLeft03'>General:</td><td><a href='tel:01634 891 055'>01634 891 055</a></td></tr>
      <tr><td id='tdLeft04'>Custody:</td><td><a href='tel:See Below'>See Below</a></td></tr>
      handcuffs.png
    `;
    const parsed = parseRepDirectoryStationHtml(html, 'https://www.policestationreps.com/x');
    expect(parsed.custodyPhone).toBeUndefined();
    expect(parsed.custodySeeBelow).toBe(true);
    expect(parsed.mainPhone).toBe('01634 891 055');
    expect(isTrustworthyPsrCustodyCandidate(parsed)).toBe(false);
  });

  it('accepts labelled custody row tel: links only', () => {
    const html = `
      <tr><td id='tdLeft04'>Custody:</td><td><a href='tel:020 8529 8666'>020 8529 8666</a></td></tr>
    `;
    const parsed = parseRepDirectoryStationHtml(html, 'https://www.policestationreps.com/x');
    expect(parsed.custodyPhone).toBe('020 8529 8666');
    expect(parsed.custodySource).toBe('labeled_row');
    expect(isTrustworthyPsrCustodyCandidate(parsed)).toBe(true);
  });

  it('ignores No Comment footer in sidebar', () => {
    const html = `
      <tr><td id='tdLeft03'>General:</td><td><a href='tel:101'>101</a></td></tr>
      <section id='content'><mat><a href='tel:07534533070'>07534 533 070</a></mat></section>
    `;
    const parsed = parseRepDirectoryStationHtml(html, 'https://www.policestationreps.com/x');
    expect(parsed.mainPhone).toBeUndefined();
  });

  it('offers multiple URL candidates for slug variants', () => {
    const urls = repDirectoryUrlCandidates('medway-police-station', 'Medway');
    expect(urls.some((u) => u.includes('Medway'))).toBe(true);
  });
});
