import { getKV, skipKVInPrerender } from '@/lib/kv';
import {
  countProspectsByStatus,
  getProspectsByIds,
  getSuppressionsByEmails,
  listAllSends,
  listAllSuppressions,
  listProspectIdsByStatus,
} from '../storage';
import { excludedRowsForProspects, queueRowsForProspects } from './admin-actions';
import { sortProspectsForSend } from '../enrichment/scorer';
import type {
  OutreachActivityReport,
  OutreachActivityRow,
  OutreachActivitySummary,
  OutreachExcludedRow,
  OutreachQueueRow,
} from '../types';

const TOUCH_LABELS = ['Initial invite', 'Follow-up (day 7)', 'Follow-up (day 21)'] as const;
const SENT_PROSPECTS_FOLLOWUP_LIMIT = 1000;
const EXCLUDED_PROSPECTS_LIMIT = 500;
const READY_TO_SEND_LIMIT = 500;
const SUMMARY_CACHE_KEY = 'firmoutreach:admin:summary:v1';
const SUMMARY_CACHE_TTL_SECONDS = 60;

export interface OutreachActivityReportResult {
  report: OutreachActivityReport;
  prospectCounts: Record<string, number>;
}

export interface OutreachSummaryView {
  generatedAt: string;
  summary: OutreachActivitySummary;
  prospectCounts: Record<string, number>;
  recentSends: Array<{
    sendId: string;
    firmName: string;
    email: string;
    subject: string;
    sentAt?: string;
  }>;
}

function touchLabel(step: number): string {
  return TOUCH_LABELS[step] ?? `Touch ${step + 1}`;
}

function daysSince(iso: string | undefined): number {
  if (!iso) return Infinity;
  return (Date.now() - Date.parse(iso)) / (1000 * 60 * 60 * 24);
}

/** Count sends with sentAt on or after the given ISO timestamp. */
export function countSendsSince(
  sends: Array<{ sentAt?: string }>,
  sinceMs: number,
): number {
  return sends.filter((s) => s.sentAt && Date.parse(s.sentAt) >= sinceMs).length;
}

export function computeSendWindowCounts(sends: Array<{ sentAt?: string }>): {
  sentToday: number;
  sentLast7Days: number;
} {
  const now = Date.now();
  const startOfUtcDay = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate(),
  );
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  return {
    sentToday: countSendsSince(sends, startOfUtcDay),
    sentLast7Days: countSendsSince(sends, sevenDaysAgo),
  };
}

function emptySummary(prospectCounts: Record<string, number>): OutreachActivitySummary {
  return {
    totalSends: 0,
    sentToday: 0,
    sentLast7Days: 0,
    uniqueRecipients: 0,
    bySendStatus: {},
    waClicks: 0,
    joinedWhatsApp: prospectCounts.joined_whatsapp ?? 0,
    bounced: prospectCounts.bounced ?? 0,
    complained: 0,
    unsubscribed: prospectCounts.unsubscribed ?? 0,
    pendingFollowUp1: 0,
    pendingFollowUp2: 0,
    readyToSend: prospectCounts.ready_to_send ?? 0,
    discovered: prospectCounts.discovered ?? 0,
    noEmail: prospectCounts.no_email ?? 0,
    excluded: prospectCounts.excluded ?? 0,
  };
}

function computeFollowUpStats(
  sentProspects: Array<{
    waLinkClickedAt?: string;
    joinedWhatsAppAt?: string;
    lastEmailAt?: string;
    sequenceStep: number;
  }>,
): { pendingFollowUp1: number; pendingFollowUp2: number; waClicks: number } {
  let pendingFollowUp1 = 0;
  let pendingFollowUp2 = 0;
  let waClicks = 0;

  for (const p of sentProspects) {
    if (p.waLinkClickedAt) waClicks++;
    if (p.waLinkClickedAt || p.joinedWhatsAppAt) continue;
    const days = daysSince(p.lastEmailAt);
    if (p.sequenceStep === 0 && days >= 7 && days < 21) pendingFollowUp1++;
    if (p.sequenceStep === 1 && days >= 14) pendingFollowUp2++;
  }

  return { pendingFollowUp1, pendingFollowUp2, waClicks };
}

