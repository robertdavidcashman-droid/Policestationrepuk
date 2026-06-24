export type FirmProspectType = 'firm' | 'solicitor';

export type FirmProspectSource =
  | 'laa'
  | 'dscc'
  | 'sra'
  | 'archive'
  | 'directory'
  | 'lccsa'
  | 'manual';

export type FirmProspectStatus =
  | 'discovered'
  | 'enriching'
  | 'enriched'
  | 'ready_to_send'
  | 'sent'
  | 'bounced'
  | 'unsubscribed'
  | 'joined_whatsapp'
  | 'excluded'
  | 'no_email';

export type EmailConfidence = 'verified' | 'crawled' | 'paid_api' | 'guessed' | 'directory';

export type SuppressionReason = 'unsubscribe' | 'bounce' | 'complaint' | 'joined' | 'manual';

export interface FirmProspectEmail {
  address: string;
  confidence: EmailConfidence;
  score: number;
  source: string;
}

export interface FirmProspect {
  id: string;
  prospectType: FirmProspectType;
  firmName: string;
  /** Normalised firm key for dedupe and firm-level send caps. */
  firmKey: string;
  contactName?: string;
  title?: string;
  forename?: string;
  surname?: string;
  town?: string;
  county?: string;
  postcode?: string;
  phone?: string;
  websiteUrl?: string;
  regulatoryNumber?: string;
  email?: string;
  emailConfidence?: EmailConfidence;
  emailScore?: number;
  alternativeEmails?: FirmProspectEmail[];
  sources: FirmProspectSource[];
  /** Set when the firm website advertises criminal / police station work. */
  crimeWebsiteVerified?: boolean;
  status: FirmProspectStatus;
  priorityScore: number;
  excludedReason?: string;
  sequenceStep: number;
  lastEmailAt?: string;
  waLinkClickedAt?: string;
  joinedWhatsAppAt?: string;
  campaignId: string;
  createdAt: string;
  updatedAt: string;
  enrichedAt?: string;
  lastEnrichAttemptAt?: string;
  enrichAttempts: number;
}

export type FirmOutreachSendStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained';

export interface FirmOutreachSend {
  id: string;
  prospectId: string;
  firmName: string;
  prospectType: FirmProspectType;
  email: string;
  campaignId: string;
  sequenceStep: number;
  subject: string;
  resendMessageId?: string;
  status: FirmOutreachSendStatus;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bouncedAt?: string;
  complainedAt?: string;
  lastEventAt?: string;
  createdAt: string;
}

/** One row in the admin activity report (send + prospect outcome). */
export interface OutreachActivityRow {
  sendId: string;
  prospectId: string;
  firmName: string;
  prospectType: FirmProspectType;
  contactName?: string;
  county?: string;
  email: string;
  sequenceStep: number;
  touchLabel: string;
  subject: string;
  sendStatus: FirmOutreachSendStatus;
  prospectStatus: FirmProspectStatus;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  waLinkClickedAt?: string;
  joinedWhatsAppAt?: string;
  bouncedAt?: string;
  suppressed: boolean;
  suppressionReason?: SuppressionReason;
}

export interface OutreachActivitySummary {
  totalSends: number;
  sentToday: number;
  sentLast7Days: number;
  uniqueRecipients: number;
  bySendStatus: Record<string, number>;
  waClicks: number;
  joinedWhatsApp: number;
  bounced: number;
  complained: number;
  unsubscribed: number;
  pendingFollowUp1: number;
  pendingFollowUp2: number;
  readyToSend: number;
  discovered: number;
  noEmail: number;
  excluded: number;
}

/** One row in the admin ready-to-send queue. */
export interface OutreachQueueRow {
  prospectId: string;
  firmName: string;
  prospectType: FirmProspectType;
  contactName?: string;
  county?: string;
  email?: string;
  sources: FirmProspectSource[];
  priorityScore: number;
  crimeWebsiteVerified?: boolean;
  updatedAt: string;
  suppressed: boolean;
  suppressionReason?: SuppressionReason;
}

/** One row in the admin excluded-prospects view. */
export interface OutreachExcludedRow {
  prospectId: string;
  firmName: string;
  prospectType: FirmProspectType;
  contactName?: string;
  county?: string;
  email?: string;
  excludedReason?: string;
  sources: FirmProspectSource[];
  crimeWebsiteVerified?: boolean;
  updatedAt: string;
  suppressed: boolean;
  suppressionReason?: SuppressionReason;
}

export interface OutreachActivityReport {
  generatedAt: string;
  summary: OutreachActivitySummary;
  sends: OutreachActivityRow[];
  readyToSendProspects: OutreachQueueRow[];
  excludedProspects: OutreachExcludedRow[];
  suppressions: FirmOutreachSuppression[];
}

export interface FirmOutreachSuppression {
  emailHash: string;
  email: string;
  reason: SuppressionReason;
  createdAt: string;
}

export interface DiscoveryRunStats {
  laaRows: number;
  dsccFirms: number;
  dsccSolicitors: number;
  archiveRows: number;
  archiveSkipped?: number;
  directoryRows: number;
  created: number;
  updated: number;
  excluded: number;
  elapsedMs: number;
}

export interface EnrichmentRunStats {
  processed: number;
  emailsFound: number;
  readyToSend: number;
  noEmail: number;
  errors: number;
  elapsedMs: number;
  /** True when stopped early due to maxElapsedMs budget. */
  stoppedEarly?: boolean;
  /** Total prospects in discovered + eligible no_email pool. */
  poolSize?: number;
  /** IDs scored in the sliding window this run. */
  candidatesScanned?: number;
}

export interface OutreachRunStats {
  queued: number;
  sent: number;
  skipped: number;
  suppressed: number;
  errors: number;
  elapsedMs: number;
}
