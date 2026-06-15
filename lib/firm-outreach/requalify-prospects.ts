import { ensureDsccRegisterCache } from '@/lib/dscc-register-lookup';
import { readLaaCrimeJson } from '@/lib/legal-directory/laa-fetch';
import { websiteIndicatesCrimePractice } from './crime-website-verify';
import {
  buildCrimeRegistry,
  qualifyProspectForOutreach,
  resolveStatusWithQualification,
} from './qualification';
import { reconcileReadyProspectStatus } from './reconcile-ready-status';
import { getProspect, listAllProspectIds, saveProspect } from './storage';

export interface RequalifyResult {
  scanned: number;
  downgradedFromReady: number;
  reconciledFromReady: number;
  heldForReview: number;
  websiteVerified: number;
  stillReady: number;
  samples: Array<{ id: string; firmName: string; from: string; to: string; reason: string }>;
}

export async function requalifyAllProspects(opts?: {
  sampleLimit?: number;
  verifyWebsites?: boolean;
}): Promise<RequalifyResult> {
  const sampleLimit = opts?.sampleLimit ?? 20;
  const verifyWebsites = opts?.verifyWebsites ?? true;
  const result: RequalifyResult = {
    scanned: 0,
    downgradedFromReady: 0,
    reconciledFromReady: 0,
    heldForReview: 0,
    websiteVerified: 0,
    stillReady: 0,
    samples: [],
  };

  const laa = readLaaCrimeJson();
  const dscc = await ensureDsccRegisterCache();
  const registry = buildCrimeRegistry(laa, dscc?.entries ?? []);

  const ids = await listAllProspectIds();
  for (const id of ids) {
    const p = await getProspect(id);
    if (!p) continue;
    result.scanned++;

    let websiteVerifiedNow = false;
    if (
      verifyWebsites &&
      !p.crimeWebsiteVerified &&
      p.websiteUrl &&
      (p.sources.includes('archive') || p.excludedReason === 'archive_only_not_on_laa_or_dscc')
    ) {
      if (await websiteIndicatesCrimePractice(p.websiteUrl)) {
        p.crimeWebsiteVerified = true;
        websiteVerifiedNow = true;
      }
    }

    const q = qualifyProspectForOutreach(p, registry);
    const prevStatus = p.status;

    const reconciled = reconcileReadyProspectStatus(p);
    if (reconciled) {
      p.status = reconciled;
      p.updatedAt = new Date().toISOString();
      await saveProspect(p, prevStatus);
      result.reconciledFromReady++;
      if (result.samples.length < sampleLimit) {
        result.samples.push({
          id: p.id,
          firmName: p.firmName,
          from: prevStatus,
          to: p.status,
          reason: reconciled === 'sent' ? 'initial_send_already_recorded' : 'invalid_email_format',
        });
      }
      continue;
    }

    if (p.status === 'excluded' && p.excludedReason === 'archive_only_not_on_laa_or_dscc') {
      if (q.qualified) {
        if (websiteVerifiedNow || p.crimeWebsiteVerified) result.websiteVerified++;
        p.excludedReason = undefined;
        const preferred = p.lastEmailAt ? 'sent' : 'ready_to_send';
        p.status = resolveStatusWithQualification(p, preferred, registry);
        p.updatedAt = new Date().toISOString();
        await saveProspect(p, prevStatus);
        if (result.samples.length < sampleLimit) {
          result.samples.push({
            id: p.id,
            firmName: p.firmName,
            from: prevStatus,
            to: p.status,
            reason: q.reason,
          });
        }
      } else if (websiteVerifiedNow) {
        p.updatedAt = new Date().toISOString();
        await saveProspect(p, prevStatus);
      }
      continue;
    }

    if (p.status === 'ready_to_send' && !q.qualified) {
      p.status = resolveStatusWithQualification(p, 'ready_to_send', registry);
      p.excludedReason = undefined;
      result.downgradedFromReady++;
      result.heldForReview++;
      p.updatedAt = new Date().toISOString();
      await saveProspect(p, prevStatus);
      if (result.samples.length < sampleLimit) {
        result.samples.push({
          id: p.id,
          firmName: p.firmName,
          from: prevStatus,
          to: p.status,
          reason: q.reason,
        });
      }
      continue;
    }

    if (p.status === 'ready_to_send' && q.qualified) {
      result.stillReady++;
    }
  }

  return result;
}
