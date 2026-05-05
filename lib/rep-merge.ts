/**
 * Merge scraped directory reps (primary) with reps.json (fallback fields only).
 * Exported helpers are pure; file I/O stays in lib/data.ts
 */

import type { Representative } from './types';

/** Shape of entries in data/scraped-reps.json */
export interface ScrapedRepRow {
  name?: string;
  phone?: string;
  email?: string;
  county?: string;
  /** Multi-county coverage (e.g. Devon + Cornwall) — preserved into Representative.counties */
  counties?: string[];
  availability?: string;
  accreditation?: string;
  featured?: boolean;
  stations?: string[];
  bio?: string;
  slug?: string;
  websiteUrl?: string;
  whatsappLink?: string;
  yearsExperience?: number;
}

function trimStr(s: unknown): string {
  if (s == null) return '';
  return String(s).trim();
}

/** Parse file contents into clean scraped rows; returns [] if unusable. */
export function coerceScrapedRows(raw: unknown): ScrapedRepRow[] {
  if (!Array.isArray(raw)) return [];
  const out: ScrapedRepRow[] = [];
  for (const item of raw) {
    if (item == null || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const name = trimStr(row.name);
    const slug = trimStr(row.slug);
    if (!name && !slug) continue;
    let stations: string[] = [];
    if (Array.isArray(row.stations)) {
      stations = row.stations.map((s) => trimStr(s)).filter(Boolean);
    }
    const ye = typeof row.yearsExperience === 'number' ? row.yearsExperience : undefined;
    let counties: string[] | undefined;
    if (Array.isArray(row.counties)) {
      const parsed = row.counties.map((s) => trimStr(s)).filter(Boolean);
      if (parsed.length) counties = Array.from(new Set(parsed));
    }
    out.push({
      name: name || 'Unknown',
      phone: trimStr(row.phone),
      email: trimStr(row.email),
      county: trimStr(row.county),
      counties,
      availability: trimStr(row.availability),
      accreditation: trimStr(row.accreditation),
      featured: Boolean(row.featured),
      stations,
      bio: trimStr(row.bio),
      slug: slug || undefined,
      websiteUrl: trimStr(row.websiteUrl),
      whatsappLink: trimStr(row.whatsappLink),
      yearsExperience: ye,
    });
  }
  return out;
}

export function isMongoLikeId(s: string): boolean {
  return /^[a-f0-9]{24}$/i.test(s);
}

function normNameKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function isEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function pick<T>(primary: T, fallback: T): T {
  return isEmpty(primary) ? fallback : primary;
}

function pickDisplayName(primary: string, fallback: string): string {
  const p = trimStr(primary);
  const f = trimStr(fallback);
  if (!p || p.toLowerCase() === 'unknown') return f || 'Unknown';
  return p;
}

/** Guarantee Representative shape: no undefined arrays/strings that break .includes / .slice */
export function finalizeRepresentative(rep: Representative): Representative {
  const slug =
    trimStr(rep.slug) ||
    normNameKey(rep.name || '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') ||
    'unknown';
  const stations = Array.isArray(rep.stations)
    ? rep.stations.map((s) => trimStr(s)).filter(Boolean)
    : [];
  return {
    ...rep,
    id: trimStr(rep.id) || `id:${slug}`,
    slug,
    name: trimStr(rep.name) || 'Unknown',
    phone: trimStr(rep.phone),
    email: trimStr(rep.email),
    county: trimStr(rep.county),
    counties: Array.isArray(rep.counties)
      ? Array.from(new Set(rep.counties.map((s) => trimStr(s)).filter(Boolean)))
      : undefined,
    addressCounty: trimStr(rep.addressCounty) || trimStr(rep.county),
    postcode: trimStr(rep.postcode),
    stations,
    stationsCovered: rep.stationsCovered?.length
      ? rep.stationsCovered.map((s) => trimStr(s)).filter(Boolean)
      : undefined,
    availability: trimStr(rep.availability),
    accreditation: trimStr(rep.accreditation) || 'Accredited Representative',
    notes: trimStr(rep.notes),
    bio: trimStr(rep.bio),
    featured: Boolean(rep.featured),
    featuredLevel: rep.featuredLevel,
    featuredUntil: rep.featuredUntil ?? null,
    featuredBadgeText: rep.featuredBadgeText ?? null,
    whatsappLink: trimStr(rep.whatsappLink),
    websiteUrl: trimStr(rep.websiteUrl),
    dsccPin: trimStr(rep.dsccPin),
    spotlightNote: trimStr(rep.spotlightNote),
    holidayAvailability: Array.isArray(rep.holidayAvailability)
      ? rep.holidayAvailability.map((s) => trimStr(s)).filter(Boolean)
      : [],
    image: rep.image,
    yearsExperience: rep.yearsExperience,
    languages: Array.isArray(rep.languages) ? rep.languages.map((s) => trimStr(s)).filter(Boolean) : undefined,
    specialisms: Array.isArray(rep.specialisms) ? rep.specialisms.map((s) => trimStr(s)).filter(Boolean) : undefined,
  };
}

/** Map scraped row to a partial Representative (before fallback merge). */
export function scrapedRowToRepresentative(row: ScrapedRepRow): Representative {
  const slugRaw =
    (row.slug && row.slug.trim()) ||
    normNameKey(row.name || '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') ||
    'unknown';
  const name = (row.name || 'Unknown').trim();
  const counties =
    Array.isArray(row.counties) && row.counties.length
      ? Array.from(new Set(row.counties.map((s) => String(s).trim()).filter(Boolean)))
      : undefined;
  return {
    id: slugRaw,
    slug: slugRaw,
    name,
    phone: (row.phone || '').trim(),
    email: (row.email || '').trim(),
    county: (row.county || '').trim(),
    counties,
    addressCounty: (row.county || '').trim(),
    stations: Array.isArray(row.stations) ? row.stations.map((s) => String(s).trim()).filter(Boolean) : [],
    availability: (row.availability || '').trim(),
    accreditation: (row.accreditation || '').trim(),
    notes: '',
    featured: Boolean(row.featured),
    websiteUrl: (row.websiteUrl || '').trim(),
    bio: (row.bio || '').trim(),
    featuredLevel: row.featured ? 'basic' : undefined,
    featuredUntil: null,
    featuredBadgeText: null,
    whatsappLink: (row.whatsappLink || '').trim(),
    dsccPin: '',
    spotlightNote: '',
    holidayAvailability: [],
    postcode: '',
    yearsExperience: row.yearsExperience,
  };
}

function mergeWithFallback(primary: Representative, fb: Representative | undefined): Representative {
  if (!fb) return { ...primary };

  /** Scraped (primary) wins when non-empty; otherwise use fallback. */
  const m = { ...fb, slug: primary.slug };
  /** Prefer stable CRM id from fallback when present */
  m.id = fb.id || primary.id;
  m.name = pickDisplayName(primary.name, fb.name);
  m.phone = pick(primary.phone, fb.phone);
  m.email = pick(primary.email, fb.email);
  m.county = pick(primary.county, fb.county);
  m.counties = !isEmpty(primary.counties)
    ? [...(primary.counties as string[])]
    : fb.counties
      ? [...fb.counties]
      : undefined;
  m.addressCounty = pick(primary.addressCounty, fb.addressCounty) || pick(primary.county, fb.county);
  m.postcode = pick(primary.postcode, fb.postcode);
  m.stations = !isEmpty(primary.stations) ? [...primary.stations] : [...(fb.stations || [])];
  m.availability = pick(primary.availability, fb.availability);
  m.accreditation = pick(primary.accreditation, fb.accreditation);
  m.notes = pick(primary.notes, fb.notes);
  m.bio = pick(primary.bio, fb.bio);
  m.featured = primary.featured || Boolean(fb.featured);
  m.featuredLevel = pick(primary.featuredLevel, fb.featuredLevel);
  m.featuredUntil = primary.featuredUntil ?? fb.featuredUntil ?? null;
  m.featuredBadgeText = pick(primary.featuredBadgeText, fb.featuredBadgeText);
  m.websiteUrl = pick(primary.websiteUrl, fb.websiteUrl);
  m.whatsappLink = pick(primary.whatsappLink, fb.whatsappLink);
  m.dsccPin = pick(primary.dsccPin, fb.dsccPin);
  m.spotlightNote = pick(primary.spotlightNote, fb.spotlightNote);
  m.holidayAvailability =
    !isEmpty(primary.holidayAvailability) ? primary.holidayAvailability! : fb.holidayAvailability || [];
  m.yearsExperience = primary.yearsExperience ?? fb.yearsExperience;
  m.languages = !isEmpty(primary.languages) ? primary.languages : fb.languages;
  m.specialisms = !isEmpty(primary.specialisms) ? primary.specialisms : fb.specialisms;
  m.image = pick(primary.image, fb.image);
  return m;
}

/** Build lookup indexes from fallback reps.json entries */
function buildFallbackIndexes(fallback: Representative[]) {
  const bySlug = new Map<string, Representative>();
  const byId = new Map<string, Representative>();
  const byName = new Map<string, Representative>();

  for (const r of fallback) {
    if (r.slug) bySlug.set(r.slug.toLowerCase(), r);
    if (r.id) byId.set(String(r.id).toLowerCase(), r);
    const nk = normNameKey(r.name);
    if (nk && !byName.has(nk)) byName.set(nk, r);
  }

  return { bySlug, byId, byName };
}

function findFallbackMatch(
  partial: Representative,
  indexes: ReturnType<typeof buildFallbackIndexes>,
): Representative | undefined {
  const s = partial.slug;
  if (s) {
    const byId = indexes.byId.get(s.toLowerCase());
    if (byId) return byId;
    const bySlug = indexes.bySlug.get(s.toLowerCase());
    if (bySlug) return bySlug;
  }
  const nk = normNameKey(partial.name);
  return nk ? indexes.byName.get(nk) : undefined;
}

export interface MergeResult {
  reps: Representative[];
  slugAliases: Record<string, string>;
}

/**
 * Primary: scraped rows. Fallback: reps.json rows — only fills empty primary fields.
 * Sets human-readable slug when fallback matches a mongo-like scraped id.
 */
export function mergeScrapedWithFallback(
  scraped: ScrapedRepRow[],
  fallback: Representative[],
): MergeResult {
  const indexes = buildFallbackIndexes(fallback);
  const slugAliases: Record<string, string> = {};
  const reps: Representative[] = [];

  for (const row of scraped) {
    const base = scrapedRowToRepresentative(row);
    const fb = findFallbackMatch(base, indexes);

    let canonicalSlug = base.slug;
    if (isMongoLikeId(canonicalSlug) && fb?.slug && !isMongoLikeId(fb.slug)) {
      canonicalSlug = fb.slug;
    }

    if (base.slug !== canonicalSlug) {
      slugAliases[base.slug] = canonicalSlug;
    }

    const mergedBase: Representative = {
      ...base,
      slug: canonicalSlug,
      id: fb?.id || `scraped:${canonicalSlug}`,
    };

    const merged = mergeWithFallback(mergedBase, fb);

    if (isEmpty(merged.accreditation)) {
      merged.accreditation = 'Accredited Representative';
    }

    reps.push(merged);
  }

  return { reps, slugAliases };
}

/** When no scraped file: use fallback only, no aliases */
export function fallbackOnlyReps(fallback: Representative[]): MergeResult {
  return { reps: fallback.map((r) => ({ ...r })), slugAliases: {} };
}
