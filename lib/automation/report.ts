import type {
  DailyHealthReport,
  HealthIssue,
  OverallReportStatus,
  RepairAction,
} from './types';

export function computeOverallStatus(input: {
  issues: HealthIssue[];
  repairs: RepairAction[];
}): OverallReportStatus {
  const human = input.issues.some((i) => i.requiresHumanAction && i.severity !== 'info');
  const critical = input.issues.some((i) => i.severity === 'critical');
  if (human || critical) return 'Action Required';

  const verifiedRepairs = input.repairs.filter((r) => r.attempted && r.verified);
  const failedRepairs = input.repairs.filter((r) => r.attempted && !r.verified);
  if (failedRepairs.length > 0) return 'Warning';
  if (verifiedRepairs.length > 0) return 'Repaired';

  const warnings = input.issues.filter((i) => i.severity === 'warning' || i.severity === 'error');
  if (warnings.length > 0) return 'Warning';
  return 'Healthy';
}

export function buildDailyHealthReport(input: {
  date: string;
  executionId: string;
  dryRun: boolean;
  bufferExpected: number;
  bufferActual: number;
  crossSiteExpected: number;
  crossSiteActual: number;
  failedJobs: string[];
  repairs: RepairAction[];
  issues: HealthIssue[];
  duplicatesPrevented: number;
  emailsSuppressed: number;
  notes?: string[];
}): DailyHealthReport {
  const overallStatus = computeOverallStatus({
    issues: input.issues,
    repairs: input.repairs,
  });

  const actionRequired = input.issues
    .filter((i) => i.requiresHumanAction)
    .map((i) => i.summary);

  return {
    date: input.date,
    overallStatus,
    executionId: input.executionId,
    dryRun: input.dryRun,
    bufferExpected: input.bufferExpected,
    bufferActual: input.bufferActual,
    crossSiteExpected: input.crossSiteExpected,
    crossSiteActual: input.crossSiteActual,
    failedJobs: input.failedJobs,
    repairsAttempted: input.repairs.filter((r) => r.attempted).length,
    repairsVerified: input.repairs.filter((r) => r.attempted && r.verified).length,
    duplicatesPrevented: input.duplicatesPrevented,
    emailsSuppressed: input.emailsSuppressed,
    unresolvedIssues: input.issues.filter((i) => i.severity !== 'info'),
    actionRequired,
    notes: input.notes ?? [],
    generatedAt: new Date().toISOString(),
  };
}