function buildSummaryFromSends(
  sends: Array<{ sentAt?: string; status: string; email: string }>,
  prospectCounts: Record<string, number>,
  followUp: { pendingFollowUp1: number; pendingFollowUp2: number; waClicks: number },
): OutreachActivitySummary {
  const bySendStatus: Record<string, number> = {};
  const uniqueEmails = new Set<string>();
  for (const send of sends) {
    uniqueEmails.add(send.email.toLowerCase());
    bySendStatus[send.status] = (bySendStatus[send.status] ?? 0) + 1;
  }
  const windowCounts = computeSendWindowCounts(sends);
  return {
    totalSends: sends.length,
    sentToday: windowCounts.sentToday,
    sentLast7Days: windowCounts.sentLast7Days,
    uniqueRecipients: uniqueEmails.size,
    bySendStatus,
    waClicks: followUp.waClicks,
    joinedWhatsApp: prospectCounts.joined_whatsapp ?? 0,
    bounced: (prospectCounts.bounced ?? 0) + (bySendStatus.bounced ?? 0),
    complained: bySendStatus.complained ?? 0,
    unsubscribed: prospectCounts.unsubscribed ?? 0,
    pendingFollowUp1: followUp.pendingFollowUp1,
    pendingFollowUp2: followUp.pendingFollowUp2,
    readyToSend: prospectCounts.ready_to_send ?? 0,
    discovered: prospectCounts.discovered ?? 0,
    noEmail: prospectCounts.no_email ?? 0,
    excluded: prospectCounts.excluded ?? 0,
  };
}

async function loadSentProspectsForFollowUp() {
  const sentIds = await listProspectIdsByStatus('sent').then((ids) =>
    ids.slice(0, SENT_PROSPECTS_FOLLOWUP_LIMIT),
  );
  const sentProspectsMap = await getProspectsByIds(sentIds);
  return [...sentProspectsMap.values()];
}

export async function buildOutreachSummaryView(): Promise<OutreachSummaryView> {
  const [sends, prospectCounts, sentProspects] = await Promise.all([
    listAllSends(),
    countProspectsByStatus(),
    loadSentProspectsForFollowUp(),
  ]);
  const followUp = computeFollowUpStats(sentProspects);
  const summary = buildSummaryFromSends(sends, prospectCounts, followUp);
  const recentSends = sends.slice(0, 8).map((s) => ({
    sendId: s.id,
    firmName: s.firmName || '—',
    email: s.email,
    subject: s.subject,
    sentAt: s.sentAt,
  }));
  return {
    generatedAt: new Date().toISOString(),
    summary,
    prospectCounts,
    recentSends,
  };
}

export async function getCachedOutreachSummaryView(refresh = false): Promise<OutreachSummaryView> {
  if (!refresh && !skipKVInPrerender()) {
    const kv = getKV();
    if (kv) {
      try {
        const cached = await kv.get<OutreachSummaryView>(SUMMARY_CACHE_KEY);
        if (cached?.summary && cached.generatedAt) return cached;
      } catch (err) {
        console.warn('[firm-outreach] summary cache read failed:', err);
      }
    }
  }

  const built = await buildOutreachSummaryView();
  if (!skipKVInPrerender()) {
    const kv = getKV();
    if (kv) {
      try {
        await kv.set(SUMMARY_CACHE_KEY, built, { ex: SUMMARY_CACHE_TTL_SECONDS });
      } catch (err) {
        console.warn('[firm-outreach] summary cache write failed:', err);
      }
    }
  }
  return built;
}

export async function invalidateOutreachSummaryCache(): Promise<void> {
  if (skipKVInPrerender()) return;
  const kv = getKV();
  if (!kv) return;
  try {
    await kv.del(SUMMARY_CACHE_KEY);
  } catch (err) {
    console.warn('[firm-outreach] summary cache invalidate failed:', err);
  }
}

export async function buildReadyProspectsView(
  limit = READY_TO_SEND_LIMIT,
): Promise<OutreachQueueRow[]> {
  const readyIds = await listProspectIdsByStatus('ready_to_send').then((ids) =>
    ids.slice(0, limit),
  );
  const readyProspectsMap = await getProspectsByIds(readyIds);
  const readyProspects = sortProspectsForSend([...readyProspectsMap.values()]);
  return queueRowsForProspects(readyProspects);
}

