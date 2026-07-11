import { fetchLaaCrimeProviders } from '@/lib/legal-directory/laa-fetch';
import { ensureDsccRegisterCache } from '@/lib/dscc-register-lookup';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from './campaign-scope';
import { outreachEnabled, outreachSendEnabled } from './constants';
import { cleanupNonFirmProspectEmails } from './cleanup-non-firm-emails';
import { runFirmDiscovery } from './discovery/run-discovery';
import { runFirmEnrichment } from './enrichment/run-enrich';
import { sendDailyOutreachDigest } from './outreach/digest-email';
import { getOutreachSendHealth } from './outreach/from-address';
import { maybeNotifyOutreachSendFailure } from './outreach/send-failure-email';
import { runFirmOutreach } from './outreach/run-outreach';
import { claimOutreachRunLock } from './run-lock';
import { requalifyAllProspects } from './requalify-prospects';
import { countProspectsByStatus } from './storage';
import type {
  DiscoveryRunStats,
  EnrichmentRunStats,
  OutreachRunStats,
} from './types';

export interface FirmOutreachPipelineResult {
  skipped: boolean;
  reason?: string;
  cleanup?: { reset: number; targets: number };
  laa: { refreshed: boolean; source: string; count: number };
  dscc: { count: number; syncedAt: string | null };
  discovery: DiscoveryRunStats;
  agentCoverDiscovery?: DiscoveryRunStats;
  requalify: Awaited<ReturnType<typeof requalifyAllProspects>>;
  enrich: EnrichmentRunStats;
  agentCoverEnrich?: EnrichmentRunStats;
  send: OutreachRunStats;
  counts: Record<string, number>;
  elapsedMs: number;
}

function isSundayUtc(): boolean {
  return new Date().getUTCDay() === 0;
}

