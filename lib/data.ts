import path from 'path';
import fs from 'fs';
import type { Representative, PoliceStation, County, SearchFilters, WikiArticle, LegalUpdate, FormDocument } from './types';
import {
  mergeScrapedWithFallback,
  fallbackOnlyReps,
  coerceScrapedRows,
  finalizeRepresentative,
} from './rep-merge';
import { repMatchesCountyName } from './county-matching';
import { withDerivedCounty } from './force-county';
import { forceMatchesCounty } from './police-force-to-counties';
import { applyStationOverrides } from './station-overrides';
import { applyStationVerificationMeta } from './station-verification';
import { applyCustodyConsensus } from './custody-tips/overlay';
import { applyApprovedDiscoveryNumbers } from './custody-discovery/overlay';

async function finalizeStations(stations: PoliceStation[]): Promise<PoliceStation[]> {
  const withOverrides = await applyStationOverrides(stations);
  const withMeta = applyStationVerificationMeta(withOverrides);
  const withDiscovery = await applyApprovedDiscoveryNumbers(withMeta);
  // Consensus runs last so it merges into (not replaces) the file-based meta.
  return applyCustodyConsensus(withDiscovery);
}
import { getKV, skipKVInPrerender } from './kv';
import { loadFeaturedFlags, applyFeaturedFlags, sortFeaturedReps } from './featured';
import {
  loadDirectoryBlocklistFile,
  repIsAutomatedDirectoryTest,
  repMatchesDirectoryBlocklist,
} from './directory-blocklist';
import {
  loadAllReviews,
  reviewBlocksPublication,
  type RepReview,
} from './admin-review';
import {
  isPubliclyVisible,
  looksIneligible,
  PUBLIC_VERIFIED_STATUSES,
  type RepVerificationStatus,
} from './rep-status';

const KV_HIDDEN_LISTING_EMAILS = 'directory:hidden_listing_emails';

type FileData = {
  counties: County[];
  stations: PoliceStation[];
  reps: Representative[];
  /** alternate URL slug -> canonical slug */
  slugAliases: Record<string, string>;
  /** 'scraped' | 'fallback' — which list drove rep count */
  repSource: 'scraped' | 'fallback';
};

let _fileData: FileData | null = null;

function readJson<T>(filePath: string): T | null {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    }
  } catch {
    /* invalid JSON or missing — treat as unavailable */
  }
  return null;
}

function trimField(s: unknown): string {
  if (s == null) return '';
  return String(s).trim();
}

/** When county is missing, infer from first matching station in stations.json. */
function enrichRepCountyFromStations(rep: Representative, stations: PoliceStation[]): Representative {
  if (trimField(rep.county)) return rep;
  for (const label of rep.stations || []) {
    const needle = label.toLowerCase().trim();
    if (!needle) continue;
    const hit = stations.find((s) => {
      const n = trimField(s.name).toLowerCase();
      return n && (n.includes(needle) || needle.includes(n));
    });
    if (hit) {
      const c = trimField(hit.county) || trimField(hit.forceName);
      if (c) {
        return {
          ...rep,
          county: c,
          addressCounty: trimField(rep.addressCounty) || c,
        };
      }
    }
  }
  return rep;
}

