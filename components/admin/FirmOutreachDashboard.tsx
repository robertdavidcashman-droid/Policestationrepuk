'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type TabId =
  | 'ready'
  | 'all'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'unsubscribed'
  | 'joined'
  | 'followup'
  | 'excluded'
  | 'suppressions';

interface ActivityRow {
  sendId: string;
  prospectId: string;
  firmName: string;
  prospectType: string;
  contactName?: string;
  county?: string;
  email: string;
  sequenceStep: number;
  touchLabel: string;
  subject: string;
  sendStatus: string;
  prospectStatus: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  waLinkClickedAt?: string;
  joinedWhatsAppAt?: string;
  bouncedAt?: string;
  suppressed: boolean;
  suppressionReason?: string;
}

interface QueueRow {
  prospectId: string;
  firmName: string;
  prospectType: string;
  contactName?: string;
  county?: string;
  email?: string;
  sources: string[];
  priorityScore: number;
  crimeWebsiteVerified?: boolean;
  updatedAt: string;
  suppressed: boolean;
  suppressionReason?: string;
}

interface ExcludedRow {
  prospectId: string;
  firmName: string;
  prospectType: string;
  contactName?: string;
  county?: string;
  email?: string;
  excludedReason?: string;
  sources: string[];
  crimeWebsiteVerified?: boolean;
  updatedAt: string;
  suppressed: boolean;
  suppressionReason?: string;
}

interface ReportPayload {
  generatedAt: string;
  summary: {
    totalSends: number;
    uniqueRecipients: number;
    bySendStatus: Record<string, number>;
    waClicks: number;
    joinedWhatsApp: number;
    bounced: number;
    complained: number;
    unsubscribed: number;
    pendingFollowUp1: number;
    pendingFollowUp2: number;
    readyToSend: number;
    discovered: number;
    noEmail: number;
    excluded: number;
    sentToday: number;
    sentLast7Days: number;
  };
  sends: ActivityRow[];
  readyToSendProspects: QueueRow[];
  excludedProspects: ExcludedRow[];
  suppressions: Array<{ email: string; reason: string; createdAt: string }>;
}

interface OutreachStats {
  paused: boolean;
  sendEnabled: boolean;
  dailyCap: number;
  counts: Record<string, number>;
  report: ReportPayload;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'ready', label: 'Ready to send' },
  { id: 'all', label: 'Send log' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'opened', label: 'Opened' },
  { id: 'clicked', label: 'WA clicked' },
  { id: 'bounced', label: 'Bounced' },
  { id: 'unsubscribed', label: 'Unsubscribed' },
  { id: 'joined', label: 'Joined group' },
  { id: 'followup', label: 'Follow-up queue' },
  { id: 'excluded', label: 'Excluded' },
  { id: 'suppressions', label: 'Suppressions' },
];

function tabLabel(id: TabId, label: string, summary: ReportPayload['summary']): string {
  if (id === 'all') return `${label} (${summary.totalSends})`;
  if (id === 'ready') return `${label} (${summary.readyToSend})`;
  if (id === 'excluded') return `${label} (${summary.excluded})`;
  return label;
}

function fmt(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    sent: 'bg-slate-100 text-slate-700',
    delivered: 'bg-emerald-50 text-emerald-800',
    opened: 'bg-blue-50 text-blue-800',
    clicked: 'bg-teal-50 text-teal-800',
    bounced: 'bg-red-50 text-red-800',
    complained: 'bg-red-100 text-red-900',
    unsubscribed: 'bg-amber-50 text-amber-900',
    joined_whatsapp: 'bg-emerald-100 text-emerald-900',
  };
  return map[status] ?? 'bg-slate-50 text-slate-600';
}

const FETCH_TIMEOUT_MS = 25_000;

