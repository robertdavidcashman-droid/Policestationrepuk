import { describe, expect, it } from 'vitest';
import {
  parseRepDirectoryStationHtml,
  repDirectoryUrlFromSlug,
} from '@/lib/rep-directory-parse';

describe('repDirectoryUrlFromSlug', () => {
  it('builds policestationreps.com URL from slug', () => {
    expect(repDirectoryUrlFromSlug('maidstone-police-station')).toBe(
      'https://www.policestationreps.com/Police_Stations/Maidstone-Police-Station.php',
    );
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
});