function dedupeRepsBySlug(reps: Representative[]): Representative[] {
  const seen = new Set<string>();
  const out: Representative[] = [];
  for (const r of reps) {
    const key = (r.slug || '').toLowerCase();
    if (!key || key === 'unknown') continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

function loadDataFromFiles(): FileData | null {
  if (_fileData !== null) return _fileData;
  if (typeof window !== 'undefined') return null;

  try {
    const dir = path.join(process.cwd(), 'data');
    const countiesPath = path.join(dir, 'counties.json');
    const stationsPath = path.join(dir, 'stations.json');
    const scrapedPath = path.join(dir, 'scraped-reps.json');
    const repsPath = path.join(dir, 'reps.json');

    if (!fs.existsSync(countiesPath) || !fs.existsSync(stationsPath)) {
      return null;
    }

    const counties: County[] = readJson(countiesPath) ?? [];
    const stations: PoliceStation[] = (readJson<PoliceStation[]>(stationsPath) ?? []).map(
      withDerivedCounty,
    );
    const fallbackRepsRaw = readJson<unknown>(repsPath);
    const fallbackReps: Representative[] = Array.isArray(fallbackRepsRaw)
      ? (fallbackRepsRaw as Representative[])
      : [];

    const scrapedParsed = readJson<unknown>(scrapedPath);
    const scrapedRows = coerceScrapedRows(scrapedParsed);
    const useScraped = scrapedRows.length > 0;

    let merged: { reps: Representative[]; slugAliases: Record<string, string> };
    let repSource: 'scraped' | 'fallback';

    if (useScraped) {
      try {
        merged = mergeScrapedWithFallback(scrapedRows, fallbackReps);
        repSource = 'scraped';
      } catch {
        merged = fallbackOnlyReps(fallbackReps);
        repSource = 'fallback';
      }
    } else {
      merged = fallbackOnlyReps(fallbackReps);
      repSource = 'fallback';
    }

    const reps = dedupeRepsBySlug(merged.reps)
      .map((r) => enrichRepCountyFromStations(r, stations))
      .map((r) => finalizeRepresentative(r));

    for (const county of counties) {
      county.stationCount = stations.filter((s) =>
        stationMatchesCounty(s, county.name),
      ).length;
    }

    _fileData = {
      counties,
      stations,
      reps,
      slugAliases: merged.slugAliases,
      repSource,
    };
    return _fileData;
  } catch {
    return null;
  }
}

function resolveRepSlug(slug: string): string {
  const file = loadDataFromFiles();
  if (!file) return slug;
  const lower = slug.toLowerCase();
  if (file.slugAliases[slug]) return file.slugAliases[slug];
  if (file.slugAliases[lower]) return file.slugAliases[lower];
  const hit = Object.entries(file.slugAliases).find(([k]) => k.toLowerCase() === lower);
  return hit ? hit[1] : slug;
}

/** All slug values that should resolve to a rep profile (canonical + aliases). */
export function getAllRepPathSlugs(): string[] {
  const file = loadDataFromFiles();
  if (!file) return [];
  const slugs = new Set<string>();
  for (const r of file.reps) slugs.add(r.slug);
  for (const [alias, canonical] of Object.entries(file.slugAliases)) {
    slugs.add(alias);
    slugs.add(canonical);
  }
  return [...slugs];
}

/** For diagnostics / API: whether directory reps came from scrape merge or reps.json only */
export function getDirectoryRepSource(): 'scraped' | 'fallback' | 'none' {
  const file = loadDataFromFiles();
  if (!file) return 'none';
  return file.repSource;
}

export async function getAllCounties(): Promise<County[]> {
  const file = loadDataFromFiles();
  return file?.counties ?? [];
}

export async function getCountyBySlug(slug: string): Promise<County | undefined> {
  const file = loadDataFromFiles();
  return file?.counties.find((c) => c.slug === slug);
}

/**
 * True when a station belongs to a directory county. Uses the curated
 * force→counties map (so Thames Valley → Berkshire/Buckinghamshire, Northumbria
 * → Tyne and Wear, West Mercia → Shropshire, etc.) and falls back to the
 * station's own/derived county.
 */
function stationMatchesCounty(s: PoliceStation, countyName: string): boolean {
  const cLower = countyName.toLowerCase();
  if (s.county && s.county.toLowerCase() === cLower) return true;
  if (s.forceName && forceMatchesCounty(s.forceName, countyName)) return true;
  return false;
}

export async function getStationsByCounty(county: string): Promise<PoliceStation[]> {
  const file = loadDataFromFiles();
  if (!file) return [];
  return finalizeStations(file.stations.filter((s) => stationMatchesCounty(s, county)));
}

export async function getRepsByCounty(county: string): Promise<Representative[]> {
  const reps = await getAllReps();
  return reps.filter((r) => repMatchesAnyCounty(r, county));
}

/** True if the rep covers the given county via primary `county` or any entry in `counties[]`. */
function repMatchesAnyCounty(rep: Representative, countyName: string): boolean {
  if (repMatchesCountyName(rep.county, countyName)) return true;
  if (Array.isArray(rep.counties)) {
    return rep.counties.some((c) => repMatchesCountyName(c, countyName));
  }
  return false;
}

export async function getRepBySlug(slug: string): Promise<Representative | undefined> {
  const reps = await getAllReps();
  const canonical = resolveRepSlug(slug);
  const lower = canonical.toLowerCase();
  return reps.find((r) => r.slug.toLowerCase() === lower);
}

let _profileOverrides: Map<string, Record<string, unknown>> | null = null;
let _profileOverridesAt = 0;
// 5 minute in-process cache. Each profile load does `KEYS profile:*` plus an
// N-key pipeline GET, which is the single biggest contributor to KV request
// count. At 60s TTL we were saturating Upstash free tier (500k req/day);
// 300s gives us ~5x headroom and is invalidated immediately on profile / admin
// writes via `invalidateProfileCache()`, so users still see their changes
// instantly. Override with PROFILE_CACHE_TTL_SECONDS to tune.
const PROFILE_OVERRIDES_CACHE_MS =
  Math.max(30, Number(process.env.PROFILE_CACHE_TTL_SECONDS) || 300) * 1000;

async function loadProfileOverrides(): Promise<Map<string, Record<string, unknown>>> {
  const now = Date.now();
  if (_profileOverrides && now - _profileOverridesAt < PROFILE_OVERRIDES_CACHE_MS) {
    return _profileOverrides;
  }
  if (skipKVInPrerender()) {
    if (!_profileOverrides) {
      _profileOverrides = new Map();
      _profileOverridesAt = now;
    }
    return _profileOverrides;
  }
  _profileOverrides = new Map();
  _profileOverridesAt = now;
  const kv = getKV();
  if (!kv) return _profileOverrides;
  try {
    const keys = await kv.keys('profile:*');
    if (keys.length === 0) return _profileOverrides;
    const pipeline = kv.pipeline();
    for (const key of keys) pipeline.get(key);
    const results = await pipeline.exec<(Record<string, unknown> | null)[]>();
    for (let i = 0; i < keys.length; i++) {
      const row = results[i];
      if (row && typeof row === 'object' && 'email' in row && typeof row.email === 'string') {
        _profileOverrides.set(row.email.toLowerCase(), row);
      }
    }
  } catch (err) {
    console.error('[data] Failed to load profile overrides from KV:', err);
  }
  return _profileOverrides;
}

/** Bust the in-process profile-overrides cache so the next call re-fetches from KV. */
export function invalidateProfileCache(): void {
  _profileOverrides = null;
  _profileOverridesAt = 0;
}

/* ------------------------------------------------------------------ */
/*  Registered reps — written to KV by /api/register, loaded here     */
/* ------------------------------------------------------------------ */

let _registeredReps: Representative[] | null = null;
let _registeredRawByEmail: Map<string, Record<string, unknown>> | null = null;
let _registeredRepsAt = 0;
// Same reasoning as PROFILE_OVERRIDES_CACHE_MS above. Override with
// REGISTERED_CACHE_TTL_SECONDS.
const REGISTERED_CACHE_MS =
  Math.max(30, Number(process.env.REGISTERED_CACHE_TTL_SECONDS) || 300) * 1000;

let _hiddenListingEmails: Set<string> | null = null;
let _hiddenListingEmailsAt = 0;

async function loadHiddenListingEmails(): Promise<Set<string>> {
  const now = Date.now();
  if (_hiddenListingEmails && now - _hiddenListingEmailsAt < REGISTERED_CACHE_MS) {
    return _hiddenListingEmails;
  }
  if (skipKVInPrerender()) {
    _hiddenListingEmails = new Set();
    _hiddenListingEmailsAt = now;
    return _hiddenListingEmails;
  }
  const kv = getKV();
  if (!kv) {
    _hiddenListingEmails = new Set();
    _hiddenListingEmailsAt = now;
    return _hiddenListingEmails;
  }
  try {
    const arr = await kv.get<string[]>(KV_HIDDEN_LISTING_EMAILS);
    _hiddenListingEmails = new Set((arr ?? []).map((e) => e.toLowerCase()));
  } catch (err) {
    console.error('[data] Failed to load hidden listing emails from KV:', err);
    _hiddenListingEmails = new Set();
  }
  _hiddenListingEmailsAt = now;
  return _hiddenListingEmails;
}

export function invalidateHiddenListingEmailsCache(): void {
  _hiddenListingEmails = null;
  _hiddenListingEmailsAt = 0;
}

export function invalidateRegisteredRepsCache(): void {
  _registeredReps = null;
  _registeredRawByEmail = null;
  _registeredRepsAt = 0;
}

/** Admin-only: raw `newrep:*` rows keyed by email, populated from the same KV scan as registered reps. */
export async function getRegisteredRowsByEmail(): Promise<Map<string, Record<string, unknown>>> {
  await loadRegisteredReps();
  return _registeredRawByEmail ?? new Map();
}

/**
 * Hides a static (reps.json) listing from the live directory without a redeploy.
 * Used when the rep asks to delete their entry while signed in.
 */
export async function hideStaticListingEmail(email: string): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  const lower = email.toLowerCase();
  const existing = (await kv.get<string[]>(KV_HIDDEN_LISTING_EMAILS)) ?? [];
  const set = new Set(existing.map((e) => e.toLowerCase()));
  if (set.has(lower)) {
    invalidateHiddenListingEmailsCache();
    return;
  }
  set.add(lower);
  await kv.set(KV_HIDDEN_LISTING_EMAILS, [...set]);
  invalidateHiddenListingEmailsCache();
}

/** Admin-only: removes an email from the hidden-listings list. */
export async function unhideStaticListingEmail(email: string): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  const lower = email.toLowerCase();
  const existing = (await kv.get<string[]>(KV_HIDDEN_LISTING_EMAILS)) ?? [];
  const next = existing.filter((e) => e.toLowerCase() !== lower);
  if (next.length === existing.length) {
    invalidateHiddenListingEmailsCache();
    return;
  }
  await kv.set(KV_HIDDEN_LISTING_EMAILS, next);
  invalidateHiddenListingEmailsCache();
}

