/**
 * Legal Services Directory — Upstash KV persistence.
 *
 * Keys:
 *   legaldir:listing:{id}     — full listing JSON
 *   legaldir:slug:{slug}      — listing id
 *   legaldir:email:{email}    — listing id (one primary listing per owner email)
 *   legaldir:ids              — string[] of all listing ids
 *   legaldir:req:{id}         — listing request JSON
 *   legaldir:req-ids          — string[] of request ids
 *   legaldir:mgmt:{tokenHash} — { listingId, email, exp }
 *
 * TODO: Logo uploads — wire to Vercel Blob / S3 when available; logoUrl field ready.
 */

import crypto from 'crypto';
import { getDirectoryStore } from './store';
import { getCategoryBySlug, categorySlugFromProviderType } from './categories';
import {
  buildListingSlug,
  buildSeoTitle,
  locationSlugFromParts,
} from './slug';
import { scoreLegalDirectorySubmission, statusFromRisk } from './risk';
import {
  normalizeEmail,
  parseBooleanField,
  parseLegalAidStatus,
  sanitizeMultiline,
  sanitizeText,
  sanitizeUrl,
  validateDescription,
} from './sanitize';
import { MANAGEMENT_TOKEN_TTL_MS } from './constants';
import type {
  LegalDirectoryListing,
  LegalDirectoryListingRequest,
  LegalDirectoryListingStatus,
  LegalAidStatus,
  PublicLegalDirectoryListing,
} from './types';

const PREFIX = 'legaldir:';
const IDS_KEY = `${PREFIX}ids`;
const REQ_IDS_KEY = `${PREFIX}req-ids`;

function listingKey(id: string): string {
  return `${PREFIX}listing:${id}`;
}
function slugKey(slug: string): string {
  return `${PREFIX}slug:${slug}`;
}
function emailKey(email: string): string {
  return `${PREFIX}email:${normalizeEmail(email)}`;
}
function requestKey(id: string): string {
  return `${PREFIX}req:${id}`;
}
function mgmtKey(hash: string): string {
  return `${PREFIX}mgmt:${hash}`;
}