export async function runFirmOutreachPipeline(opts?: {
  /** Force re-download LAA spreadsheet from gov.uk */
  forceLaaRefresh?: boolean;
  enrichLimit?: number;
  /** Max wall time for enrichment (cron safety). */
  enrichMaxElapsedMs?: number;
  sendLimit?: number;
  skipSend?: boolean;
  skipEnrich?: boolean;
  /** Skip LAA/DSCC refresh, discovery, and requalify (enrich-only or send-only crons). */
  skipDiscovery?: boolean;
  skipDigest?: boolean;
  /** Skip the full ready/sent prospect cleanup scan (send/enrich ticks). */
  skipCleanup?: boolean;
  /** Skip per-status KV count scan (send-only ticks). */
  skipCounts?: boolean;
}): Promise<FirmOutreachPipelineResult> {
  const started = Date.now();

  if (!outreachEnabled()) {
    if (!opts?.skipDigest) {
      await sendDailyOutreachDigest();
    }
    return {
      skipped: true,
      reason: 'FIRM_OUTREACH_ENABLED=false',
      laa: { refreshed: false, source: 'none', count: 0 },
      dscc: { count: 0, syncedAt: null },
      discovery: emptyDiscovery(),
      requalify: emptyRequalify(),
      enrich: emptyEnrich(),
      send: emptySend(),
      counts: {},
      elapsedMs: Date.now() - started,
    };
  }

  const cleanupResult = opts?.skipCleanup
    ? { reset: 0, targets: [] as Awaited<ReturnType<typeof cleanupNonFirmProspectEmails>>['targets'] }
    : await cleanupNonFirmProspectEmails({ dryRun: false });
  const cleanup = { reset: cleanupResult.reset, targets: cleanupResult.targets.length };

  let laaResult = { refreshed: false, source: 'none' as string, records: [] as unknown[] };
  let dsccCount = 0;
  let dsccSyncedAt: string | null = null;
  let discovery = emptyDiscovery();
  let agentCoverDiscovery: DiscoveryRunStats | undefined;
  let requalify: Awaited<ReturnType<typeof requalifyAllProspects>> = emptyRequalify();
  let enrich = emptyEnrich();
  let agentCoverEnrich: EnrichmentRunStats | undefined;

  if (!opts?.skipDiscovery) {
    const forceLaa = opts?.forceLaaRefresh ?? isSundayUtc();
    laaResult = await fetchLaaCrimeProviders({ force: forceLaa }).catch((err) => {
      console.warn('[firm-outreach pipeline] LAA fetch failed, using cache:', err);
      return fetchLaaCrimeProviders({ force: false });
    });

    const dscc = await ensureDsccRegisterCache();
    dsccCount = dscc?.count ?? 0;
    dsccSyncedAt = dscc?.syncedAt ?? null;
    discovery = await runFirmDiscovery();
    agentCoverDiscovery = await runFirmDiscovery({
      campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
      countyAllowlist: ['kent'],
    });
    requalify = await requalifyAllProspects();
  }

  if (!opts?.skipEnrich) {
    const enrichLocked = await claimOutreachRunLock('enrich');
    if (!enrichLocked) {
      enrich = { ...emptyEnrich(), skippedReason: 'overlap' };
    } else {
    const enrichLimit = opts?.enrichLimit ?? (opts?.skipSend ? 120 : 60);
    enrich = await runFirmEnrichment({
      limit: enrichLimit,
      maxElapsedMs: opts?.enrichMaxElapsedMs ?? 240_000,
    });
    const kentLimit = Math.min(15, Math.max(1, Math.floor(enrichLimit / 4)));
    agentCoverEnrich = await runFirmEnrichment({
      campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
      limit: kentLimit,
      maxElapsedMs: opts?.enrichMaxElapsedMs ?? 240_000,
    });
    }
  }

  const send =
    opts?.skipSend || !outreachSendEnabled()
      ? emptySend()
      : await (async () => {
          const locked = await claimOutreachRunLock('send');
          if (!locked) {
            const skipped = emptySend();
            skipped.skippedReason = 'overlap';
            return skipped;
          }
          return runFirmOutreach({
            limit: opts?.sendLimit,
            maxElapsedMs: 240_000,
          });
        })();

  const counts = opts?.skipCounts ? {} : await countProspectsByStatus();

  if (!opts?.skipSend && !opts?.skipCounts) {
    const sendHealth = await getOutreachSendHealth();
    if (!sendHealth.sendHealthy) {
      await maybeNotifyOutreachSendFailure({
        stats: send,
        readyToSend: counts.ready_to_send ?? 0,
        reason: `Outreach send config unhealthy: ${sendHealth.sendBlockers.join('; ')}. PSA may use RepUK from-address until policestationagent.com is verified on Resend.`,
      });
    } else {
      await maybeNotifyOutreachSendFailure({
        stats: send,
        readyToSend: counts.ready_to_send ?? 0,
      });
    }
  }

  if (!opts?.skipDigest) {
    await sendDailyOutreachDigest({
      pipeline: {
        discovery,
        enrich,
        send,
        counts,
        laaRefreshed: laaResult.refreshed,
      },
    });
  }

  return {
    skipped: false,
    cleanup,
    laa: {
      refreshed: laaResult.refreshed,
      source: laaResult.source,
      count: laaResult.records.length,
    },
    dscc: {
      count: dsccCount,
      syncedAt: dsccSyncedAt,
    },
    discovery,
    agentCoverDiscovery,
    requalify,
    enrich,
    agentCoverEnrich,
    send,
    counts,
    elapsedMs: Date.now() - started,
  };
}

function emptyRequalify() {
  return {
    scanned: 0,
    downgradedFromReady: 0,
    reconciledFromReady: 0,
    mxDowngradedFromReady: 0,
    promotedToReady: 0,
    heldForReview: 0,
    websiteVerified: 0,
    stillReady: 0,
    samples: [],
  };
}

function emptyDiscovery(): DiscoveryRunStats {
  return {
    laaRows: 0,
    dsccFirms: 0,
    dsccSolicitors: 0,
    archiveRows: 0,
    directoryRows: 0,
    created: 0,
    updated: 0,
    excluded: 0,
    elapsedMs: 0,
  };
}

function emptyEnrich(): EnrichmentRunStats {
  return {
    processed: 0,
    emailsFound: 0,
    readyToSend: 0,
    noEmail: 0,
    errors: 0,
    elapsedMs: 0,
  };
}

function emptySend(): OutreachRunStats {
  return {
    queued: 0,
    sent: 0,
    skipped: 0,
    suppressed: 0,
    errors: 0,
    elapsedMs: 0,
  };
}
