import { loadAllReviews } from '@/lib/admin-review';
import { getAllRepsForAdmin, getRegisteredRowsByEmail } from '@/lib/data';
import {
  buildDsccNameIndex,
  checkDsccPinAgainstRegister,
  getDsccRegisterCache,
  type DsccNameIndex,
  type DsccRegisterEntry,
} from '@/lib/dscc-register-lookup';
import { matchesAutomatedSmokeRep } from '@/lib/directory-blocklist';
import {
  buildDuplicateIndex,
  duplicateReasons,
  resolveAuditRiskAssessment,
  scoreRepRisk,
  type RepRiskAssessment,
} from '@/lib/rep-risk';
import {
  listAllEnquiries,
  listAllVerifications,
} from '@/lib/rep-verification';
import {
  PUBLIC_VERIFIED_STATUSES,
  REP_STATUS_LABELS,
  type RepVerificationStatus,
} from '@/lib/rep-status';
import type {
  RepEnquiryRecord,
  RepVerificationRecord,
  Representative,
} from '@/lib/types';

export interface RepAuditRow {
  email: string;
  source: 'representative' | 'enquiry' | 'verification';
  name: string;
  phone: string;
  claimedStatus: string;
  pinSupplied: boolean;
  sraSupplied: boolean;
  proofSupplied: boolean;
  addressSupplied: boolean;
  counties: string[];
  countiesCount: number;
  stations: string[];
  stationsCount: number;
  dateRegistered: string | null;
  lastUpdated: string | null;
  ipAddress: string | null;
  publiclyVisible: boolean;
  verificationStatus: RepVerificationStatus | null;
  verificationStatusLabel: string | null;
  adminApproved: boolean | null;
  isPublic: boolean | null;
  lastVerifiedDate: string | null;
  risk: RepRiskAssessment;
  duplicateReasons: string[];
  adminNotes: string;
  slug?: string;
}

export interface RepAuditCounts {
  total: number;
  ineligible: number;
  high: number;
  medium: number;
  low: number;
  publiclyVisible: number;
  hiddenPending: number;
  enquiries: number;
  verifications: number;
}

export interface RepAuditSnapshot {
  counts: RepAuditCounts;
  rows: RepAuditRow[];
}

interface RepAuditContext {
  reps: Representative[];
  repsByEmail: Map<string, Representative>;
  registeredByEmail: Map<string, Record<string, unknown>>;
  enquiries: RepEnquiryRecord[];
  verifications: RepVerificationRecord[];
  enquiryByEmail: Map<string, RepEnquiryRecord>;
  verificationByEmail: Map<string, RepVerificationRecord>;
  reviews: Map<
    string,
    {
      riskCategory?: string | null;
      riskReasons?: string[];
      adminNotes: string;
      verificationStatus?: RepVerificationStatus | null;
      adminApproved?: boolean | null;
      isPublic?: boolean | null;
      lastVerifiedDate?: string | null;
    }
  >;
  dsccEntries: DsccRegisterEntry[];
  dsccIndex: DsccNameIndex;
  dupIdx: ReturnType<typeof buildDuplicateIndex>;
}

function asString(v: unknown): string {
  if (v == null) return '';
  if (Array.isArray(v)) return v.join(', ');
  return String(v).trim();
}

