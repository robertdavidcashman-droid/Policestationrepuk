import { isPlausibleOutreachEmail } from './enrichment/validator';
import { isOwnSiteUrl } from './enrichment/website-discovery';
import { getProspect, listProspectsByStatus, saveProspect } from './storage';
import type { FirmProspectStatus } from './types';

export interface CleanupNonFirmEmailsTarget {
  id: string;
  status: FirmProspectStatus;
  firmName: string;
  email: string;
  campaignId: string;
  reason: 'bad_email' | 'own_site_website';
}

export interface CleanupNonFirmEmailsResult {
  campaignId: string | null;
  dryRun: boolean;
  scanned: number;
  targets: CleanupNonFirmEmailsTarget[];
  reset: number;
}

const DEFAULT_STATUSES: FirmProspectStatus[] = ['ready_to_send', 'sent'];
const SKIP_STATUSES = new Set<FirmProspectStatus>(['unsubscribed', 'bounced']);

/**
 * Reset prospects whose stored email is now rejected as non-firm (directories,
 * widgets, gov.uk, placeholders). Clears email and moves back to discovered
 * so enrichment can find the firm's real address.
 */
export async function cleanupNonFirmProspectEmails(opts?: {
  campaignId?: string;
  dryRun?: boolean;
  statuses?: FirmProspectStatus[];
  /** Scan every prospect (except unsubscribed/bounced) instead of only ready/sent. */
  allStatuses?: boolean;
}): Promise<CleanupNonFirmEmailsResult> {
  const dryRun = opts?.dryRun ?? false;
  const campaignId = opts?.campaignId?.trim() || null;
  const targets: CleanupNonFirmEmailsTarget[] = [];
  let scanned = 0;

  const prospects: Awaited<ReturnType<typeof listProspectsByStatus>> = [];

  if (opts?.allStatuses) {
    const { listAllProspectIds } = await import('./storage');
    const { getProspect } = await import('./storage');
    const ids = await listAllProspectIds();
    for (const id of ids) {
      const p = await getProspect(id);
      if (p) prospects.push(p);
    }
  } else {
    const statuses = opts?.statuses ?? DEFAULT_STATUSES;
    for (const status of statuses) {
      prospects.push(...(await listProspectsByStatus(status, 10_000)));
    }
  }

  for (const p of prospects) {
    if (SKIP_STATUSES.has(p.status)) continue;
    if (campaignId && p.campaignId !== campaignId) continue;
    scanned++;

    const ownSite = p.websiteUrl && isOwnSiteUrl(p.websiteUrl);
    const badEmail = p.email && !isPlausibleOutreachEmail(p.email);

    if (ownSite || badEmail) {
      targets.push({
        id: p.id,
        status: p.status,
        firmName: p.firmName,
        email: p.email ?? '',
        campaignId: p.campaignId,
        reason: ownSite ? 'own_site_website' : 'bad_email',
      });
    }
  }

  if (dryRun) {
    return { campaignId, dryRun, scanned, targets, reset: 0 };
  }

  let reset = 0;
  for (const t of targets) {
    const p = await getProspect(t.id);
    if (!p) continue;
    const stillBadEmail = p.email && !isPlausibleOutreachEmail(p.email);
    const stillOwnSite = p.websiteUrl && isOwnSiteUrl(p.websiteUrl);
    if (!stillBadEmail && !stillOwnSite) continue;

    const previousStatus = p.status;
    p.status = 'discovered';
    delete p.email;
    delete p.emailConfidence;
    delete p.emailScore;
    delete p.alternativeEmails;
    if (stillOwnSite) delete p.websiteUrl;
    await saveProspect(p, previousStatus);
    reset++;
  }

  return { campaignId, dryRun, scanned, targets, reset };
}