/** Admin-only: returns the set of hidden static-listing emails. */
export async function getHiddenListingEmails(): Promise<Set<string>> {
  return loadHiddenListingEmails();
}

/** Admin-only: returns the raw `newrep:*` rows from KV without trimming into the public `Representative` shape. */
export async function getAllRegisteredRepsRaw(): Promise<
  Array<{ key: string; row: Record<string, unknown> }>
> {
  const byEmail = await getRegisteredRowsByEmail();
  return [...byEmail.entries()].map(([email, row]) => ({ key: `newrep:${email}`, row }));
}

/** Admin-only: returns all profile-override rows from `profile:*`. */
export async function getAllProfileOverrides(): Promise<Map<string, Record<string, unknown>>> {
  return loadProfileOverrides();
}

function splitList(raw: unknown): string[] {
  const s = trimField(raw);
  if (!s) return [];
  return Array.from(
    new Set(
      s.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean),
    ),
  );
}

function registrationToRep(row: Record<string, unknown>): Representative | null {
  const name = trimField(row.name);
  const email = typeof row.email === 'string' ? row.email.trim().toLowerCase() : '';
  if (!name || !email) return null;

  const countyList = splitList(row.counties);
  const stationList = splitList(row.stations);
  const county = countyList[0] || '';

  const baseSlug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'rep';
  const shortId = email.replace(/[^a-z0-9]/gi, '').slice(0, 8);
  const computedSlug = `${baseSlug}-${shortId}`;
  const storedSlug = trimField(row.slug);
  const slug = storedSlug || computedSlug;

  const yearsRaw = row.years_experience;
  const yearsExperience =
    typeof yearsRaw === 'number' && Number.isFinite(yearsRaw)
      ? yearsRaw
      : typeof yearsRaw === 'string' && yearsRaw.trim() && Number.isFinite(Number(yearsRaw))
        ? Number(yearsRaw)
        : undefined;

  return {
    id: `newrep:${email}`,
    slug,
    name,
    email,
    phone: trimField(row.phone),
    county,
    counties: countyList.length ? countyList : undefined,
    addressCounty: county,
    stations: stationList,
    stationsCovered: stationList.length ? stationList : undefined,
    availability: trimField(row.availability),
    accreditation: trimField(row.accreditation) || 'Accredited Representative',
    notes: trimField(row.message),
    coverageAreas: trimField(row.coverage_areas),
    websiteUrl: trimField(row.website_url) || undefined,
    whatsappLink: trimField(row.whatsapp_link) || undefined,
    dsccPin: trimField(row.dscc_pin) || undefined,
    languages: splitList(row.languages).length ? splitList(row.languages) : undefined,
    specialisms: splitList(row.specialisms).length ? splitList(row.specialisms) : undefined,
    holidayAvailability: splitList(row.holiday_availability).length
      ? splitList(row.holiday_availability)
      : undefined,
    yearsExperience,
  };
}