async function loadRepAuditContext(): Promise<RepAuditContext> {
  const [reps, registeredByEmail, enquiries, verifications, reviews, dsccCache] = await Promise.all([
    getAllRepsForAdmin(),
    getRegisteredRowsByEmail(),
    listAllEnquiries(),
    listAllVerifications(),
    loadAllReviews(),
    getDsccRegisterCache(),
  ]);

  const dsccEntries: DsccRegisterEntry[] = dsccCache?.entries ?? [];
  const dsccIndex = buildDsccNameIndex(dsccEntries);

  const repsByEmail = new Map<string, Representative>();
  for (const r of reps) repsByEmail.set(r.email.toLowerCase(), r);

  const enquiryByEmail = new Map<string, RepEnquiryRecord>();
  for (const e of enquiries) enquiryByEmail.set(e.email.toLowerCase(), e);

  const verificationByEmail = new Map<string, RepVerificationRecord>();
  for (const v of verifications) verificationByEmail.set(v.email.toLowerCase(), v);

  const allEmails = new Set<string>();
  for (const r of reps) allEmails.add(r.email.toLowerCase());
  for (const e of enquiries) allEmails.add(e.email.toLowerCase());
  for (const v of verifications) allEmails.add(v.email.toLowerCase());

  const dupInput = Array.from(allEmails).map((email) => {
    const rep = repsByEmail.get(email);
    const enquiry = enquiryByEmail.get(email);
    const verification = verificationByEmail.get(email);
    return {
      email,
      phone: verification?.mobile || enquiry?.mobile || rep?.phone || '',
      pinNumber: verification?.pinNumber || rep?.dsccPin || '',
      sraNumber: verification?.sraNumber || '',
      ipAddress: enquiry?.ipAddress || verification?.ipAddress || '',
      name: verification?.fullLegalName || enquiry?.fullName || rep?.name || '',
    };
  });
  const dupIdx = buildDuplicateIndex(dupInput);

  return {
    reps,
    repsByEmail,
    registeredByEmail,
    enquiries,
    verifications,
    enquiryByEmail,
    verificationByEmail,
    reviews,
    dsccEntries,
    dsccIndex,
    dupIdx,
  };
}

function commonRiskFromInputs(
  email: string,
  name: string,
  phone: string,
  category: string,
  counties: string[],
  stations: string[],
  notes: string,
  pinNumber: string,
  sraNumber: string,
  proof: string,
  firmName: string,
  professionalProfileUrl: string,
  ipAddress: string,
  registeredAt: string | null,
  lastVerifiedDate: string | null,
  status: RepVerificationStatus | null,
  adminApproved: boolean | null,
  isPublic: boolean | null,
  review: {
    riskCategory?: string | null;
    riskReasons?: string[];
    adminNotes: string;
    verificationStatus?: RepVerificationStatus | null;
    adminApproved?: boolean | null;
    isPublic?: boolean | null;
    lastVerifiedDate?: string | null;
  } | null,
  dsccEntries: DsccRegisterEntry[],
  dsccIndex: DsccNameIndex,
) {
  const heuristic = scoreRepRisk({
    email,
    phone,
    name,
    accreditation: category,
    pinNumber,
    sraNumber,
    accreditationProofFile: proof,
    firmName,
    professionalProfileUrl,
    counties,
    stations,
    notes,
    publicProfileNotes: notes,
    ipAddress,
    registeredAt,
    lastVerifiedDate,
    status,
    adminApproved,
    isPublic,
  });
  const dsccPinMatch =
    pinNumber && dsccEntries.length > 0
      ? checkDsccPinAgainstRegister(name, pinNumber, dsccEntries, { index: dsccIndex })
      : null;
  return resolveAuditRiskAssessment(
    heuristic,
    review,
    dsccPinMatch?.matched ? dsccPinMatch : null,
  );
}

