import { verifyCrossSiteBufferPosts } from '@/lib/buffer/verify-cross-site';
import { CROSS_SITE_BUFFER_TARGETS } from '@/lib/buffer/cross-site-sites';
import { verifyRepukBufferSchedule } from '@/lib/buffer/engine-run';
import { getAutomationConfig } from '../config';
import { canPerformLiveSideEffects } from '../env-guard';
import { buildIncidentFingerprint } from '../notifications';
import { logAutomationEvent } from '../observability';
import type { HealthIssue, RepairAction } from '../types';

export interface CrossSiteRepairResult {
  ok: boolean;
  date: string;
  expected: number;
  actual: number;
  sites: Array<{
    id: string;
    hostname: string;
    sentCount: number;
    requiredCount: number;
    ok: boolean;
    issue?: string;
  }>;
  repairs: RepairAction[];
  issues: HealthIssue[];
}

/**
 * Cross-site quota check.
 * Auto-repair only REPUK (via local gap-fill). Sibling deficits → human/sibling-scheduler issues.
 */
export async function inspectAndRepairCrossSiteQuota(options?: {
  dryRun?: boolean;
  date?: string;
  now?: Date;
}): Promise<CrossSiteRepairResult> {
  const config = getAutomationConfig();
  const dryRun = options?.dryRun ?? config.dryRun;
  const report = await verifyCrossSiteBufferPosts({
    date: options?.date,
    now: options?.now,
  });

  const expected = CROSS_SITE_BUFFER_TARGETS.reduce(
    (sum, t) => sum + (t.requiredPostsPerDay ?? 5),
    0,
  );
  const actual = report.sites.reduce((sum, s) => sum + s.sentCount, 0);
  const repairs: RepairAction[] = [];
  const issues: HealthIssue[] = [];

  for (const site of report.sites) {
    if (site.ok) continue;

    logAutomationEvent('crosssite.quota.deficit', {
      siteId: site.id,
      sentCount: site.sentCount,
      requiredCount: site.requiredCount,
      date: report.date,
    });

    const fingerprint = buildIncidentFingerprint({
      jobName: 'buffer-cross-site-report',
      category: 'quota_supply',
      accountOrDestination: site.id,
      scheduledDate: report.date,
    });

    if (site.id === 'policestationrepuk') {
      // REPUK: yesterday already published window — we can only ensure today is on track;
      // yesterday deficit is recorded; gap-fill applies to today's schedule.
      if (dryRun || !config.autoRepairEnabled || !canPerformLiveSideEffects()) {
        repairs.push({
          id: `crosssite-${site.id}`,
          kind: 'crosssite_repuk_gap_fill',
          target: site.id,
          attempted: false,
          verified: false,
          dryRun: true,
          summary: `REPUK under quota yesterday (${site.sentCount}/${site.requiredCount}); would ensure today schedule via gap-fill`,
        });
      } else {
        const verify = await verifyRepukBufferSchedule({
          now: options?.now,
          gapFill: true,
        });
        const verified = verify.scheduledCount >= verify.requiredCount;
        repairs.push({
          id: `crosssite-${site.id}`,
          kind: 'crosssite_repuk_gap_fill',
          target: site.id,
          attempted: true,
          verified,
          dryRun: false,
          summary: verified
            ? `REPUK today schedule repaired to ${verify.scheduledCount}/${verify.requiredCount}`
            : `REPUK today still under quota ${verify.scheduledCount}/${verify.requiredCount}`,
        });
        if (verified) {
          logAutomationEvent('crosssite.quota.repaired', {
            siteId: site.id,
            scheduledCount: verify.scheduledCount,
          });
        }
      }

      issues.push({
        id: fingerprint,
        fingerprint,
        jobName: 'buffer-cross-site-report',
        category: site.sentCount === 0 ? 'scheduler' : 'quota_supply',
        severity: 'error',
        summary: `REPUK cross-site quota deficit on ${report.date}: ${site.sentCount}/${site.requiredCount}`,
        details: site.issue,
        recoverable: true,
        requiresHumanAction: false,
      });
    } else {
      // Sibling sites — do not auto-post from REPUK (avoids duplicate multi-feed path).
      issues.push({
        id: fingerprint,
        fingerprint,
        jobName: 'buffer-cross-site-report',
        category: 'scheduler',
        severity: 'error',
        summary: `${site.hostname} under quota on ${report.date}: ${site.sentCount}/${site.requiredCount}`,
        details:
          site.issue ??
          'Sibling site self-scheduler may have failed; repair on that site (remote repair disabled by default).',
        recoverable: false,
        requiresHumanAction: true,
      });
      repairs.push({
        id: `crosssite-${site.id}`,
        kind: 'crosssite_sibling_alert',
        target: site.id,
        attempted: false,
        verified: false,
        dryRun,
        summary: `Sibling deficit recorded — requires sibling scheduler or human action`,
      });
    }
  }

  return {
    ok: report.ok,
    date: report.date,
    expected,
    actual,
    sites: report.sites,
    repairs,
    issues,
  };
}