export function FirmOutreachDashboard() {
  const [data, setData] = useState<OutreachStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('ready');
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionKind, setActionKind] = useState<
    'restore' | 'send' | 'dry_run' | 'exclude' | 'bulk_send' | 'bulk_exclude' | null
  >(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    fetch('/api/admin/firm-outreach', { signal: controller.signal })
      .then(async (res) => {
        const json = (await res.json()) as OutreachStats & { ok?: boolean; error?: string; warning?: string };
        if (!res.ok) {
          throw new Error(json.error ?? `Failed to load stats (${res.status})`);
        }
        if (json.warning) {
          console.warn('[firm-outreach admin]', json.warning);
        }
        return json;
      })
      .then((json) => setData(json))
      .catch((e) => {
        if (e instanceof Error && e.name === 'AbortError') {
          setError('Report timed out — the server may be busy. Please retry.');
        } else {
          setError(e instanceof Error ? e.message : 'Error loading outreach report');
        }
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        setLoading(false);
      });

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    return load();
  }, [load]);

  const filteredSends = useMemo(() => {
    if (!data?.report.sends) return [];
    const rows = data.report.sends;
    let filtered: ActivityRow[];
    switch (tab) {
      case 'delivered':
        filtered = rows.filter((r) => r.sendStatus === 'delivered' || r.deliveredAt);
        break;
      case 'opened':
        filtered = rows.filter((r) => r.sendStatus === 'opened' || r.openedAt);
        break;
      case 'clicked':
        filtered = rows.filter((r) => r.waLinkClickedAt || r.sendStatus === 'clicked');
        break;
      case 'bounced':
        filtered = rows.filter(
          (r) => r.sendStatus === 'bounced' || r.bouncedAt || r.prospectStatus === 'bounced',
        );
        break;
      case 'unsubscribed':
        filtered = rows.filter(
          (r) => r.prospectStatus === 'unsubscribed' || r.suppressionReason === 'unsubscribe',
        );
        break;
      case 'joined':
        filtered = rows.filter((r) => r.joinedWhatsAppAt || r.prospectStatus === 'joined_whatsapp');
        break;
      case 'followup':
        filtered = rows.filter(
          (r) =>
            r.prospectStatus === 'sent' &&
            !r.waLinkClickedAt &&
            !r.joinedWhatsAppAt &&
            r.sequenceStep < 2,
        );
        break;
      default:
        filtered = rows;
    }
    return [...filtered].sort((a, b) => {
      const ta = a.sentAt ? Date.parse(a.sentAt) : 0;
      const tb = b.sentAt ? Date.parse(b.sentAt) : 0;
      return tb - ta;
    });
  }, [data, tab]);

  const recentSends = useMemo(() => {
    if (!data?.report.sends?.length) return [];
    return [...data.report.sends]
      .sort((a, b) => {
        const ta = a.sentAt ? Date.parse(a.sentAt) : 0;
        const tb = b.sentAt ? Date.parse(b.sentAt) : 0;
        return tb - ta;
      })
      .slice(0, 8);
  }, [data]);

  const readyRows = data?.report.readyToSendProspects ?? [];
  const sendableReadyIds = useMemo(
    () => readyRows.filter((r) => r.email && !r.suppressed).map((r) => r.prospectId),
    [readyRows],
  );

  async function markJoined(prospectId: string) {
    setMarkingId(prospectId);
    try {
      const res = await fetch('/api/admin/firm-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_joined', prospectId }),
      });
      if (!res.ok) throw new Error('Failed to mark joined');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setMarkingId(null);
    }
  }

  async function restoreExcluded(prospectId: string) {
    setActionId(prospectId);
    setActionKind('restore');
    try {
      const res = await fetch('/api/admin/firm-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore_excluded',
          prospectId,
          addManualSource: true,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to restore prospect');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setActionId(null);
      setActionKind(null);
    }
  }

  async function excludeFromQueue(prospectId: string) {
    if (!window.confirm('Exclude this prospect from outreach?')) return;

    setActionId(prospectId);
    setActionKind('exclude');
    try {
      const res = await fetch('/api/admin/firm-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'exclude_prospect', prospectId }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to exclude prospect');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setActionId(null);
      setActionKind(null);
    }
  }

  async function manualSend(prospectId: string, dryRun: boolean) {
    if (
      !dryRun &&
      !window.confirm('Send outreach email to this prospect now? This bypasses the daily cap.')
    ) {
      return;
    }

    setActionId(prospectId);
    setActionKind(dryRun ? 'dry_run' : 'send');
    try {
      const res = await fetch('/api/admin/firm-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'manual_send', prospectId, dryRun }),
      });
      const json = (await res.json()) as { error?: string; send?: { subject?: string } };
      if (!res.ok) throw new Error(json.error ?? 'Failed to send');
      if (dryRun && json.send?.subject) {
        window.alert(`Dry run OK — would send: ${json.send.subject}`);
      }
      if (!dryRun) load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setActionId(null);
      setActionKind(null);
    }
  }

  function toggleSelect(prospectId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(prospectId)) next.delete(prospectId);
      else next.add(prospectId);
      return next;
    });
  }

  function toggleSelectAllSendable() {
    const allSelected = sendableReadyIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sendableReadyIds));
    }
  }

  async function bulkSend(prospectIds: string[], dryRun: boolean) {
    if (prospectIds.length === 0) return;

    const sample = readyRows
      .filter((r) => prospectIds.includes(r.prospectId))
      .slice(0, 5)
      .map((r) => r.email)
      .filter(Boolean)
      .join(', ');

    if (
      !dryRun &&
      !window.confirm(
        `Send outreach to ${prospectIds.length} firm(s)?${sample ? `\n\nIncludes: ${sample}${prospectIds.length > 5 ? '…' : ''}` : ''}\n\nRespects daily cap.`,
      )
    ) {
      return;
    }

    setBulkBusy(true);
    setActionKind(dryRun ? 'dry_run' : 'bulk_send');
    try {
      const res = await fetch('/api/admin/firm-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_send',
          prospectIds,
          dryRun,
          respectDailyCap: true,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        bulk?: { sent: number; skipped: number; errors: number };
      };
      if (!res.ok) throw new Error(json.error ?? 'Bulk send failed');
      if (dryRun) {
        window.alert(`Dry run OK — would send to ${json.bulk?.sent ?? 0} prospect(s).`);
      } else {
        setSelectedIds(new Set());
        load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBulkBusy(false);
      setActionKind(null);
    }
  }

  async function bulkExclude(prospectIds: string[]) {
    if (prospectIds.length === 0) return;
    if (!window.confirm(`Exclude ${prospectIds.length} prospect(s) from outreach?`)) return;

    setBulkBusy(true);
    setActionKind('bulk_exclude');
    try {
      const res = await fetch('/api/admin/firm-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_exclude', prospectIds }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Bulk exclude failed');
      setSelectedIds(new Set());
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBulkBusy(false);
      setActionKind(null);
    }
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-700">{error}</p>
        <button type="button" onClick={load} className="btn-outline !text-sm">
          Retry
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return <p className="text-sm text-[var(--muted)]">Loading outreach report…</p>;
  }

  const s = data.report.summary;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--muted)]">
          Report generated {fmt(data.report.generatedAt)}
        </p>
        <a
          href="/api/admin/firm-outreach?format=csv"
          className="btn-outline !text-sm no-underline"
          download
        >
          Download CSV
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Emails sent" value={s.totalSends} />
        <StatCard label="Sent today" value={s.sentToday ?? 0} />
        <StatCard label="Sent (7 days)" value={s.sentLast7Days ?? 0} />
        <StatCard label="Unique recipients" value={s.uniqueRecipients} />
        <StatCard label="Delivered" value={s.bySendStatus.delivered ?? 0} />
        <StatCard label="Opened" value={s.bySendStatus.opened ?? 0} />
        <StatCard label="WA link clicked" value={s.waClicks} />
        <StatCard label="Joined group" value={s.joinedWhatsApp} />
        <StatCard label="Bounced" value={s.bounced} />
        <StatCard label="Unsubscribed" value={s.unsubscribed} />
        <StatCard label="Follow-up due (7d)" value={s.pendingFollowUp1} />
        <StatCard label="Follow-up due (21d)" value={s.pendingFollowUp2} />
        <StatCard label="Ready to send" value={s.readyToSend} />
        <StatCard
          label="Discovered (pending enrich)"
          value={s.discovered}
          hint="No email yet — nightly enrich promotes qualified firms"
        />
        <StatCard label="No email (3 tries)" value={s.noEmail} />
        <StatCard label="Excluded" value={s.excluded} />
        <StatCard
          label="Daily cap"
          value={data.dailyCap}
          hint={data.paused ? 'PAUSED' : data.sendEnabled ? 'Auto' : 'Sends off'}
        />
      </div>

      {recentSends.length > 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
            <h2 className="text-sm font-bold text-[var(--navy)]">Recent sends</h2>
            <button
              type="button"
              onClick={() => setTab('all')}
              className="text-xs font-semibold text-[var(--gold-link)] hover:underline"
            >
              View full send log
            </button>
          </div>
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {recentSends.map((r) => (
              <li key={r.sendId} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-sm">
                <span className="font-semibold text-[var(--navy)]">{r.firmName}</span>
                <span className="font-mono text-xs text-[var(--muted)]">{r.email}</span>
                <span className="text-xs text-[var(--muted)] truncate max-w-md" title={r.subject}>
                  {r.subject}
                </span>
                <span className="text-xs whitespace-nowrap text-[var(--muted)]">{fmt(r.sentAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <nav className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              tab === t.id
                ? 'bg-[var(--navy)] text-white'
                : 'bg-white text-[var(--navy)] border border-[var(--border)] hover:border-[var(--gold)]'
            }`}
          >
            {tabLabel(t.id, t.label, s)}
          </button>
        ))}
      </nav>

      {tab === 'all' ? (
        <p className="text-xs text-[var(--muted)]">
          Export includes firm, email, subject, sent_at, and delivery events (Download CSV above).
        </p>
      ) : null}

      {tab === 'suppressions' ? (
        <ActivityTable
          title="Suppression list (unsubscribe, bounce, complaint, joined)"
          rows={data.report.suppressions.map((x) => ({
            key: x.email,
            cells: [
              x.email,
              x.reason,
              fmt(x.createdAt),
            ],
          }))}
          headers={['Email', 'Reason', 'Since']}
          empty="No suppressions recorded."
        />
      ) : tab === 'ready' ? (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white shadow-sm">
          <div className="border-b border-[var(--border)] px-4 py-3 space-y-3">
            <h2 className="text-sm font-bold text-[var(--navy)]">
              Ready to send ({data.report.readyToSendProspects?.length ?? 0}
              {s.readyToSend > (data.report.readyToSendProspects?.length ?? 0)
                ? ` of ${s.readyToSend} total`
                : ''}
              )
            </h2>
            <p className="text-xs text-[var(--muted)]">
              {selectedIds.size} selected · {sendableReadyIds.length} sendable · daily cap{' '}
              {data.dailyCap} · sent today {s.sentToday ?? 0}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={bulkBusy || sendableReadyIds.length === 0}
                onClick={() => bulkSend(sendableReadyIds, false)}
                className="btn-primary !text-xs !py-1.5 !px-3 disabled:opacity-50"
              >
                {bulkBusy && actionKind === 'bulk_send'
                  ? 'Sending…'
                  : `Send to all (${sendableReadyIds.length})`}
              </button>
              <button
                type="button"
                disabled={bulkBusy || selectedIds.size === 0}
                onClick={() => bulkSend([...selectedIds], false)}
                className="btn-outline !text-xs !py-1.5 !px-3 disabled:opacity-50"
              >
                Send to selected ({selectedIds.size})
              </button>
              <button
                type="button"
                disabled={bulkBusy || selectedIds.size === 0}
                onClick={() => bulkExclude([...selectedIds])}
                className="btn-outline !text-xs !py-1.5 !px-3 !text-red-700 disabled:opacity-50"
              >
                Exclude selected ({selectedIds.size})
              </button>
              <button
                type="button"
                disabled={bulkBusy || sendableReadyIds.length === 0}
                onClick={() => bulkSend(sendableReadyIds, true)}
                className="btn-outline !text-xs !py-1.5 !px-3 disabled:opacity-50"
              >
                Dry run all
              </button>
            </div>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-slate-50 text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all sendable"
                    checked={
                      sendableReadyIds.length > 0 &&
                      sendableReadyIds.every((id) => selectedIds.has(id))
                    }
                    onChange={toggleSelectAllSendable}
                    disabled={sendableReadyIds.length === 0}
                  />
                </th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Firm / contact</th>
                <th className="px-4 py-3">Sources</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {readyRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">
                    No firms queued for outreach yet. Check the Excluded tab or run enrichment.
                  </td>
                </tr>
              ) : (
                readyRows.map((r) => {
                  const busy = actionId === r.prospectId || bulkBusy;
                  const canSend = Boolean(r.email) && !r.suppressed;
                  return (
                    <tr key={r.prospectId} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${r.firmName}`}
                          checked={selectedIds.has(r.prospectId)}
                          onChange={() => toggleSelect(r.prospectId)}
                          disabled={!canSend}
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-[var(--navy)]">
                        {r.email ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[var(--navy)]">{r.firmName}</p>
                        {r.contactName ? (
                          <p className="text-xs text-[var(--muted)]">{r.contactName}</p>
                        ) : null}
                        {r.county ? (
                          <p className="text-xs text-[var(--muted)]">{r.county}</p>
                        ) : null}
                        {r.crimeWebsiteVerified ? (
                          <p className="text-xs text-emerald-700">Crime website verified</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs">{r.sources.join(', ')}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{r.priorityScore}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{fmt(r.updatedAt)}</td>
                      <td className="px-4 py-3 space-y-1">
                        {canSend ? (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => manualSend(r.prospectId, false)}
                              className="block text-xs font-semibold text-[var(--gold-link)] hover:underline disabled:opacity-50"
                            >
                              {busy && actionKind === 'send' ? 'Sending…' : 'Send now'}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => manualSend(r.prospectId, true)}
                              className="block text-xs text-[var(--muted)] hover:underline disabled:opacity-50"
                            >
                              {busy && actionKind === 'dry_run' ? 'Checking…' : 'Dry run'}
                            </button>
                          </>
                        ) : (
                          <p className="text-xs text-[var(--muted)]">
                            {!r.email ? 'No email' : 'Send blocked (suppressed)'}
                          </p>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => excludeFromQueue(r.prospectId)}
                          className="block text-xs text-red-700 hover:underline disabled:opacity-50"
                        >
                          {busy && actionKind === 'exclude' ? 'Excluding…' : 'Exclude'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : tab === 'excluded' ? (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white shadow-sm">
          <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-bold text-[var(--navy)]">
            Excluded prospects ({data.report.excludedProspects?.length ?? 0}
            {s.excluded > (data.report.excludedProspects?.length ?? 0)
              ? ` of ${s.excluded} total`
              : ''}
            )
          </h2>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-slate-50 text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Firm / contact</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Excluded reason</th>
                <th className="px-4 py-3">Sources</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(data.report.excludedProspects ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">
                    No excluded prospects in this view.
                  </td>
                </tr>
              ) : (
                (data.report.excludedProspects ?? []).map((r) => {
                  const busy = actionId === r.prospectId;
                  const canSend = Boolean(r.email) && !r.suppressed;
                  return (
                    <tr key={r.prospectId} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[var(--navy)]">{r.firmName}</p>
                        {r.contactName ? (
                          <p className="text-xs text-[var(--muted)]">{r.contactName}</p>
                        ) : null}
                        {r.county ? (
                          <p className="text-xs text-[var(--muted)]">{r.county}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{r.email ?? '—'}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-900">
                          {r.excludedReason ?? 'excluded'}
                        </span>
                        {r.suppressed ? (
                          <p className="mt-1 text-xs text-red-700">
                            suppressed ({r.suppressionReason})
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs">{r.sources.join(', ')}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{fmt(r.updatedAt)}</td>
                      <td className="px-4 py-3 space-y-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => restoreExcluded(r.prospectId)}
                          className="block text-xs font-semibold text-[var(--gold-link)] hover:underline disabled:opacity-50"
                        >
                          {busy && actionKind === 'restore' ? 'Restoring…' : 'Restore to queue'}
                        </button>
                        {canSend ? (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => manualSend(r.prospectId, false)}
                              className="block text-xs font-semibold text-[var(--gold-link)] hover:underline disabled:opacity-50"
                            >
                              {busy && actionKind === 'send' ? 'Sending…' : 'Send now'}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => manualSend(r.prospectId, true)}
                              className="block text-xs text-[var(--muted)] hover:underline disabled:opacity-50"
                            >
                              {busy && actionKind === 'dry_run' ? 'Checking…' : 'Dry run'}
                            </button>
                          </>
                        ) : (
                          <p className="text-xs text-[var(--muted)]">
                            {!r.email ? 'No email' : 'Send blocked (suppressed)'}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-slate-50 text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Firm / contact</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Touch</th>
                <th className="px-4 py-3">Send status</th>
                <th className="px-4 py-3">Sent at</th>
                <th className="hidden md:table-cell px-4 py-3">Delivered</th>
                <th className="hidden md:table-cell px-4 py-3">Opened</th>
                <th className="hidden lg:table-cell px-4 py-3">WA click</th>
                <th className="hidden lg:table-cell px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredSends.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-[var(--muted)]">
                    {tab === 'all'
                      ? 'No outreach emails sent yet. Use Ready to send or wait for the daily cron.'
                      : 'No records in this view yet.'}
                  </td>
                </tr>
              ) : (
                filteredSends.map((r) => (
                  <tr key={r.sendId} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[var(--navy)]">{r.firmName}</p>
                      {r.contactName ? (
                        <p className="text-xs text-[var(--muted)]">{r.contactName}</p>
                      ) : null}
                      {r.county ? (
                        <p className="text-xs text-[var(--muted)]">{r.county}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{r.email}</td>
                    <td className="px-4 py-3 text-xs max-w-xs truncate" title={r.subject}>
                      {r.subject}
                    </td>
                    <td className="px-4 py-3 text-xs">{r.touchLabel}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(r.sendStatus)}`}
                      >
                        {r.sendStatus}
                      </span>
                      {r.suppressed ? (
                        <p className="mt-1 text-xs text-amber-700">suppressed ({r.suppressionReason})</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">{fmt(r.sentAt)}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-xs whitespace-nowrap">
                      {fmt(r.deliveredAt)}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-xs whitespace-nowrap">
                      {fmt(r.openedAt)}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-xs whitespace-nowrap">
                      {fmt(r.waLinkClickedAt)}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-xs whitespace-nowrap">
                      {fmt(r.joinedWhatsAppAt)}
                    </td>
                    <td className="px-4 py-3">
                      {!r.joinedWhatsAppAt ? (
                        <button
                          type="button"
                          disabled={markingId === r.prospectId}
                          onClick={() => markJoined(r.prospectId)}
                          className="text-xs font-semibold text-[var(--gold-link)] hover:underline disabled:opacity-50"
                        >
                          {markingId === r.prospectId ? 'Saving…' : 'Mark joined'}
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-700">✓</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[var(--navy)]">Pipeline queue</h2>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(data.counts).map(([status, count]) => (
            <div key={status} className="flex justify-between text-sm">
              <dt className="text-[var(--muted)]">{status}</dt>
              <dd className="font-semibold text-[var(--navy)]">{count}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-[var(--navy)]">{value}</p>
      {hint ? <p className="mt-0.5 text-xs font-semibold text-[var(--gold)]">{hint}</p> : null}
    </div>
  );
}

function ActivityTable({
  title,
  headers,
  rows,
  empty,
}: {
  title: string;
  headers: string[];
  rows: { key: string; cells: string[] }[];
  empty: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white shadow-sm">
      <h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-bold text-[var(--navy)]">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-sm text-[var(--muted)]">{empty}</p>
      ) : (
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-slate-50 text-xs uppercase text-[var(--muted)]">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.map((r) => (
              <tr key={r.key}>
                {r.cells.map((c, i) => (
                  <td key={i} className="px-4 py-2 text-sm">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