function buildFromRep(
  rep: Representative,
  registeredRow: Record<string, unknown> | undefined,
  enquiry: RepEnquiryRecord | undefined,
  verification: RepVerificationRecord | undefined,
  review: {
    verificationStatus?: RepVerificationStatus | null;
    adminApproved?: boolean | null;
    isPublic?: boolean | null;
    lastVerifiedDate?: string | null;
    adminNotes: string;
  } | null,
  ctx: Pick<RepAuditContext, 'dsccEntries' | 'dsccIndex'>,
): RepAuditRow {
  const email = rep.email.toLowerCase();
  const counties =
    Array.isArray(rep.counties) && rep.counties.length
      ? rep.counties
      : rep.county
        ? [rep.county]
        : [];
  const stations = rep.stations || [];
  const claimedStatus = verification?.category || rep.accreditation || enquiry?.category || '';
  const pinSupplied = Boolean(verification?.pinNumber || rep.dsccPin);
  const sraSupplied = Boolean(verification?.sraNumber);
  const proofSupplied = Boolean(verification?.accreditationProofFile);
  const addressSupplied = Boolean(verification?.fullPostalAddress);
  const registeredAt = asString(registeredRow?.registeredAt) || null;
  const verificationStatus = review?.verificationStatus ?? null;
  const adminApproved = review?.adminApproved ?? null;
  const isPublic = review?.isPublic ?? null;
  const lastVerifiedDate = review?.lastVerifiedDate ?? null;
  const publiclyVisible =
    !!verificationStatus &&
    PUBLIC_VERIFIED_STATUSES.has(verificationStatus as never) &&
    adminApproved === true &&
    isPublic === true &&
    !!lastVerifiedDate;
  const risk = commonRiskFromInputs(
    email,
    rep.name,
    rep.phone,
    claimedStatus,
    counties,
    stations,
    rep.notes || rep.bio || '',
    verification?.pinNumber || rep.dsccPin || '',
    verification?.sraNumber || '',
    verification?.accreditationProofFile || '',
    verification?.firmName || '',
    rep.websiteUrl || verification?.professionalProfileUrl || '',
    enquiry?.ipAddress || verification?.ipAddress || '',
    registeredAt,
    lastVerifiedDate,
    verificationStatus,
    adminApproved,
    isPublic,
    review,
    ctx.dsccEntries,
    ctx.dsccIndex,
  );
  return {
    email,
    source: 'representative',
    name: verification?.publicDisplayName || rep.name,
    phone: rep.phone || verification?.mobile || enquiry?.mobile || '',
    claimedStatus,
    pinSupplied,
    sraSupplied,
    proofSupplied,
    addressSupplied,
    counties,
    countiesCount: counties.length,
    stations,
    stationsCount: stations.length,
    dateRegistered: registeredAt,
    lastUpdated: verification?.submittedAt || enquiry?.createdAt || null,
    ipAddress: enquiry?.ipAddress || verification?.ipAddress || null,
    publiclyVisible,
    verificationStatus,
    verificationStatusLabel: verificationStatus ? REP_STATUS_LABELS[verificationStatus] : null,
    adminApproved,
    isPublic,
    lastVerifiedDate,
    risk,
    duplicateReasons: [],
    adminNotes: review?.adminNotes || '',
    slug: rep.slug,
  };
}

function buildFromEnquiry(
  enquiry: RepEnquiryRecord,
  verification: RepVerificationRecord | undefined,
  review: {
    verificationStatus?: RepVerificationStatus | null;
    adminApproved?: boolean | null;
    isPublic?: boolean | null;
    lastVerifiedDate?: string | null;
    adminNotes: string;
  } | null,
  ctx: Pick<RepAuditContext, 'dsccEntries' | 'dsccIndex'>,
): RepAuditRow {
  const counties = verification?.countiesCovered || (enquiry.countyArea ? [enquiry.countyArea] : []);
  const stations = verification?.stationsCovered || [];
  const claimedStatus = verification?.category || enquiry.category;
  const verificationStatus = review?.verificationStatus ?? enquiry.status;
  return {
    email: enquiry.email,
    source: 'enquiry',
    name: verification?.publicDisplayName || enquiry.fullName,
    phone: verification?.mobile || enquiry.mobile,
    claimedStatus,
    pinSupplied: Boolean(verification?.pinNumber),
    sraSupplied: Boolean(verification?.sraNumber),
    proofSupplied: Boolean(verification?.accreditationProofFile),
    addressSupplied: Boolean(verification?.fullPostalAddress),
    counties,
    countiesCount: counties.length,
    stations,
    stationsCount: stations.length,
    dateRegistered: enquiry.createdAt,
    lastUpdated: verification?.submittedAt || enquiry.createdAt,
    ipAddress: enquiry.ipAddress || verification?.ipAddress || null,
    publiclyVisible: false,
    verificationStatus,
    verificationStatusLabel: verificationStatus ? REP_STATUS_LABELS[verificationStatus] : null,
    adminApproved: review?.adminApproved ?? null,
    isPublic: review?.isPublic ?? null,
    lastVerifiedDate: review?.lastVerifiedDate ?? null,
    risk: commonRiskFromInputs(
      enquiry.email,
      enquiry.fullName,
      enquiry.mobile,
      claimedStatus,
      counties,
      stations,
      verification?.publicProfileNotes || enquiry.shortMessage,
      verification?.pinNumber || '',
      verification?.sraNumber || '',
      verification?.accreditationProofFile || '',
      verification?.firmName || '',
      verification?.professionalProfileUrl || '',
      enquiry.ipAddress,
      enquiry.createdAt,
      review?.lastVerifiedDate ?? null,
      verificationStatus,
      review?.adminApproved ?? null,
      review?.isPublic ?? null,
      review,
      ctx.dsccEntries,
      ctx.dsccIndex,
    ),
    duplicateReasons: [],
    adminNotes: review?.adminNotes || '',
  };
}