function newId(): string {
  return `ld_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateManagementToken(): { token: string; hash: string; expiresAt: string } {
  const token = crypto.randomBytes(32).toString('base64url');
  const hash = hashToken(token);
  const expiresAt = new Date(Date.now() + MANAGEMENT_TOKEN_TTL_MS).toISOString();
  return { token, hash, expiresAt };
}

async function readIds(): Promise<string[]> {
  const store = getDirectoryStore();
  if (!store) return [];
  const raw = await store.get<string[]>(IDS_KEY);
  return Array.isArray(raw) ? raw : [];
}

async function writeIds(ids: string[]): Promise<void> {
  const store = getDirectoryStore();
  if (!store) return;
  await store.set(IDS_KEY, ids);
}

async function readReqIds(): Promise<string[]> {
  const store = getDirectoryStore();
  if (!store) return [];
  const raw = await store.get<string[]>(REQ_IDS_KEY);
  return Array.isArray(raw) ? raw : [];
}

async function writeReqIds(ids: string[]): Promise<void> {
  const store = getDirectoryStore();
  if (!store) return;
  await store.set(REQ_IDS_KEY, ids);
}

export async function getListingById(id: string): Promise<LegalDirectoryListing | null> {
  const store = getDirectoryStore();
  if (!store) return null;
  return store.get<LegalDirectoryListing>(listingKey(id));
}

export async function getListingBySlug(slug: string): Promise<LegalDirectoryListing | null> {
  const store = getDirectoryStore();
  if (!store) return null;
  const id = await store.get<string>(slugKey(slug));
  if (!id) return null;
  return getListingById(id);
}

export async function getListingByOwnerEmail(
  email: string,
): Promise<LegalDirectoryListing | null> {
  const store = getDirectoryStore();
  if (!store) return null;
  const id = await store.get<string>(emailKey(email));
  if (!id) return null;
  return getListingById(id);
}

export async function listAllListings(): Promise<LegalDirectoryListing[]> {
  const ids = await readIds();
  const rows = await Promise.all(ids.map((id) => getListingById(id)));
  return rows.filter((r): r is LegalDirectoryListing => r !== null);
}

export async function listApprovedListings(): Promise<LegalDirectoryListing[]> {
  const all = await listAllListings();
  return all.filter((l) => l.status === 'approved');
}

export function toPublicListing(listing: LegalDirectoryListing): PublicLegalDirectoryListing {
  const pub = { ...listing } as PublicLegalDirectoryListing & LegalDirectoryListing;
  delete (pub as Partial<LegalDirectoryListing>).ownerEmail;
  delete (pub as Partial<LegalDirectoryListing>).managementTokenHash;
  delete (pub as Partial<LegalDirectoryListing>).managementTokenExpiresAt;
  delete (pub as Partial<LegalDirectoryListing>).moderationNotes;
  delete (pub as Partial<LegalDirectoryListing>).reviewFlags;
  delete (pub as Partial<LegalDirectoryListing>).riskScore;
  delete (pub as Partial<LegalDirectoryListing>).pendingChanges;
  delete (pub as Partial<LegalDirectoryListing>).submitterIp;
  return pub as PublicLegalDirectoryListing;
}

export function isPubliclyVisible(listing: LegalDirectoryListing): boolean {
  return listing.status === 'approved';
}

export interface CreateListingInput {
  businessName: string;
  providerType: string;
  categorySlug: string;
  contactPerson: string;
  email: string;
  phone: string;
  emergencyPhone?: string;
  websiteUrl?: string;
  addressLine1?: string;
  addressLine2?: string;
  town: string;
  county: string;
  postcode?: string;
  region?: string;
  areasCovered?: string;
  policeStationsCovered?: string;
  courtsCovered?: string;
  description: string;
  specialisms?: string;
  legalAidStatus?: LegalAidStatus;
  availability24Hour?: boolean;
  regulatoryBody?: string;
  regulatoryNumber?: string;
  accreditationDetails?: string;
  consentAuthority: boolean;
  consentGdpr: boolean;
  honeypotFilled?: boolean;
  /** Raw input contained script/injection markup (detected before sanitisation). */
  scriptAttempt?: boolean;
  submitterIp?: string;
}

export type CreateListingResult =
  | {
      ok: true;
      id: string;
      slug: string;
      status: LegalDirectoryListingStatus;
      managementToken: string;
    }
  | { ok: false; error: string };

export async function createListing(
  input: CreateListingInput,
): Promise<CreateListingResult> {
  const store = getDirectoryStore();
  if (!store) {
    return {
      ok: false,
      error:
        'Directory storage is not available. Please try again later or contact the site owner.',
    };
  }

  const email = normalizeEmail(input.email);
  const descErr = validateDescription(input.description);
  if (descErr) return { ok: false, error: descErr };

  const existing = await getListingByOwnerEmail(email);
  if (existing && existing.status !== 'deleted' && existing.status !== 'rejected') {
    return {
      ok: false,
      error:
        'A listing already exists for this email address. Use Manage Your Listing to request changes.',
    };
  }

  const category =
    getCategoryBySlug(input.categorySlug) ??
    getCategoryBySlug(categorySlugFromProviderType(input.providerType));
  const categorySlug = category?.slug ?? input.categorySlug ?? 'other';

  const risk = scoreLegalDirectorySubmission({
    businessName: input.businessName,
    email,
    description: input.description,
    websiteUrl: input.websiteUrl ?? '',
    regulatoryNumber: input.regulatoryNumber ?? '',
    regulatoryBody: input.regulatoryBody ?? '',
    category: categorySlug,
    honeypotFilled: input.honeypotFilled,
    scriptAttempt: input.scriptAttempt,
  });

  const status = statusFromRisk(risk, Boolean(input.honeypotFilled));
  const id = newId();
  const slug = buildListingSlug(input.businessName, input.town, email);
  const now = new Date().toISOString();
  const { token, hash, expiresAt } = generateManagementToken();

  await store.set(mgmtKey(hash), {
    listingId: id,
    email,
    exp: expiresAt,
  });

  const listing: LegalDirectoryListing = {
    id,
    businessName: sanitizeText(input.businessName, 200),
    slug,
    providerType: sanitizeText(input.providerType, 120) || category?.providerType || 'Provider',
    category: category?.label ?? 'Other Legal Services',
    categorySlug,
    contactPerson: sanitizeText(input.contactPerson, 120),
    email,
    phone: sanitizeText(input.phone, 40),
    emergencyPhone: sanitizeText(input.emergencyPhone, 40),
    websiteUrl: sanitizeUrl(input.websiteUrl),
    addressLine1: sanitizeText(input.addressLine1, 200),
    addressLine2: sanitizeText(input.addressLine2, 200),
    town: sanitizeText(input.town, 100),
    county: sanitizeText(input.county, 100),
    postcode: sanitizeText(input.postcode, 20),
    region: sanitizeText(input.region, 80),
    areasCovered: sanitizeMultiline(input.areasCovered, 1500),
    policeStationsCovered: sanitizeMultiline(input.policeStationsCovered, 1500),
    courtsCovered: sanitizeMultiline(input.courtsCovered, 1500),
    description: sanitizeMultiline(input.description, 4000),
    specialisms: sanitizeMultiline(input.specialisms, 1000),
    legalAidStatus: input.legalAidStatus ?? 'not_applicable',
    availability24Hour: Boolean(input.availability24Hour),
    regulatoryBody: sanitizeText(input.regulatoryBody, 120),
    regulatoryNumber: sanitizeText(input.regulatoryNumber, 80),
    accreditationDetails: sanitizeMultiline(input.accreditationDetails, 1000),
    logoUrl: '',
    status,
    featured: false,
    promoted: false,
    verified: false,
    dateSubmitted: now,
    dateApproved: null,
    lastUpdated: now,
    deletionRequestedAt: null,
    seoTitle: buildSeoTitle(input.businessName, categorySlug, input.town, input.county),
    seoDescription: sanitizeText(input.description, 160),
    keywords: sanitizeText(input.specialisms, 300),
    views: 0,
    enquiryCount: 0,
    ownerEmail: email,
    managementTokenHash: hash,
    managementTokenExpiresAt: expiresAt,
    riskScore: risk.riskScore,
    reviewFlags: risk.reviewFlags,
    moderationNotes: '',
    pendingChanges: null,
    submitterIp: input.submitterIp,
  };

  await store.set(listingKey(id), listing);
  await store.set(slugKey(slug), id);
  await store.set(emailKey(email), id);

  const ids = await readIds();
  if (!ids.includes(id)) {
    ids.push(id);
    await writeIds(ids);
  }

  return { ok: true, id, slug, status, managementToken: token };
}

/**
 * Issues a fresh management token for an existing listing, persists the hash on
 * the listing, and writes the lookup record. Returns the raw token to email.
 */
export async function issueManagementTokenForListing(
  listing: LegalDirectoryListing,
): Promise<string | null> {
  const store = getDirectoryStore();
  if (!store) return null;
  const { token, hash, expiresAt } = generateManagementToken();
  listing.managementTokenHash = hash;
  listing.managementTokenExpiresAt = expiresAt;
  await saveListing(listing);
  await store.set(mgmtKey(hash), {
    listingId: listing.id,
    email: listing.ownerEmail,
    exp: expiresAt,
  });
  return token;
}

export async function resolveManagementToken(
  token: string,
): Promise<{ listing: LegalDirectoryListing; email: string } | null> {
  const store = getDirectoryStore();
  if (!store) return null;
  const hash = hashToken(token);
  const rec = await store.get<{ listingId: string; email: string; exp: string }>(mgmtKey(hash));
  if (!rec) return null;
  if (new Date(rec.exp).getTime() < Date.now()) return null;
  const listing = await getListingById(rec.listingId);
  if (!listing || listing.status === 'deleted') return null;
  return { listing, email: rec.email };
}

export async function saveListing(listing: LegalDirectoryListing): Promise<void> {
  const store = getDirectoryStore();
  if (!store) return;
  listing.lastUpdated = new Date().toISOString();
  await store.set(listingKey(listing.id), listing);
}

export async function applyPendingChanges(
  listingId: string,
  approvedBy: string,
): Promise<LegalDirectoryListing | null> {
  const listing = await getListingById(listingId);
  if (!listing || !listing.pendingChanges) return null;
  const patch = listing.pendingChanges;
  const updated: LegalDirectoryListing = {
    ...listing,
    ...patch,
    id: listing.id,
    status: 'approved',
    pendingChanges: null,
    lastUpdated: new Date().toISOString(),
    moderationNotes: `${listing.moderationNotes}\nAmendment approved by ${approvedBy} at ${new Date().toISOString()}`.trim(),
  };
  if (patch.slug && patch.slug !== listing.slug) {
    const store = getDirectoryStore();
    if (store) {
      await store.del(slugKey(listing.slug));
      await store.set(slugKey(updated.slug), listing.id);
    }
  }
  await saveListing(updated);
  return updated;
}

export async function createListingRequest(
  req: Omit<LegalDirectoryListingRequest, 'id' | 'dateSubmitted' | 'dateReviewed' | 'reviewedBy'>,
): Promise<string> {
  const store = getDirectoryStore();
  const id = newId().replace('ld_', 'ldr_');
  const full: LegalDirectoryListingRequest = {
    ...req,
    id,
    dateSubmitted: new Date().toISOString(),
    dateReviewed: null,
    reviewedBy: null,
  };
  if (store) {
    await store.set(requestKey(id), full);
    const ids = await readReqIds();
    if (!ids.includes(id)) {
      ids.push(id);
      await writeReqIds(ids);
    }
  }
  return id;
}

export async function listAllRequests(): Promise<LegalDirectoryListingRequest[]> {
  const ids = await readReqIds();
  const store = getDirectoryStore();
  if (!store) return [];
  const rows = await Promise.all(
    ids.map((id) => store.get<LegalDirectoryListingRequest>(requestKey(id))),
  );
  return rows.filter((r): r is LegalDirectoryListingRequest => r !== null);
}

export async function getRequestById(id: string): Promise<LegalDirectoryListingRequest | null> {
  const store = getDirectoryStore();
  if (!store) return null;
  return store.get<LegalDirectoryListingRequest>(requestKey(id));
}

export async function saveRequest(req: LegalDirectoryListingRequest): Promise<void> {
  const store = getDirectoryStore();
  if (!store) return;
  await store.set(requestKey(req.id), req);
}

/** Filter approved listings for public directory views. */
export function filterListings(
  listings: LegalDirectoryListing[],
  opts: {
    q?: string;
    categorySlug?: string;
    town?: string;
    county?: string;
    region?: string;
    legalAid?: LegalAidStatus;
    availability24Hour?: boolean;
    featuredFirst?: boolean;
  },
): LegalDirectoryListing[] {
  let result = listings.filter((l) => l.status === 'approved');

  if (opts.categorySlug) {
    result = result.filter((l) => l.categorySlug === opts.categorySlug);
  }
  if (opts.county) {
    const c = opts.county.toLowerCase();
    result = result.filter(
      (l) =>
        l.county.toLowerCase().includes(c) ||
        l.areasCovered.toLowerCase().includes(c),
    );
  }
  if (opts.town) {
    const t = opts.town.toLowerCase();
    result = result.filter(
      (l) =>
        l.town.toLowerCase().includes(t) ||
        l.areasCovered.toLowerCase().includes(t),
    );
  }
  if (opts.region) {
    const r = opts.region.toLowerCase();
    result = result.filter((l) => l.region.toLowerCase().includes(r));
  }
  if (opts.legalAid) {
    result = result.filter((l) => l.legalAidStatus === opts.legalAid);
  }
  if (opts.availability24Hour) {
    result = result.filter((l) => l.availability24Hour);
  }
  if (opts.q) {
    const q = opts.q.toLowerCase();
    result = result.filter(
      (l) =>
        l.businessName.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.specialisms.toLowerCase().includes(q) ||
        l.areasCovered.toLowerCase().includes(q),
    );
  }

  if (opts.featuredFirst) {
    result = [...result].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.promoted !== b.promoted) return a.promoted ? -1 : 1;
      return a.businessName.localeCompare(b.businessName);
    });
  } else {
    result = [...result].sort((a, b) => a.businessName.localeCompare(b.businessName));
  }

  return result;
}

export function getLocationSlugForListing(listing: LegalDirectoryListing): string {
  return locationSlugFromParts(listing.town, listing.county);
}

export { parseBooleanField, parseLegalAidStatus, sanitizeText, sanitizeMultiline, sanitizeUrl };
