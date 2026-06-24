import { runFirmEnrichment } from './enrichment/run-enrich';
import { reindexProspectStatuses } from './reindex-prospects';
import { isOutreachSendAllowed, setAdminPauseState, getOutreachPauseSummary } from './pause-state';
import { countProspectsByStatus } from './storage';

export interface BootstrapOutreachResult {
  unpaused: boolean;
  pauseBefore: Awaited<ReturnType<typeof getOutreachPauseSummary>>;
  pauseAfter: Awaited<ReturnType<typeof getOutreachPauseSummary>>;
  sendAllowed: boolean;
  countsBefore: Record<string, number>;
  countsAfter: Record<string, number>;
  reindex?: Awaited<ReturnType<typeof reindexProspectStatuses>>;
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

  const batchResults: Awaited<ReturnType<typeof runFirmEnrichment>>[] = [];

  for (let i = 0; i < batches; i++) {
    if (Date.now() >= deadline) break;
    const remaining = deadline - Date.now();
    const stats = await runFirmEnrichment({
      limit,
      maxElapsedMs: Math.min(maxElapsedMs, remaining),
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

  let countsAfter = await countProspectsByStatus();
  if (totals.processed > 0) {
    reindexResult = await reindexProspectStatuses();
    countsAfter = await countProspectsByStatus();
  }

  return {
    unpaused,
    pauseBefore,
    pauseAfter,
    sendAllowed: await isOutreachSendAllowed(),
    countsBefore,
    countsAfter,
    reindex: reindexResult,
    batches: batchResults,
    totals,
  };
}
