export type CustodySourceType =
  | 'official_police'
  | 'police_uk'
  | 'foi'
  | 'pdf'
  | 'solicitor_site'
  | 'pcc'
  | 'local_authority'
  | 'archived'
  | 'unknown';

export type PhoneClassification =
  | 'direct_custody'
  | 'switchboard'
  | 'general_101'
  | 'solicitor_office'
  | 'victim_witness'
  | 'irrelevant'
  | 'unknown';

export type FindingStatus =
  | 'new'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'stale'
  | 'duplicate';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'reject';

export interface CustodySuite {
  id: string;
  /** Station slug for ISR revalidation after admin approval. */
  stationSlug?: string;
  forceName: string;
  forceDomain: string;
  county: string;
  custodySuiteName: string;
  policeStationName: string;
  address: string;
  /** True when the directory row is a dedicated custody suite (name/flag). */
  isDedicatedCustodySuite?: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AiReviewRecommendation = 'approve' | 'reject' | 'hold';

export type SourceEvidenceKind = 'page_fetch' | 'search_snippet' | 'pdf_unfetched';

export interface SourceEvidence {
  quote: string;
  section: string;
  sourceUrl: string;
  sourceTitle: string;
  source: SourceEvidenceKind;
  fetchedAt: string;
}

export interface CustodyAiReview {
  recommendation: AiReviewRecommendation;
  aiConfidence: number;
  whyPublish: string;
  whyNot?: string;
  evidence: SourceEvidence;
  publishVerified: boolean;
  flags: string[];
  model: string;
  reviewedAt: string;
}

export type NumberSafetyFlag =
  | 'mobile_number'
  | 'premium_rate'
  | 'emergency_number'
  | 'invalid_length';

export interface CustodyNumberFinding {
  id: string;
  custodySuiteId: string;
  forceName: string;
  custodySuiteName: string;
  policeStationName: string;
  possiblePhoneNumber: string;
  normalizedPhoneNumber: string;
  /** E.164 format (+44…) where derivable. */
  e164?: string | null;
  /** UK number-range safety flags (mobile / premium-rate / etc.). */
  numberFlags?: NumberSafetyFlag[];
  sourceTitle: string;
  sourceUrl: string;
  sourceDomain: string;
  sourceType: CustodySourceType;
  pageSnippet: string;
  classification: PhoneClassification;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  status: FindingStatus;
  dateFound: string;
  lastChecked: string;
  hashOfSourceEvidence: string;
  notes: string;
  conflictReason?: string;
  aiReview?: CustodyAiReview;
  autoPublishedAt?: string;
  autoRejectedAt?: string;
  /** How many times AI review re-ran because the source page fetch failed. */
  aiEvidenceRetries?: number;
  createdAt: string;
  updatedAt: string;
}

export type DiscoveryVerificationStatus = 'unverified' | 'verified';

export interface ApprovalAuditEntry {
  at: string;
  actor: string;
  action:
    | 'approved'
    | 'auto_approved'
    | 'rejected'
    | 'marked_verified'
    | 'recheck_ok'
    | 'recheck_source_missing'
    | 'recheck_number_missing'
    | 'recheck_conflict'
    | 'corroborated'
    | 'unsafe_number_flagged';
  detail?: string;
}

export interface ApprovedCustodyNumber {
  id: string;
  custodySuiteId: string;
  stationSlug?: string;
  phoneNumber: string;
  normalizedPhoneNumber: string;
  /** E.164 format (+44…) where derivable. */
  e164?: string | null;
  sourceFindingId: string;
  sourceUrl: string;
  approvedBy: string;
  approvedAt: string;
  lastVerifiedAt: string;
  /** Published in directory; starts unverified unless high confidence or admin marks verified. */
  verificationStatus: DiscoveryVerificationStatus;
  publicVisible: boolean;
  notes: string;
  auditLog?: ApprovalAuditEntry[];
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  date?: string;
}

export interface CrawlerRunStats {
  suitesScanned: number;
  searchesRun: number;
  numbersExtracted: number;
  findingsCreated: number;
  findingsUpdated: number;
  findingsRejected: number;
  conflictsFlagged: number;
  officialPagesFetched: number;
  pageFetchesUsed: number;
  batchCursor: number;
  batchStartIndex: number;
  batchTotal: number;
  scannedSuiteIds: string[];
  elapsedMs: number;
  /** True when the run stopped early due to maxElapsedMs. */
  partial?: boolean;
}
