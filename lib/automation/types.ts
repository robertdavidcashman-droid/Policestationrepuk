/** Shared types for the automation health-check and self-healing layer. */

export type AutomationJobType =
  | 'buffer_schedule'
  | 'buffer_verify'
  | 'buffer_report'
  | 'healthcheck'
  | 'watchdog'
  | 'manual';

export type AutomationHealthStatus =
  | 'healthy'
  | 'degraded'
  | 'failing'
  | 'unknown'
  | 'disabled';

export type ExecutionStatus =
  | 'queued'
  | 'running'
  | 'successful'
  | 'partially_successful'
  | 'failed'
  | 'retrying'
  | 'repaired'
  | 'skipped_duplicate'
  | 'blocked'
  | 'requires_human_action';

export type ErrorCategory =
  | 'auth'
  | 'rate_limit'
  | 'network'
  | 'validation'
  | 'quota_supply'
  | 'config'
  | 'scheduler'
  | 'duplicate'
  | 'unknown';

export type OverallReportStatus = 'Healthy' | 'Repaired' | 'Warning' | 'Action Required';

export type IncidentSeverity = 'info' | 'warning' | 'error' | 'critical';

export type IncidentStatus =
  | 'open'
  | 'acknowledged'
  | 'resolved'
  | 'suppressed';

export interface AutomationJobDefinition {
  name: string;
  jobType: AutomationJobType;
  description: string;
  enabled: boolean;
  /** Cron expression in UTC, or human schedule note */
  expectedSchedule: string;
  expectedExecutionsPerDay: number;
  expectedDailyQuota?: number;
  /** Hour window in Europe/London (inclusive start, exclusive end) when the job should have run */
  allowedWindowStartHourUtc: number;
  allowedWindowEndHourUtc: number;
  maxRetries: number;
  /** Minutes after expected run before considered overdue */
  maxToleratedDelayMinutes: number;
}

export interface AutomationJobState extends AutomationJobDefinition {
  lastAttemptedAt: string | null;
  lastSuccessfulAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
  consecutiveFailureCount: number;
  retryCount: number;
  healthStatus: AutomationHealthStatus;
  lockOwner: string | null;
  lockExpiresAt: string | null;
  lastHealthCheckAt: string | null;
  lastRepairAction: string | null;
  environment: string;
  deploymentId: string | null;
  updatedAt: string;
}

export interface ExecutionCounts {
  recordsInspected?: number;
  recordsCreated?: number;
  recordsScheduled?: number;
  recordsPosted?: number;
  recordsSkipped?: number;
  recordsRetried?: number;
  recordsRepaired?: number;
  duplicateAttemptsPrevented?: number;
  quotaExpected?: number;
  quotaAchieved?: number;
}

export interface ExecutionRecord {
  executionId: string;
  jobName: string;
  triggerSource: 'cron' | 'watchdog' | 'healthcheck' | 'admin' | 'cli' | 'internal';
  environment: string;
  deploymentId: string | null;
  startedAt: string;
  completedAt: string | null;
  status: ExecutionStatus;
  counts: ExecutionCounts;
  externalIds: string[];
  errorCategory: ErrorCategory | null;
  errorMessage: string | null;
  errorDetails: string | null;
  dryRun: boolean;
  repairs: string[];
  notes: string[];
}

export interface JobLock {
  jobName: string;
  executionId: string;
  acquiredAt: string;
  expiresAt: string;
}

export interface IncidentRecord {
  fingerprint: string;
  notificationType: string;
  jobName: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  firstDetectedAt: string;
  lastDetectedAt: string;
  firstEmailSentAt: string | null;
  lastEmailSentAt: string | null;
  emailCount: number;
  resolutionAt: string | null;
  recipient: string;
  relatedExecutionId: string | null;
  summary: string;
  category: ErrorCategory | null;
}

export interface HealthIssue {
  id: string;
  jobName: string;
  category: ErrorCategory;
  severity: IncidentSeverity;
  summary: string;
  details?: string;
  recoverable: boolean;
  requiresHumanAction: boolean;
  fingerprint: string;
}

export interface RepairAction {
  id: string;
  kind: string;
  target: string;
  attempted: boolean;
  verified: boolean;
  dryRun: boolean;
  summary: string;
  error?: string;
}

export interface DailyHealthReport {
  date: string;
  overallStatus: OverallReportStatus;
  executionId: string;
  dryRun: boolean;
  bufferExpected: number;
  bufferActual: number;
  crossSiteExpected: number;
  crossSiteActual: number;
  failedJobs: string[];
  repairsAttempted: number;
  repairsVerified: number;
  duplicatesPrevented: number;
  emailsSuppressed: number;
  unresolvedIssues: HealthIssue[];
  actionRequired: string[];
  notes: string[];
  generatedAt: string;
}

export interface WatchdogResult {
  ok: boolean;
  executionId: string;
  dryRun: boolean;
  overdueJobs: string[];
  stuckJobs: string[];
  authFailure: boolean;
  repairs: RepairAction[];
  alertsSent: number;
  notes: string[];
}
