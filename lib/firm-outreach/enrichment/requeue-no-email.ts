import { MAX_ENRICH_ATTEMPTS } from './enrich-candidates';
import { getProspect, listAllProspectIds, saveProspect } from '../storage';

/** Move no_email prospects back to discovered so enrichment can retry them. */
export async function requeueNoEmailProspects(opts?: {
  maxAttempts?: number;
  dryRun?: boolean;
}): Promise<{ requeued: number }> {
  const maxAttempts = opts?.maxAttempts ?? MAX_ENRICH_ATTEMPTS;
  let requeued = 0;

  for (const id of await listAllProspectIds()) {
    const p = await getProspect(id);
    if (!p || p.status !== 'no_email') continue;
    if (p.enrichAttempts >= maxAttempts) continue;

    if (!opts?.dryRun) {
      p.status = 'discovered';
      p.updatedAt = new Date().toISOString();
      await saveProspect(p, 'no_email');
    }
    requeued++;
  }

  return { requeued };
}