/* ------------------------------------------------------------------ */
/*  Save a new self-serve registration. Writes the row to KV and       */
/*  busts the in-process cache so the public directory picks it up on  */
/*  next request (subject to the publication gate).                    */
/* ------------------------------------------------------------------ */

export interface SaveRegistrationInput {
  email: string;
  name: string;
  phone: string;
  /** Free-text accreditation string (the public `accreditation` column). */
  accreditation: string;
  counties?: string;
  stations?: string;
  availability?: string;
  message?: string;
  coverage_areas?: string;
  website_url?: string;
  whatsapp_link?: string;
  dscc_pin?: string;
  sra_number?: string;
  firm_name?: string;
  firm_address?: string;
  firm_email?: string;
  proof_url?: string;
  professional_profile_url?: string;
  languages?: string;
  specialisms?: string;
  years_experience?: number;
  /** Private — never shown publicly. */
  full_postal_address?: string;
  /** IP/UA captured for audit trail. */
  ipAddress?: string;
  userAgent?: string;
  /** Admin-set publication fields (only used by /api/register itself). */
  verificationStatus?: string;
  adminApproved?: boolean;
  isPublic?: boolean;
  lastVerifiedDate?: string;
  registeredAt?: string;
}

export async function saveRegistration(input: SaveRegistrationInput): Promise<void> {
  const kv = getKV();
  if (!kv) {
    throw new Error('KV not configured — registration cannot be persisted');
  }
  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error('saveRegistration: missing email');
  const now = new Date().toISOString();
  const row: Record<string, unknown> = {
    ...input,
    email,
    registeredAt: input.registeredAt || now,
  };
  const result = await kv.set(`newrep:${email}`, row, { nx: true });
  if (result !== 'OK') {
    throw new Error('duplicate_registration');
  }
  invalidateRegisteredRepsCache();
}

