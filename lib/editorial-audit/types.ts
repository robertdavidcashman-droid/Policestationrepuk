export type ContentType = 'blog' | 'wiki' | 'legal-update' | 'guide' | 'fee-rights';

export type FlagSeverity = 'PROBLEM' | 'REVIEW' | 'GAP';

export interface RedFlag {
  severity: FlagSeverity;
  code: string;
  message: string;
  excerpt?: string;
}

export interface AuditUnit {
  id: string;
  url: string;
  contentType: ContentType;
  sourceFile: string;
  sectionTitle: string;
  sectionIndex: number;
  text: string;
}

export interface AuditFinding {
  fingerprint: string;
  unitId: string;
  url: string;
  sectionTitle: string;
  sourceFile: string;
  severity: 'PROBLEM' | 'REVIEW';
  code: string;
  reason: string;
  proposedFix: string;
  excerpt?: string;
}

export interface InventoryItem {
  url: string;
  contentType: ContentType;
  sourceFile: string;
  hasReliabilityNotice: boolean;
  hasSourcesFooter: boolean;
  customSourcesInContentSources: boolean;
  auditTier: number | null;
  auditStatus: string;
  redFlags: RedFlag[];
}
