export interface Representative {
  id: string;
  slug: string;
  name: string;
  phone: string;
  email: string;
  county: string;
  /** Optional list of all counties this rep covers; falls back to single `county` for older records. */
  counties?: string[];
  /** Towns, boroughs, or extra locality detail beyond selected counties (e.g. specific London boroughs). */
  coverageAreas?: string;
  addressCounty?: string;
  /**
   * @deprecated Postcode is treated as private (sole-trader home postcodes). The
   * public directory must not render this; it is retained only for legacy data
   * lookups and admin display.
   */
  postcode?: string;
  stations: string[];
  stationsCovered?: string[];
  availability: string;
  accreditation: string;
  notes: string;
  featured?: boolean;
  featuredLevel?: string;
  featuredUntil?: string | null;
  featuredBadgeText?: string | null;
  whatsappLink?: string;
  websiteUrl?: string;
  /** @deprecated PIN numbers are private and must never be rendered publicly. */
  dsccPin?: string;
  spotlightNote?: string;
  holidayAvailability?: string[];
  image?: string;
  /** @deprecated Use notes instead */
  bio?: string;
  yearsExperience?: number;
  languages?: string[];
  specialisms?: string[];
  /* -------------------------------------------------------------- */
  /*  Verification / publication gate (added 2026-05 — see          */
  /*  lib/rep-status.ts + lib/admin-review.ts)                      */
  /* -------------------------------------------------------------- */
  /** Canonical verification lifecycle status. */
  verificationStatus?: import('./rep-status').RepVerificationStatus | null;
  /** True iff an admin has manually approved this profile for publication. */
  adminApproved?: boolean | null;
  /** Whether the rep consented to being listed publicly at all. */
  isPublic?: boolean | null;
  /** ISO date of the most recent successful admin verification. */
  lastVerifiedDate?: string | null;
}

/** Private, admin-only enquiry record produced by the public enquiry form. */
export interface RepEnquiryRecord {
  id: string;
  email: string;
  fullName: string;
  mobile: string;
  countyArea: string;
  category: import('./rep-status').ApplicantCategory;
  shortMessage: string;
  status: import('./rep-status').RepVerificationStatus;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  /** Set when an admin issues the secure verification token. */
  verificationLinkSentAt?: string | null;
  /** Set when the applicant completes the secure verification form. */
  verificationSubmittedAt?: string | null;
}

/**
 * Private, admin-only secure-verification record. Stored under
 * `verification:{email}` in KV. NEVER exposed to public APIs.
 */
export interface RepVerificationRecord {
  email: string;
  fullLegalName: string;
  publicDisplayName: string;
  mobile: string;
  fullPostalAddress: string;
  firmName: string;
  firmAddress: string;
  firmEmail: string;
  sraNumber: string;
  pinNumber: string;
  accreditationProofFile: string;
  professionalProfileUrl: string;
  category: import('./rep-status').ApplicantCategory;
  countiesCovered: string[];
  townsCovered: string;
  stationsCovered: string[];
  availability: string;
  travelRadius: string;
  overnightAvailability: boolean;
  weekendAvailability: boolean;
  languages: string;
  publicProfileNotes: string;
  acceptsDirectFirmInstructions: boolean;
  publicPhoneConsent: boolean;
  publicEmailConsent: boolean;
  publicPhone: string;
  publicEmail: string;
  consents: {
    confirmsAccurate: boolean;
    confirmsEligible: boolean;
    understandsIneligibility: boolean;
    consentsToVerificationChecks: boolean;
    understandsPrivacy: boolean;
    willKeepDetailsCurrent: boolean;
    understandsConsequencesOfFalseInfo: boolean;
  };
  ipAddress: string;
  userAgent: string;
  submittedAt: string;
  updatedAt?: string | null;
}

export interface PoliceStation {
  id: string;
  slug: string;
  name: string;
  stationId?: string;
  address: string;
  postcode?: string;
  county?: string;
  phone?: string;
  custodyPhone?: string;
  custodyPhone2?: string;
  nonEmergencyPhone?: string;
  forceName?: string;
  forceCode?: string;
  category?: string;
  status?: string;
  isCustodyStation?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  custodySuite?: boolean;
  /** Optional contact fields from automated official-page extraction or community forms. */
  email?: string;
  openingHours?: string;
  custodyStatus?: 'open' | 'closed' | 'limited' | 'unknown';
  frontCounterStatus?: 'open' | 'closed' | 'appointment_only' | 'unknown';
  /** Secondary corroborating source URL (automated discovery or admin approval). */
  secondarySourceUrl?: string;
  /** Merged at load from data/station-verification.json — not stored in stations.json. */
  verificationMeta?: {
    verificationStatus?: 'verified' | 'unverified' | 'partial';
    dateVerified?: string;
    sourceUrl?: string;
    secondarySourceUrl?: string;
    fields?: Partial<
      Record<
        | 'phone'
        | 'custodyPhone'
        | 'custodyPhone2'
        | 'address'
        | 'custodyStatus'
        | 'frontCounterStatus'
        | 'email'
        | 'openingHours',
        {
          status: 'verified' | 'unverified' | 'not_publicly_listed';
          sourceUrl?: string;
          secondarySourceUrl?: string;
          dateVerified?: string;
          notes?: string;
        }
      >
    >;
    /** Merged at request time from rep-contributed custody numbers (KV). */
    custodyContribution?: {
      status: 'verified' | 'unverified';
      /** Distinct reps backing the number. */
      confirmedBy: number;
      dateVerified: string | null;
      source: 'rep_crowdsource';
    };
    /** Admin-approved autonomous web discovery (KV). */
    custodyDiscovery?: {
      status: 'verified' | 'unverified';
      sourceFindingId: string;
      sourceUrl?: string;
      approvedAt: string;
      approvedBy: string;
      source: 'autonomous_discovery';
    };
  };
}

export interface County {
  name: string;
  slug: string;
  repCount?: number;
  stationCount?: number;
  id?: string;
  region?: string;
}

export interface CountyPageData {
  county: County;
  representatives: Representative[];
  stations: PoliceStation[];
  content: CountyContent;
}

export interface CountyContent {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  sections: ContentSection[];
}

export interface ContentSection {
  heading: string;
  body: string;
}

export interface SearchFilters {
  county?: string;
  station?: string;
  availability?: string;
  accreditation?: string;
  query?: string;
}

export interface ArticleSource {
  title: string;
  url: string;
}

export interface WikiArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  excerpt: string;
  difficulty: string;
  tags: string[];
  views: number;
  helpfulCount: number;
  wordCount: number;
  factCheckStatus: string;
  publishedDate: string;
  lastImprovedDate: string | null;
  sources?: ArticleSource[];
  relatedArticles?: string[];
  sections?: string[];
  summary?: string;
  verified?: boolean;
}

export interface LawFirm {
  id: string;
  name: string;
  slug: string;
  sraNumber: string;
  address: string;
  postcode: string;
  phone: string;
  email: string;
  website: string;
  specialisms: string[];
  county: string;
  region: string;
  sizeCategory: string;
  criminalLawPractice: boolean;
  policeStationWork: boolean;
  dutySolicitorScheme: boolean;
  lastVerified: string | null;
}

export interface LegalUpdate {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  featuredImageUrl: string | null;
  isFeatured: boolean;
  publishedDate: string;
  views: number;
}

export interface FormDocument {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  category: string;
  isFeatured: boolean;
}