function buildFromVerification(
  verification: RepVerificationRecord,
  review: {
    verificationStatus?: RepVerificationStatus | null;
    adminApproved?: boolean | null;
    isPublic?: boolean | null;
    lastVerifiedDate?: string | null;
    adminNotes: string;
  } | null,
  ctx: Pick<RepAuditContext, 'dsccEntries' | 'dsccIndex'>,
): RepAuditRow {
  const counties = verification.countiesCovered || [];
  const stations = verification.stationsCovered || [];
  const verificationStatus = review?.verificationStatus ?? 'verification-submitted';
  return {
    email: verification.email,
    source: 'verification',
    name: verification.publicDisplayName || verification.fullLegalName,
    phone: verification.mobile,
    claimedStatus: verification.category,
    pinSupplied: Boolean(verification.pinNumber),
    sraSupplied: Boolean(verification.sraNumber),
    proofSupplied: Boolean(verification.accreditationProofFile),
    addressSupplied: Boolean(verification.fullPostalAddress),
    counties,
    countiesCount: counties.length,
    stations,
    stationsCount: stations.length,
    dateRegistered: verification.submittedAt,
    lastUpdated: verification.submittedAt,
    ipAddress: verification.ipAddress || null,
    publiclyVisible: false,
    verificationStatus,
    verificationStatusLabel: verificationStatus ? REP_STATUS_LABELS[verificationStatus] : null,
    adminApproved: review?.adminApproved ?? null,
    isPublic: review?.isPublic ?? null,
    lastVerifiedDate: review?.lastVerifiedDate ?? null,
    risk: commonRiskFromInputs(
      verification.email,
      verification.fullLegalName,
      verification.mobile,
      verification.category,
      counties,
      stations,
      verification.publicProfileNotes,
      verification.pinNumber,
      verification.sraNumber,
      verification.accreditationProofFile,
      verification.firmName,
      verification.professionalProfileUrl,
      verification.ipAddress,
      verification.submittedAt,
      review?.lastVerifiedDate ?? null,
      verificationStatus,
      review?.adminApproved ?? null,
      review?.isPublic ?? null,
      review,
      ctx.dsccEntries,
      ctx.dsccIndex,
    ),
    duplicateReasons: [],
    adminNotes: review?.adminNotes || '',
  };
}

