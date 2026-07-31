import { AGENT_COVER_KENT_CAMPAIGN_ID } from './campaign-scope';
import { runFirmDiscovery } from './discovery/run-discovery';
import { recoverEnrichPool } from './enrichment/recover-enrich-pool';
import { runFirmEnrichment } from './enrichment/run-enrich';
import { reindexProspectStatuses } from './reindex-prospects';
import { isOutreachSendAllowed, setAdminPauseState, getOutreachPauseSummary } from './pause-state';
import { countProspectsByStatus } from './storage';
import type { DiscoveryRunStats } from './types';

export interface BootstrapOutreachResult {
  unpaused: boolean;
  pauseBefore: Awaited<ReturnType<typeof getOutreachPauseSummary>>;
  pauseAfter: Awaited<ReturnType<typeof getOutreachPauseSummary>>;
  sendAllowed: boolean;
  countsBefore: Record<string, number>;
  countsAfter: Record<string, number>;
  reindex?: Awaited<ReturnType<typeof reindexProspectStatuses>>;
  agentCoverDiscovery?: DiscoveryRunStats;
  /** Recovery for the campaign that enrich will process. */
  enrichPoolRecovery?: Awaited<ReturnType<typeof recoverEnrichPool>>;
  /** Extra recovery when seedAgentCover targets a different campaign than enrich. */
  seedCampaignRecovery?: Awaited<ReturnType<typeof recoverEnrichPool>>;
  batches: Awaited<ReturnType<typeof runFirmEnrichment>>[];
  totals: {
    processed: number;
    emailsFound: number;
    readyToSend: number;
    noEmail: number;
    errors: number;
  };
}

export async function bootstrapOutreach(opts?: {
  batches?: number;
  limit?: number;
  maxElapsedMs?: number;
  totalMaxElapsedMs?: number;
  unpauseOnly?: boolean;
  reindex?: boolean;
  reindexOnly?: boolean;
  /** Enrich a specific campaign (defaults to active RepUK campaign). */
  campaignId?: string;
  /** Seed Kent firms into agent_cover_kent_v1 before enrich. */
  seedAgentCover?: boolean;
}): Promise<BootstrapOutreachResult> {
  const batches = opts?.batches ?? 2;
  const limit = opts?.limit ?? 60;
  const maxElapsedMs = opts?.maxElapsedMs ?? 110_000;
  const deadline = Date.now() + (opts?.totalMaxElapsedMs ?? 240_000);

  const pauseBefore = await getOutreachPauseSummary();
  let unpaused = false;

  if (pauseBefore.effectivePaused && !pauseBefore.envPaused) {
    await setAdminPauseState(false);
    unpaused = true;
  }

  const pauseAfter = await getOutreachPauseSummary();
  let countsBefore = await countProspectsByStatus();
  let reindexResult: Awaited<ReturnType<typeof reindexProspectStatuses>> | undefined;

  if (opts?.reindex || opts?.reindexOnly) {
    reindexResult = await reindexProspectStatuses();
    countsBefore = await countProspectsByStatus();
  }

  const emptyTotals = {
    processed: 0,
    emailsFound: 0,
    readyToSend: 0,
    noEmail: 0,
    errors: 0,
  };

  if (opts?.unpauseOnly || opts?.reindexOnly) {
    return {
      unpaused,
      pauseBefore,
      pauseAfter,
      sendAllowed: await isOutreachSendAllowed(),
      countsBefore,
      countsAfter: await countProspectsByStatus(),
      reindex: reindexResult,
      batches: [],
      totals: emptyTotals,
    };
  }

  let agentCoverDiscovery: DiscoveryRunStats | undefined;
  if (opts?.seedAgentCover) {
    agentCoverDiscovery = await runFirmDiscovery({
      campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
      countyAllowlist: ['kent'],
    });
  }

  const batchResults: Awaited<ReturnType<typeof runFirmEnrichment>>[] = [];
  // Enrich target — must match recoverEnrichPool campaign (Bugbot: do not recover
  // agent_cover when seedAgentCover is set but enrich still targets the default).
  const campaignId = opts?.campaignId?.trim() || undefined;

  // If we seed Kent inventory but enrich a different campaign, recover Kent too.
  let seedCampaignRecovery: Awaited<ReturnType<typeof recoverEnrichPool>> | undefined;
  if (opts?.seedAgentCover && campaignId !== AGENT_COVER_KENT_CAMPAIGN_ID) {
    seedCampaignRecovery = await recoverEnrichPool({
      campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
    });
  }

  // Unstick exhausted discovered / stale no_email for the campaign enrich will run.
  const enrichPoolRecovery = await recoverEnrichPool({ campaignId });

  for (let i = 0; i < batches; i++) {
    if (Date.now() >= deadline) break;
    const remaining = deadline - Date.now();
    const stats = await runFirmEnrichment({
      limit,
      maxElapsedMs: Math.min(maxElapsedMs, remaining),
      campaignId,
    });
    batchResults.push(stats);
    if (stats.processed === 0) break;
  }

  const totals = batchResults.reduce(
    (acc, stats) => ({
      processed: acc.processed + stats.processed,
      emailsFound: acc.emailsFound + stats.emailsFound,
      readyToSend: acc.readyToSend + stats.readyToSend,
      noEmail: acc.noEmail + stats.noEmail,
      errors: acc.errors + stats.errors,
    }),
    emptyTotals,
  );

  const countsAfter = await countProspectsByStatus();

  return {
    unpaused,
    pauseBefore,
    pauseAfter,
    sendAllowed: await isOutreachSendAllowed(),
    countsBefore,
    countsAfter,
    reindex: reindexResult,
    agentCoverDiscovery,
    enrichPoolRecovery,
    seedCampaignRecovery,
    batches: batchResults,
    totals,
  };
}