async function loadRegisteredReps(): Promise<Representative[]> {
  const now = Date.now();
  if (_registeredReps && now - _registeredRepsAt < REGISTERED_CACHE_MS) {
    return _registeredReps;
  }
  if (skipKVInPrerender()) {
    if (_registeredReps === null) {
      _registeredReps = [];
      _registeredRawByEmail = new Map();
      _registeredRepsAt = now;
    }
    return _registeredReps;
  }
  const kv = getKV();
  if (!kv) {
    _registeredReps = [];
    _registeredRawByEmail = new Map();
    _registeredRepsAt = now;
    return [];
  }
  try {
    const keys = await kv.keys('newrep:*');
    if (keys.length === 0) {
      _registeredReps = [];
      _registeredRawByEmail = new Map();
      _registeredRepsAt = now;
      return [];
    }
    const pipeline = kv.pipeline();
    for (const key of keys) pipeline.get(key);
    const results = await pipeline.exec<(Record<string, unknown> | null)[]>();
    const reps: Representative[] = [];
    const rawByEmail = new Map<string, Record<string, unknown>>();
    const stations = loadDataFromFiles()?.stations ?? [];
    for (const row of results) {
      if (!row || typeof row !== 'object') continue;
      const email =
        typeof row.email === 'string' ? row.email.trim().toLowerCase() : '';
      if (email) rawByEmail.set(email, row);
      const rep = registrationToRep(row);
      if (rep) {
        const enriched = enrichRepCountyFromStations(rep, stations);
        reps.push(finalizeRepresentative(enriched));
      }
    }
    _registeredReps = reps;
    _registeredRawByEmail = rawByEmail;
    _registeredRepsAt = now;
    return reps;
  } catch (err) {
    console.error('[data] Failed to load registered reps from KV:', err);
    _registeredReps = [];
    _registeredRawByEmail = new Map();
    _registeredRepsAt = now;
    return [];
  }
}

/** Look up a single registered rep by email (O(1) KV read). */
export async function getRegisteredRepByEmail(email: string): Promise<Representative | null> {
  const kv = getKV();
  if (!kv) return null;
  try {
    const row = await kv.get<Record<string, unknown>>(`newrep:${email.toLowerCase()}`);
    if (!row) return null;
    const rep = registrationToRep(row);
    if (!rep) return null;
    const stations = loadDataFromFiles()?.stations ?? [];
    return finalizeRepresentative(enrichRepCountyFromStations(rep, stations));
  } catch {
    return null;
  }
}

function ov<T>(overrides: Record<string, unknown>, key: string, fallback: T): T {
  if (!(key in overrides)) return fallback;
  const v = overrides[key];
  if (v === null || v === undefined) return fallback;
  return v as T;
}

