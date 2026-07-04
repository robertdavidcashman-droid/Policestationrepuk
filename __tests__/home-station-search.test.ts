import { describe, expect, it } from 'vitest';
import { buildStationsDirectorySearchUrl } from '@/lib/station-directory-links';

describe('buildStationsDirectorySearchUrl', () => {
  it('builds query URL for station search', () => {
    expect(buildStationsDirectorySearchUrl('Canterbury')).toBe(
      '/StationsDirectory?q=Canterbury',
    );
  });

  it('encodes spaces and ampersands', () => {
    expect(buildStationsDirectorySearchUrl('Medway & North')).toBe(
      '/StationsDirectory?q=Medway%20%26%20North',
    );
  });

  it('returns bare directory when query is empty', () => {
    expect(buildStationsDirectorySearchUrl('')).toBe('/StationsDirectory');
    expect(buildStationsDirectorySearchUrl('   ')).toBe('/StationsDirectory');
  });
});
