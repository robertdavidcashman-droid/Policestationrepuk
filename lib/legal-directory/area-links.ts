import { LEGAL_DIRECTORY_BASE } from './constants';
import { getLocationBySlug, LEGAL_DIRECTORY_LOCATIONS } from './locations';
import { slugifyLegalDirectory } from './slug';

/** Resolve a county or region label to a legal directory location hub URL. */
export function legalDirectoryHrefForAreaName(
  areaLabel: string | undefined | null,
): string | null {
  const raw = (areaLabel || '').trim();
  if (!raw) return null;

  const slug = slugifyLegalDirectory(raw);
  if (getLocationBySlug(slug)) {
    return `${LEGAL_DIRECTORY_BASE}/location/${slug}`;
  }

  const lower = raw.toLowerCase();
  const direct = LEGAL_DIRECTORY_LOCATIONS.find((l) => l.label.toLowerCase() === lower);
  if (direct) return `${LEGAL_DIRECTORY_BASE}/location/${direct.slug}`;

  const partial = LEGAL_DIRECTORY_LOCATIONS.find(
    (l) => lower.includes(l.label.toLowerCase()) || l.label.toLowerCase().includes(lower),
  );
  if (partial) return `${LEGAL_DIRECTORY_BASE}/location/${partial.slug}`;

  return null;
}
