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

export interface CustodyNumberFinding {
  id: string;
  custodySuiteId: string;
  forceName: string;
  custodySuiteName: string;
  policeStationName: string;
  possiblePhoneNumber: string;
  normalizedPhoneNumber: string;
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
  createdAt: string;
  updatedAt: string;
}

export type DiscoveryVerificationStatus = 'unverified' | 'verified';

export interface ApprovedCustodyNumber {
  id: string;
  custodySuiteId: string;
  stationSlug?: string;
  phoneNumber: string;
  normalizedPhoneNumber: string;
  sourceFindingId: string;
  sourceUrl: string;
  approvedBy: string;
  approvedAt: string;
  lastVerifiedAt: string;
  /** Published in directory; starts unverified unless high confidence or admin marks verified. */
  verificationStatus: DiscoveryVerificationStatus;
  publicVisible: boolean;
  notes: string;
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
  batchCursor: number;
  batchStartIndex: number;
  batchTotal: number;
  scannedSuiteIds: string[];
  elapsedMs: number;
}
