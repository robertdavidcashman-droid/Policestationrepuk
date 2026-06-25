import { ensureDsccRegisterCache } from '@/lib/dscc-register-lookup';
import { readLaaCrimeJson } from '@/lib/legal-directory/laa-fetch';
import { websiteIndicatesCrimePractice } from './crime-website-verify';
import {
  buildCrimeRegistry,
  qualifyProspectForOutreach,
  resolveStatusWithQualification,
} from './qualification';
import { reconcileReadyProspectStatus } from './reconcile-ready-status';
import { getProspect, listAllProspectIds, listProspectIdsByStatus, saveProspect } from './storage';
import { isPlausibleOutreachEmail, validateEmailForSend } from './enrichment/validator';

export interface RequalifyResult {
  scanned: number;
  downgradedFromReady: number;
  reconciledFromReady: number;
  mxDowngradedFromReady: number;
  promotedToReady: number;
  heldForReview: number;
  websiteVerified: number;
  stillReady: number;
  stoppedEarly?: boolean;
  samples: Array<{ id: string; firmName: string; from: string; to: string; reason: string }>;
}

export async function requalifyAllProspects(opts?: {
  sampleLimit?: number;
  verifyWebsites?: boolean;
  /** Only scan ready_to_send rows (fast path for bootstrap kick). */
  readyOnly?: boolean;
  maxElapsedMs?: number;
  startedAt?: number;
  /** Max MX lookups per run (maintain cron stays within timeout). */
  mxCheckLimit?: number;
}): Promise<RequalifyResult> {
  const sampleLimit = opts?.sampleLimit ?? 20;
  const verifyWebsites = opts?.verifyWebsites ?? true;
  const readyOnly = opts?.readyOnly ?? false;
  const mxCheckLimit = opts?.mxCheckLimit ?? 50;
  const started = opts?.startedAt ?? Date.now();
  const deadline =
    opts?.maxElapsedMs != null ? started + opts.maxElapsedMs : undefined;
  const result: RequalifyResult = {
    scanned: 0,
    downgradedFromReady: 0,
    reconciledFromReady: 0,
    mxDowngradedFromReady: 0,
    promotedToReady: 0,
    heldForReview: 0,
    websiteVerified: 0,
    stillReady: 0,
    stoppedEarly: false,
    samples: [],
  };

  const laa = readLaaCrimeJson();
  const dscc = await ensureDsccRegisterCache();
  const registry = buildCrimeRegistry(laa, dscc?.entries ?? []);

  const ids = readyOnly
    ? await listProspectIdsByStatus('ready_to_send')
    : await listAllProspectIds();
  let mxChecks = 0;
  for (const id of ids) {
    if (deadline != null && Date.now() >= deadline) {
      result.stoppedEarly = true;
      break;
    }
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

    if (
      p.status === 'ready_to_send' &&
      p.email &&
      isPlausibleOutreachEmail(p.email) &&
      mxChecks < mxCheckLimit
    ) {
      mxChecks++;
      const mx = await validateEmailForSend(p.email);
      if (!mx.ok) {
        const prevStatus = p.status;
        p.email = undefined;
        p.emailConfidence = undefined;
        p.emailScore = undefined;
        p.status = 'discovered';
        p.updatedAt = new Date().toISOString();
        await saveProspect(p, prevStatus);
        result.downgradedFromReady++;
        result.mxDowngradedFromReady++;
        if (result.samples.length < sampleLimit) {
          result.samples.push({
            id: p.id,
            firmName: p.firmName,
            from: prevStatus,
            to: p.status,
            reason: mx.reason ?? 'no_mx',
          });
        }
        continue;
      }
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

    if (
      (p.status === 'discovered' || p.status === 'enriched') &&
      p.email &&
      isPlausibleOutreachEmail(p.email) &&
      q.qualified
    ) {
      const preferred = p.lastEmailAt ? 'sent' : 'ready_to_send';
      const next = resolveStatusWithQualification(p, preferred, registry);
      if (next === 'ready_to_send' || next === 'sent') {
        p.status = next;
        p.updatedAt = new Date().toISOString();
        await saveProspect(p, prevStatus);
        if (next === 'ready_to_send') result.promotedToReady++;
        if (result.samples.length < sampleLimit) {
          result.samples.push({
            id: p.id,
            firmName: p.firmName,
            from: prevStatus,
            to: p.status,
            reason: next === 'sent' ? 'initial_send_already_recorded' : q.reason,
          });
        }
        continue;
      }
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
