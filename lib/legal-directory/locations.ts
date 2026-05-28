import { ENGLISH_COUNTIES } from '@/lib/english-counties';
import { slugifyLegalDirectory } from './slug';
import { UK_REGIONS } from './constants';

export interface LegalDirectoryLocation {
  slug: string;
  label: string;
  type: 'county' | 'region';
}

export const LEGAL_DIRECTORY_LOCATIONS: LegalDirectoryLocation[] = [
  ...ENGLISH_COUNTIES.map((name) => ({
    slug: slugifyLegalDirectory(name),
    label: name,
    type: 'county' as const,
  })),
  ...UK_REGIONS.map((name) => ({
    slug: slugifyLegalDirectory(name),
    label: name,
    type: 'region' as const,
  })),
];

const BY_SLUG = new Map(LEGAL_DIRECTORY_LOCATIONS.map((l) => [l.slug, l]));

export function getLocationBySlug(slug: string): LegalDirectoryLocation | undefined {
  return BY_SLUG.get(slug);
}

export function matchListingToLocation(
  listing: { county: string; town: string; region: string; areasCovered: string },
  locationSlug: string,
): boolean {
  const loc = getLocationBySlug(locationSlug);
  if (!loc) return false;
  const label = loc.label.toLowerCase();
  const hay = `${listing.county} ${listing.town} ${listing.region} ${listing.areasCovered}`.toLowerCase();
  return hay.includes(label) || slugifyLegalDirectory(listing.county) === locationSlug;
}
