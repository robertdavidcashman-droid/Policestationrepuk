import { fetchLaaCrimeProviders } from '@/lib/legal-directory/laa-fetch';
import { ensureDsccRegisterCache } from '@/lib/dscc-register-lookup';
import { outreachEnabled, outreachSendEnabled } from './constants';
import { cleanupNonFirmProspectEmails } from './cleanup-non-firm-emails';
import { runFirmDiscovery } from './discovery/run-discovery';
import { runFirmEnrichment } from './enrichment/run-enrich';
import { sendDailyOutreachDigest } from './outreach/digest-email';
import { maybeNotifyOutreachSendFailure } from './outreach/send-failure-email';
import { runFirmOutreach } from './outreach/run-outreach';
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
  requalify: Awaited<ReturnType<typeof requalifyAllProspects>>;
  enrich: EnrichmentRunStats;
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

  const cleanupResult = await cleanupNonFirmProspectEmails({ dryRun: false });
  const cleanup = { reset: cleanupResult.reset, targets: cleanupResult.targets.length };

  let laaResult = { refreshed: false, source: 'none' as string, records: [] as unknown[] };
  let dsccCount = 0;
  let dsccSyncedAt: string | null = null;
  let discovery = emptyDiscovery();
  let requalify: Awaited<ReturnType<typeof requalifyAllProspects>> = emptyRequalify();
  let enrich = emptyEnrich();

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
    requalify = await requalifyAllProspects();
  }

  if (!opts?.skipEnrich) {
    const enrichLimit = opts?.enrichLimit ?? (opts?.skipSend ? 120 : 60);
    enrich = await runFirmEnrichment({
      limit: enrichLimit,
      maxElapsedMs: opts?.enrichMaxElapsedMs,
    });
  }

  const send =
    opts?.skipSend || !outreachSendEnabled()
      ? emptySend()
      : await runFirmOutreach({ limit: opts?.sendLimit });

  const counts = await countProspectsByStatus();

  if (!opts?.skipSend) {
    await maybeNotifyOutreachSendFailure({
      stats: send,
      readyToSend: counts.ready_to_send ?? 0,
    });
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
    requalify,
    enrich,
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