function composeRepAuditRows(ctx: RepAuditContext): RepAuditRow[] {
  const rows: RepAuditRow[] = [];
  const handled = new Set<string>();
  const dsccCtx = { dsccEntries: ctx.dsccEntries, dsccIndex: ctx.dsccIndex };

  for (const rep of ctx.reps) {
    const email = rep.email.toLowerCase();
    if (
      matchesAutomatedSmokeRep({
        email,
        name: rep.name,
        slug: rep.slug,
        notes: rep.notes ?? rep.bio ?? '',
      })
    ) {
      handled.add(email);
      continue;
    }
    handled.add(email);
    const review = ctx.reviews.get(email) ?? null;
    const enquiry = ctx.enquiryByEmail.get(email);
    const verification = ctx.verificationByEmail.get(email);
    const row = buildFromRep(
      rep,
      ctx.registeredByEmail.get(email),
      enquiry,
      verification,
      review,
      dsccCtx,
    );
    row.duplicateReasons = duplicateReasons(
      {
        email,
        phone: row.phone,
        pinNumber: verification?.pinNumber || rep.dsccPin,
        sraNumber: verification?.sraNumber,
        ipAddress: row.ipAddress || undefined,
        name: row.name,
      },
      ctx.dupIdx,
    );
    rows.push(row);
  }

  for (const enquiry of ctx.enquiries) {
    const email = enquiry.email.toLowerCase();
    if (handled.has(email)) continue;
    if (
      matchesAutomatedSmokeRep({
        email,
        name: enquiry.fullName,
        slug: '',
        notes: enquiry.shortMessage ?? '',
      })
    ) {
      handled.add(email);
      continue;
    }
    handled.add(email);
    const review = ctx.reviews.get(email) ?? null;
    const verification = ctx.verificationByEmail.get(email);
    const row = buildFromEnquiry(enquiry, verification, review, dsccCtx);
    row.duplicateReasons = duplicateReasons(
      {
        email,
        phone: row.phone,
        pinNumber: verification?.pinNumber,
        sraNumber: verification?.sraNumber,
        ipAddress: row.ipAddress || undefined,
        name: row.name,
      },
      ctx.dupIdx,
    );
    rows.push(row);
  }

  for (const verification of ctx.verifications) {
    const email = verification.email.toLowerCase();
    if (handled.has(email)) continue;
    if (
      matchesAutomatedSmokeRep({
        email,
        name: verification.fullLegalName,
        slug: '',
        notes: verification.publicProfileNotes ?? '',
      })
    ) {
      handled.add(email);
      continue;
    }
    handled.add(email);
    const review = ctx.reviews.get(email) ?? null;
    const row = buildFromVerification(verification, review, dsccCtx);
    row.duplicateReasons = duplicateReasons(
      {
        email,
        phone: row.phone,
        pinNumber: verification.pinNumber,
        sraNumber: verification.sraNumber,
        ipAddress: row.ipAddress || undefined,
        name: row.name,
      },
      ctx.dupIdx,
    );
    rows.push(row);
  }

  rows.sort((a, b) => {
    const order: Record<string, number> = {
      ineligible: 0,
      reject: 1,
      high: 2,
      medium: 3,
      low: 4,
    };
    const oa = order[a.risk.category] ?? 5;
    const ob = order[b.risk.category] ?? 5;
    if (oa !== ob) return oa - ob;
    const at = a.dateRegistered ? Date.parse(a.dateRegistered) : 0;
    const bt = b.dateRegistered ? Date.parse(b.dateRegistered) : 0;
    return bt - at;
  });

  return rows;
}

function buildRepAuditCounts(ctx: RepAuditContext, rows: RepAuditRow[]): RepAuditCounts {
  return {
    total: rows.length,
    ineligible: rows.filter((r) => r.risk.category === 'ineligible').length,
    high: rows.filter((r) => r.risk.category === 'high').length,
    medium: rows.filter((r) => r.risk.category === 'medium').length,
    low: rows.filter((r) => r.risk.category === 'low').length,
    publiclyVisible: rows.filter((r) => r.publiclyVisible).length,
    hiddenPending: rows.filter((r) => !r.publiclyVisible).length,
    enquiries: ctx.enquiries.filter((e) =>
      !matchesAutomatedSmokeRep({
        email: e.email,
        name: e.fullName,
        slug: '',
        notes: e.shortMessage ?? '',
      }),
    ).length,
    verifications: ctx.verifications.filter((v) =>
      !matchesAutomatedSmokeRep({
        email: v.email,
        name: v.fullLegalName,
        slug: '',
        notes: v.publicProfileNotes ?? '',
      }),
    ).length,
  };
}

export async function buildRepAuditSnapshot(): Promise<RepAuditSnapshot> {
  const ctx = await loadRepAuditContext();
  const rows = composeRepAuditRows(ctx);
  return { counts: buildRepAuditCounts(ctx, rows), rows };
}

export async function buildRepAuditRowForEmail(email: string): Promise<RepAuditRow | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const ctx = await loadRepAuditContext();
  const rows = composeRepAuditRows(ctx);
  return rows.find((r) => r.email === normalized) ?? null;
}