export function applyOverrides(rep: Representative, overrides: Record<string, unknown>): Representative {
  const notesVal = ov(overrides, 'notes', rep.notes);
  let counties = rep.counties;
  let primaryCounty = rep.county;
  if ('counties' in overrides) {
    const raw = overrides.counties;
    if (raw === null || raw === undefined) {
      counties = rep.counties;
      primaryCounty = rep.county;
    } else {
      const list = Array.isArray(raw)
        ? raw.map((s) => String(s).trim()).filter(Boolean)
        : typeof raw === 'string'
          ? raw.split(/[,;]+/).map((s) => s.trim()).filter(Boolean)
          : [];
      counties = list.length ? Array.from(new Set(list)) : undefined;
      if (counties && counties.length) primaryCounty = counties[0];
    }
  }
  return {
    ...rep,
    name: ov(overrides, 'name', rep.name),
    phone: ov(overrides, 'phone', rep.phone),
    availability: ov(overrides, 'availability', rep.availability),
    accreditation: ov(overrides, 'accreditation', rep.accreditation),
    postcode: ov(overrides, 'postcode', rep.postcode),
    county: primaryCounty,
    counties,
    stations: ov(overrides, 'stations_covered', rep.stations),
    stationsCovered: ov(overrides, 'stations_covered', rep.stationsCovered),
    notes: notesVal,
    bio: 'notes' in overrides ? notesVal : rep.bio,
    websiteUrl: ov(overrides, 'website_url', rep.websiteUrl),
    whatsappLink: ov(overrides, 'whatsapp_link', rep.whatsappLink),
    dsccPin: ov(overrides, 'dscc_pin', rep.dsccPin),
    holidayAvailability: ov(overrides, 'holiday_availability', rep.holidayAvailability),
    languages: ov(overrides, 'languages', rep.languages),
    specialisms: ov(overrides, 'specialisms', rep.specialisms),
    yearsExperience: ov(overrides, 'years_experience', rep.yearsExperience),
    coverageAreas: ov(overrides, 'coverage_areas', rep.coverageAreas ?? ''),
  };
}

/** Returns reps from static JSON only — no Supabase overrides applied. */
export function getRawReps(): Representative[] {
  const file = loadDataFromFiles();
  return file?.reps ?? [];
}

/**
 * Whether legacy static (data/reps.json) profiles should remain publicly
 * visible during the migration to the strict verification model.
 *
 * IMPORTANT: this defaults to `false`. Once flipped on, the public directory
 * will only show profiles where the admin has explicitly approved the row in
 * KV (via the Rep Verification Audit) and assigned a verified status. The
 * legacy seed of 176 reps will all need re-verification.
 *
 * To temporarily allow the legacy reps to remain visible while migration is
 * in flight, set `LEGACY_REPS_PUBLIC=1` in the deployment environment. They
 * will still be hidden if an admin explicitly marks them
 * suspended/rejected/ineligible.
 */
const LEGACY_REPS_PUBLIC =
  process.env.LEGACY_REPS_PUBLIC === '1' ||
  process.env.LEGACY_REPS_PUBLIC === 'true';

interface VisibilityContext {
  reviews: Map<string, RepReview>;
}

/**
 * Decide whether a single Representative may appear in /directory and
 * /rep/[slug] right now.
 *
 * Hard rule (matches PoliceStationRepUK security directive):
 *   - status must be one of the three verified public statuses; AND
 *   - adminApproved === true; AND
 *   - isPublic === true; AND
 *   - lastVerifiedDate exists and is within the re-verification window.
 *
 * Legacy `data/reps.json` rows that pre-date the directive may be allowed
 * through when `LEGACY_REPS_PUBLIC=1` so we can roll out the new model
 * without immediately wiping the directory. Even then, any review record
 * with adminApproved=false / status=rejected etc. always wins.
 */
