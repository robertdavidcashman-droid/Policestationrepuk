import { describe, expect, it } from 'vitest';
import { stationDirectoryHref } from '@/lib/station-directory-links';

describe('stationDirectoryHref', () => {
  it('links to county-filtered directory', () => {
    expect(stationDirectoryHref('Kent')).toBe('/StationsDirectory?county=Kent');
  });

  it('links to force-filtered directory', () => {
    expect(stationDirectoryHref(undefined, 'Kent Police')).toBe(
      '/StationsDirectory?force=Kent%20Police',
    );
  });

  it('defaults to unfiltered directory', () => {
    expect(stationDirectoryHref()).toBe('/StationsDirectory');
  });
});