export async function buildExcludedProspectsView(
  limit = EXCLUDED_PROSPECTS_LIMIT,
): Promise<OutreachExcludedRow[]> {
  const excludedIds = await listProspectIdsByStatus('excluded').then((ids) =>
    ids.slice(0, limit),
  );
  const excludedProspectsMap = await getProspectsByIds(excludedIds);
  const excludedProspects = [...excludedProspectsMap.values()].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  return excludedRowsForProspects(excludedProspects);
}

export async function buildSendsView(
  limit = 100,
  offset = 0,
): Promise<{ sends: OutreachActivityRow[]; total: number }> {
  const allSends = await listAllSends();
  const total = allSends.length;
  const page = allSends.slice(offset, offset + limit);
  const prospectIds = [...new Set(page.map((s) => s.prospectId))];
  const sendEmails = page.map((s) => s.email);
  const [prospectMap, suppressionMap] = await Promise.all([
    getProspectsByIds(prospectIds),
    getSuppressionsByEmails(sendEmails),
  ]);

  const sends: OutreachActivityRow[] = page.map((send) => {
    const prospect = prospectMap.get(send.prospectId);
    const normEmail = send.email.toLowerCase();
    const suppression = suppressionMap.get(normEmail);
    return {
      sendId: send.id,
      prospectId: send.prospectId,
      firmName: send.firmName || prospect?.firmName || '—',
      prospectType: send.prospectType || prospect?.prospectType || 'firm',
      contactName: prospect?.contactName,
      county: prospect?.county,
      email: send.email,
      sequenceStep: send.sequenceStep,
      touchLabel: touchLabel(send.sequenceStep),
      subject: send.subject,
      sendStatus: send.status,
      prospectStatus: prospect?.status ?? 'discovered',
      sentAt: send.sentAt,
      deliveredAt: send.deliveredAt,
      openedAt: send.openedAt,
      waLinkClickedAt: prospect?.waLinkClickedAt,
      joinedWhatsAppAt: prospect?.joinedWhatsAppAt,
      bouncedAt: send.bouncedAt,
      suppressed: Boolean(suppression),
      suppressionReason: suppression?.reason,
    };
  });

  return { sends, total };
}

export async function buildSuppressionsView() {
  return listAllSuppressions();
}

export async function buildOutreachActivityReport(): Promise<OutreachActivityReportResult> {
  const [summaryView, readyToSendProspects, excludedProspects, sendsPage, suppressions] =
    await Promise.all([
      buildOutreachSummaryView(),
      buildReadyProspectsView(),
      buildExcludedProspectsView(),
      buildSendsView(10_000, 0),
      buildSuppressionsView(),
    ]);

  return {
    prospectCounts: summaryView.prospectCounts,
    report: {
      generatedAt: summaryView.generatedAt,
      summary: summaryView.summary,
      sends: sendsPage.sends,
      readyToSendProspects,
      excludedProspects,
      suppressions,
    },
  };
}

/** Back-compat when KV is unavailable — empty report with zero counts. */
export function emptyOutreachActivityReport(): OutreachActivityReportResult {
  const prospectCounts: Record<string, number> = {};
  return {
    prospectCounts,
    report: {
      generatedAt: new Date().toISOString(),
      summary: emptySummary(prospectCounts),
      sends: [],
      readyToSendProspects: [],
      excludedProspects: [],
      suppressions: [],
    },
  };
}

export function activityReportToCsv(report: OutreachActivityReport): string {
  const headers = [
    'firm_name',
    'prospect_type',
    'contact_name',
    'email',
    'county',
    'touch',
    'subject',
    'send_status',
    'prospect_status',
    'sent_at',
    'delivered_at',
    'opened_at',
    'wa_clicked_at',
    'joined_whatsapp_at',
    'bounced_at',
    'suppressed',
    'suppression_reason',
    'prospect_id',
    'send_id',
  ];

  const escape = (v: string | undefined | boolean) => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [headers.join(',')];
  for (const r of report.sends) {
    lines.push(
      [
        r.firmName,
        r.prospectType,
        r.contactName,
        r.email,
        r.county,
        r.touchLabel,
        r.subject,
        r.sendStatus,
        r.prospectStatus,
        r.sentAt,
        r.deliveredAt,
        r.openedAt,
        r.waLinkClickedAt,
        r.joinedWhatsAppAt,
        r.bouncedAt,
        r.suppressed,
        r.suppressionReason,
        r.prospectId,
        r.sendId,
      ]
        .map(escape)
        .join(','),
    );
  }

  return lines.join('\n') + '\n';
}