function shouldShowPublicly(
  rep: Representative,
  ctx: VisibilityContext,
): boolean {
  const review = ctx.reviews.get(rep.email.toLowerCase()) ?? null;

  // Hard veto from admin review record (always wins).
  if (reviewBlocksPublication(review)) return false;

  // Reject any free-text indication of probationary / trainee / unaccredited.
  if (looksIneligible(rep.accreditation, rep.notes, rep.bio)) return false;

  // Compose the canonical gate from review record + any inline fields.
  const status: RepVerificationStatus | null =
    review?.verificationStatus ?? rep.verificationStatus ?? null;
  const adminApproved =
    review?.adminApproved ?? rep.adminApproved ?? null;
  const isPublic = review?.isPublic ?? rep.isPublic ?? null;
  const lastVerifiedDate =
    review?.lastVerifiedDate ?? rep.lastVerifiedDate ?? null;

  if (isPubliclyVisible({ status, adminApproved, isPublic, lastVerifiedDate })) {
    return true;
  }

  // Legacy fallback: allow static-seed rows ONLY when explicitly enabled and
  // never blocked by an admin review.
  if (LEGACY_REPS_PUBLIC && !rep.id.startsWith('newrep:')) {
    return true;
  }

  return false;
}

export async function getAllReps(): Promise<Representative[]> {
  const reps = getRawReps();
  const [overrides, registered, featuredFlags, hiddenEmails, reviews] =
    await Promise.all([
      loadProfileOverrides(),
      loadRegisteredReps(),
      loadFeaturedFlags(),
      loadHiddenListingEmails(),
      loadAllReviews(),
    ]);

  const withOverrides = reps.map((r) => {
    const o = overrides.get(r.email.toLowerCase());
    return o ? applyOverrides(r, o) : r;
  });

  let all: Representative[];
  if (registered.length === 0) {
    all = withOverrides;
  } else {
    const existingEmails = new Set(withOverrides.map((r) => r.email.toLowerCase()));
    const newReps = registered
      .filter((r) => !existingEmails.has(r.email.toLowerCase()))
      .map((r) => {
        const o = overrides.get(r.email.toLowerCase());
        return o ? applyOverrides(r, o) : r;
      });
    all = [...withOverrides, ...newReps];
  }

  const featured = applyFeaturedFlags(all, featuredFlags);
  const bl = loadDirectoryBlocklistFile();
  const ctx: VisibilityContext = { reviews };

  const allowed = featured.filter((r) => {
    if (hiddenEmails.has(r.email.toLowerCase())) return false;
    if (repIsAutomatedDirectoryTest(r)) return false;
    if (repMatchesDirectoryBlocklist(r, bl)) return false;
    // Strict publication gate — only verified, admin-approved reps.
    if (!shouldShowPublicly(r, ctx)) return false;
    return true;
  });
  // Defence-in-depth: strip private fields from anything that leaves this
  // function. Admin pages should call `getAllRepsForAdmin()` instead.
  return allowed.map(stripPrivateFields);
}

/** Admin / internal: returns all reps WITHOUT the public-visibility gate. */
export async function getAllRepsForAdmin(): Promise<Representative[]> {
  const reps = getRawReps();
  const [overrides, registered, featuredFlags] = await Promise.all([
    loadProfileOverrides(),
    loadRegisteredReps(),
    loadFeaturedFlags(),
  ]);
  const withOverrides = reps.map((r) => {
    const o = overrides.get(r.email.toLowerCase());
    return o ? applyOverrides(r, o) : r;
  });
  const existingEmails = new Set(withOverrides.map((r) => r.email.toLowerCase()));
  const newReps = registered
    .filter((r) => !existingEmails.has(r.email.toLowerCase()))
    .map((r) => {
      const o = overrides.get(r.email.toLowerCase());
      return o ? applyOverrides(r, o) : r;
    });
  return applyFeaturedFlags([...withOverrides, ...newReps], featuredFlags);
}

/** Exposed for tests / scripts. Indicates whether the legacy seed remains visible. */
export function legacyRepsAreCurrentlyPublic(): boolean {
  return LEGACY_REPS_PUBLIC;
}

export { PUBLIC_VERIFIED_STATUSES };

/**
 * Defence-in-depth: strip any field that must never appear in a public API
 * response or be rendered on a public page. Pages and components should still
 * be careful not to render private fields, but this gives us a single chokepoint.
 */
export function stripPrivateFields(rep: Representative): Representative {
  const out: Representative = {
    ...rep,
    postcode: '',
    dsccPin: '',
  };
  // Strip lingering review/verification metadata from anything that goes out.
  delete out.verificationStatus;
  delete out.adminApproved;
  delete out.isPublic;
  delete out.lastVerifiedDate;
  return out;
}

/** Strip private fields from a list of reps. */
export function stripPrivateFieldsAll(reps: Representative[]): Representative[] {
  return reps.map(stripPrivateFields);
}

/**
 * Returns featured reps in the correct deterministic order:
 * Robert first, then by activation date, then by name.
 */
