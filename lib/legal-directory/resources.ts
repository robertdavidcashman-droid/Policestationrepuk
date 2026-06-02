/**
 * Legal Services Directory — curated official resource links.
 *
 * These are editorial, non-claimable entries (e.g. the CPS, SRA, Law Society).
 * They link out to authoritative official sites and are NOT provider listings:
 * there is no "claim this listing" flow and no contact-capture. They are loaded
 * from data/legal-resources.json so the curated list can be edited without code.
 */

import fs from 'fs';
import path from 'path';

/** Display grouping shown in the resources index. */
export type LegalResourceGroup =
  | 'Regulators'
  | 'Find a provider'
  | 'Legal aid'
  | 'Courts & prosecution'
  | 'Complaints & oversight'
  | 'News & guidance';

/** Coarse classification, mirrors the provider-listing verification tiers. */
export type LegalResourceTier =
  | 'regulator'
  | 'representation'
  | 'legal_aid'
  | 'courts'
  | 'complaints'
  | 'guidance';

export interface LegalResourceLink {
  slug: string;
  name: string;
  url: string;
  group: LegalResourceGroup;
  tier: LegalResourceTier;
  region: string;
  /** One-line summary for cards and meta descriptions. */
  shortDescription: string;
  /** Longer copy for the resource's own page. */
  description: string;
  /** ISO date (YYYY-MM-DD) the outbound link was last confirmed to resolve. */
  dateChecked: string;
}

/** Stable display order for resource groups. */
export const LEGAL_RESOURCE_GROUP_ORDER: LegalResourceGroup[] = [
  'Regulators',
  'Find a provider',
  'Legal aid',
  'Courts & prosecution',
  'Complaints & oversight',
  'News & guidance',
];

let _cache: LegalResourceLink[] | null = null;

function loadResources(): LegalResourceLink[] {
  if (_cache) return _cache;
  try {
    const filePath = path.join(process.cwd(), 'data', 'legal-resources.json');
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as LegalResourceLink[];
    _cache = Array.isArray(raw) ? raw : [];
  } catch {
    _cache = [];
  }
  return _cache;
}

export function getAllLegalResources(): LegalResourceLink[] {
  return loadResources();
}

export function getLegalResourceBySlug(slug: string): LegalResourceLink | undefined {
  return loadResources().find((r) => r.slug === slug);
}

export function getLegalResourceSlugs(): string[] {
  return loadResources().map((r) => r.slug);
}

/** Resources keyed by display group, preserving {@link LEGAL_RESOURCE_GROUP_ORDER}. */
export function getLegalResourcesByGroup(): { group: LegalResourceGroup; items: LegalResourceLink[] }[] {
  const all = loadResources();
  return LEGAL_RESOURCE_GROUP_ORDER.map((group) => ({
    group,
    items: all.filter((r) => r.group === group),
  })).filter((g) => g.items.length > 0);
}