export async function getFeaturedRepsSorted(): Promise<Representative[]> {
  const [reps, flags] = await Promise.all([getAllReps(), loadFeaturedFlags()]);
  const featured = reps.filter((r) => r.featured);
  return sortFeaturedReps(featured, flags);
}

export async function getStationBySlug(slug: string): Promise<PoliceStation | undefined> {
  const file = loadDataFromFiles();
  const stations = file?.stations ?? [];
  const match =
    stations.find((s) => s.slug === slug) ??
    stations.find((s) => s.slug === `${slug}-police-station`) ??
    stations.find((s) => s.slug.startsWith(`${slug}-`));
  if (!match) return undefined;
  const [merged] = await finalizeStations([match]);
  return merged ?? match;
}

export async function getAllStations(): Promise<PoliceStation[]> {
  const file = loadDataFromFiles();
  return finalizeStations(file?.stations ?? []);
}

export async function getRepsByStation(stationName: string): Promise<Representative[]> {
  const file = loadDataFromFiles();
  if (!file) return [];
  const reps = await getAllReps();
  const normalizedInput = stationName.toLowerCase().trim();
  const stationMeta = file.stations.find(
    (s) =>
      s.name.toLowerCase() === normalizedInput ||
      s.slug.toLowerCase() === normalizedInput,
  );
  const nameKeys = new Set<string>();
  nameKeys.add(normalizedInput);
  if (stationMeta) {
    nameKeys.add(stationMeta.name.toLowerCase());
    const short = stationMeta.name.toLowerCase().replace(/\s*police station\s*$/i, '').trim();
    if (short.length >= 5) nameKeys.add(short);
  }
  return reps.filter((r) =>
    (r.stations || []).some((label) => {
      const sl = label.toLowerCase();
      for (const key of nameKeys) {
        if (!key) continue;
        if (sl === key || sl.includes(key) || key.includes(sl)) return true;
      }
      return false;
    }),
  );
}

export function countySlugToPageSlug(countySlug: string): string {
  return `police-station-representatives-${countySlug}`;
}

export function pageSlugToCountySlug(pageSlug: string): string {
  return pageSlug.replace('police-station-representatives-', '');
}

export async function searchRepresentatives(filters: SearchFilters): Promise<Representative[]> {
  let results = await getAllReps();
  if (filters.county) {
    results = results.filter((r) => repMatchesAnyCounty(r, filters.county!));
  }
  if (filters.station) {
    const st = filters.station.toLowerCase();
    results = results.filter((r) => (r.stations || []).some((s) => s.toLowerCase().includes(st)));
  }
  if (filters.availability) {
    const a = filters.availability.toLowerCase();
    results = results.filter((r) => (r.availability || '').toLowerCase().includes(a));
  }
  if (filters.accreditation) {
    const acc = filters.accreditation.toLowerCase();
    results = results.filter((r) => (r.accreditation || '').toLowerCase().includes(acc));
  }
  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.county || '').toLowerCase().includes(q) ||
        (r.stations || []).some((s) => s.toLowerCase().includes(q)),
    );
  }
  return results;
}

// --- New entity loaders ---

function loadJsonFile<T>(filename: string): T[] {
  if (typeof window !== 'undefined') return [];
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    if (fs.existsSync(filePath)) {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return Array.isArray(raw) ? raw : [];
    }
  } catch {
    /* ignore */
  }
  return [];
}

export async function getAllWikiArticles(): Promise<WikiArticle[]> {
  return loadJsonFile<WikiArticle>('wiki-articles.json');
}

export async function getWikiArticleBySlug(slug: string): Promise<WikiArticle | undefined> {
  const articles = await getAllWikiArticles();
  return articles.find((a) => a.slug === slug);
}

export async function getWikiArticlesByCategory(category: string): Promise<WikiArticle[]> {
  const articles = await getAllWikiArticles();
  return articles.filter((a) => a.category === category);
}

export async function getAllLegalUpdates(): Promise<LegalUpdate[]> {
  return loadJsonFile<LegalUpdate>('legal-updates.json');
}

export async function getLegalUpdateBySlug(slug: string): Promise<LegalUpdate | undefined> {
  const updates = await getAllLegalUpdates();
  return updates.find((u) => u.slug === slug);
}

export async function getAllFormDocuments(): Promise<FormDocument[]> {
  return loadJsonFile<FormDocument>('form-documents.json');
}
