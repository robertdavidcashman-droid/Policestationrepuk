'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CustodyNumberFinding } from '@/lib/custody-discovery/types';
import { NOTIFY_MIN_CONFIDENCE_SCORE } from '@/lib/custody-discovery/confidence';
import { isOfficialSourceType } from '@/lib/custody-discovery/source-type';
import {
  AdminWideTable,
  adminBadgeClass,
} from '@/components/admin/AdminWideTable';

type FilterKey =
  | 'all'
  | 'inspect'
  | 'new'
  | 'needs_review'
  | 'high'
  | 'low'
  | 'official'
  | 'conflicts'
  | 'awaiting_ai'
  | 'ai_reviewed'
  | 'needs_human';

export function CustodyNumberReviewAdmin({
  initialFindings,
  suiteMeta,
  approvedMeta,
  batchId,
  batchFindingIds,
  accessError,
}: {
  initialFindings: CustodyNumberFinding[];
  suiteMeta: Record<string, { county: string; forceName: string }>;
  approvedMeta: Record<string, { verificationStatus: 'verified' | 'unverified'; phoneNumber: string }>;
  batchId?: string;
  batchFindingIds?: string[];
  accessError?: string;
}) {
  const [rows, setRows] = useState(initialFindings);
  const [published, setPublished] = useState(approvedMeta);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(accessError ? decodeURIComponent(accessError) : null);
  const [showBatchOnly, setShowBatchOnly] = useState(Boolean(batchFindingIds?.length));
  const [filter, setFilter] = useState<FilterKey>(batchFindingIds?.length ? 'all' : 'inspect');
  const [forceFilter, setForceFilter] = useState('');
  const [countyFilter, setCountyFilter] = useState('');
  const [suiteFilter, setSuiteFilter] = useState('');
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [markVerifiedDraft, setMarkVerifiedDraft] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const r of initialFindings) {
      init[r.id] = r.confidenceLevel === 'high';
    }
    return init;
  });

  const forces = useMemo(
    () => [...new Set(rows.map((r) => r.forceName))].sort(),
    [rows],
  );
  const counties = useMemo(
    () => [...new Set(rows.map((r) => suiteMeta[r.custodySuiteId]?.county || ''))].filter(Boolean).sort(),
    [rows, suiteMeta],
  );

  const batchSet = useMemo(
    () => new Set(batchFindingIds ?? []),
    [batchFindingIds],
  );

  const awaitingAiCount = useMemo(
    () =>
      rows.filter(
        (r) =>
          (r.status === 'needs_review' || r.status === 'new') && !r.aiReview?.reviewedAt,
      ).length,
    [rows],
  );

  const filtered = rows.filter((r) => {
    if (showBatchOnly && batchSet.size > 0 && !batchSet.has(r.id)) return false;
    if (
      filter === 'inspect' &&
      (r.status === 'approved' ||
        r.status === 'rejected' ||
        r.status === 'stale' ||
        r.confidenceScore < NOTIFY_MIN_CONFIDENCE_SCORE)
    ) {
      return false;
    }
    if (filter === 'new' && r.status !== 'new') return false;
    if (filter === 'needs_review' && r.status !== 'needs_review' && r.status !== 'new') return false;
    if (filter === 'high' && r.confidenceLevel !== 'high') return false;
    if (filter === 'low' && r.confidenceLevel !== 'low' && r.confidenceLevel !== 'reject') return false;
    if (filter === 'official' && !isOfficialSourceType(r.sourceType)) return false;
    if (filter === 'conflicts' && !r.conflictReason) return false;
    if (filter === 'awaiting_ai' && (r.aiReview?.reviewedAt || (r.status !== 'needs_review' && r.status !== 'new'))) {
      return false;
    }
    if (filter === 'ai_reviewed' && !r.aiReview?.reviewedAt) return false;
    if (filter === 'needs_human') {
      if (!r.aiReview?.reviewedAt) return false;
      if (r.status !== 'needs_review' && r.status !== 'new') return false;
      const weakEvidence = r.aiReview.evidence.source !== 'page_fetch';
      const needsHuman =
        r.aiReview.recommendation === 'hold' ||
        r.aiReview.recommendation === 'approve' ||
        Boolean(r.conflictReason) ||
        weakEvidence;
      if (!needsHuman) return false;
    }
    if (forceFilter && r.forceName !== forceFilter) return false;
    if (countyFilter && (suiteMeta[r.custodySuiteId]?.county || '') !== countyFilter) return false;
    if (suiteFilter && !r.custodySuiteName.toLowerCase().includes(suiteFilter.toLowerCase())) return false;
    return true;
  });

  async function act(
    action: 'approve' | 'reject' | 'stale' | 'mark_verified',
    findingId: string,
  ) {
    setBusy(`${action}-${findingId}`);
    setError(null);
    try {
      const row = rows.find((r) => r.id === findingId);
      const res = await fetch('/api/admin/custody-number-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          findingId,
          notes: notesDraft[findingId] || undefined,
          markVerified: action === 'approve' ? markVerifiedDraft[findingId] : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      if (action === 'approve' && data.approved && row) {
        setPublished((prev) => ({
          ...prev,
          [row.custodySuiteId]: {
            verificationStatus: data.approved.verificationStatus,
            phoneNumber: data.approved.phoneNumber,
          },
        }));
      }
      if (action === 'mark_verified' && data.approved && row) {
        setPublished((prev) => ({
          ...prev,
          [row.custodySuiteId]: {
            verificationStatus: 'verified',
            phoneNumber: data.approved.phoneNumber,
          },
        }));
      }
      if (action === 'reject' && row) {
        setPublished((prev) => {
          const next = { ...prev };
          delete next[row.custodySuiteId];
          return next;
        });
      }

      setRows((prev) =>
        prev.map((r) =>
          r.id === findingId ? (data.finding as CustodyNumberFinding) : r,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(null);
    }
  }

  async function runAiBatch(force = false) {
    setBusy('ai-batch');
    setError(null);
    try {
      const res = await fetch('/api/admin/custody-number-review/ai-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'batch', limit: 25, force }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI batch failed');
      const refresh = await fetch('/api/admin/custody-number-review');
      const refreshData = await refresh.json();
      if (refreshData.findings) setRows(refreshData.findings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI batch failed');
    } finally {
      setBusy(null);
    }
  }

  async function rerunAi(findingId: string) {
    setBusy(`ai-${findingId}`);
    setError(null);
    try {
      const res = await fetch('/api/admin/custody-number-review/ai-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'single', findingId, force: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI review failed');
      if (data.result?.finding) {
        setRows((prev) =>
          prev.map((r) => (r.id === findingId ? data.result.finding : r)),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI review failed');
    } finally {
      setBusy(null);
    }
  }

  function renderEvidenceQuote(quote: string) {
    const parts = quote.split(/\*\*/);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} className="font-bold text-[var(--navy)]">
          {part}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  }

  function aiBadge(r: CustodyNumberFinding) {
    const ai = r.aiReview;
    if (!ai) return null;
    const colors =
      ai.recommendation === 'approve'
        ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
        : ai.recommendation === 'reject'
          ? 'bg-red-100 text-red-900 border-red-200'
          : 'bg-amber-100 text-amber-900 border-amber-200';
    return (
      <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${colors}`}>
        AI {ai.recommendation} · {ai.aiConfidence}%
      </span>
    );
  }

  function evidencePanel(r: CustodyNumberFinding) {
    const ai = r.aiReview;
    if (!ai) {
      return (
        <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Awaiting AI review — run batch review or wait for the next cron pass.
        </p>
      );
    }
    const why =
      ai.recommendation === 'approve'
        ? ai.whyPublish
        : ai.whyNot || ai.whyPublish;
    return (
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Evidence</p>
        <p className="mt-1 text-sm font-semibold text-[var(--navy)]">
          Section: {ai.evidence.section}
          {ai.evidence.source !== 'page_fetch' && (
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">
              {ai.evidence.source === 'pdf_unfetched' ? 'PDF not fetched' : 'Search snippet only'}
            </span>
          )}
        </p>
        <blockquote className="mt-2 border-l-4 border-slate-300 pl-3 text-sm leading-relaxed text-slate-800">
          {renderEvidenceQuote(ai.evidence.quote)}
        </blockquote>
        {why && (
          <p className="mt-3 text-sm text-[var(--navy)]">
            <strong>{ai.recommendation === 'approve' ? 'Why publish:' : 'Why not:'}</strong>{' '}
            {why}
          </p>
        )}
        {r.autoPublishedAt && (
          <p className="mt-2 text-xs font-semibold text-emerald-800">Auto-published by AI reviewer</p>
        )}
        {r.autoRejectedAt && (
          <p className="mt-2 text-xs font-semibold text-red-800">Auto-rejected by AI reviewer</p>
        )}
      </div>
    );
  }

  function card(r: CustodyNumberFinding) {
    const county = suiteMeta[r.custodySuiteId]?.county || '—';
    const pub = published[r.custodySuiteId];
    const isPublished = r.status === 'approved' && pub;
    return (
      <div
        key={r.id}
        className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[var(--navy)]">{r.custodySuiteName}</p>
            <p className="text-xs text-[var(--muted)]">
              {r.forceName} · {county} · {r.status} · score {r.confidenceScore} ({r.confidenceLevel})
            </p>
            <div className="mt-1">{aiBadge(r)}</div>
            <p className="mt-2 font-mono text-lg text-[var(--navy)]">{r.possiblePhoneNumber}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Classification: <strong>{r.classification}</strong> · Source: {r.sourceType}
              {r.conflictReason ? ` · ${r.conflictReason}` : ''}
            </p>
            <p className="mt-2 text-sm">
              <a
                href={r.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--gold-link)] hover:underline"
              >
                {r.sourceTitle || r.sourceUrl}
              </a>
            </p>
            <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-[var(--navy)] md:hidden">
              {r.pageSnippet}
            </p>
            {evidencePanel(r)}
            <p className="mt-2 text-xs text-[var(--muted)]">
              Found {new Date(r.dateFound).toLocaleString('en-GB')} · Last checked{' '}
              {new Date(r.lastChecked).toLocaleString('en-GB')}
            </p>
            <textarea
              className="mt-3 w-full rounded-lg border border-[var(--border)] p-2 text-sm"
              rows={2}
              placeholder="Admin notes"
              value={notesDraft[r.id] ?? r.notes}
              onChange={(e) =>
                setNotesDraft((d) => ({ ...d, [r.id]: e.target.value }))
              }
            />
            {isPublished && (
              <p className="mt-2 text-sm font-semibold text-emerald-800">
                Published in directory as{' '}
                {pub.verificationStatus === 'verified' ? 'verified' : 'unverified'}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {(r.status === 'needs_review' || r.status === 'new') && (
              <button
                type="button"
                onClick={() => rerunAi(r.id)}
                disabled={busy !== null}
                className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-100 disabled:opacity-50"
              >
                {busy === `ai-${r.id}` ? 'AI reviewing…' : r.aiReview ? 'Re-run AI' : 'Run AI review'}
              </button>
            )}
            {r.status !== 'approved' && (
              <>
                <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <input
                    type="checkbox"
                    checked={markVerifiedDraft[r.id] ?? false}
                    onChange={(e) =>
                      setMarkVerifiedDraft((d) => ({ ...d, [r.id]: e.target.checked }))
                    }
                  />
                  Publish as verified
                  {r.confidenceLevel === 'high' ? ' (recommended — high confidence)' : ''}
                </label>
                <button
                  type="button"
                  onClick={() => act('approve', r.id)}
                  disabled={busy !== null}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy === `approve-${r.id}` ? 'Publishing…' : 'Approve & publish'}
                </button>
              </>
            )}
            {isPublished && pub.verificationStatus === 'unverified' && (
              <button
                type="button"
                onClick={() => act('mark_verified', r.id)}
                disabled={busy !== null}
                className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {busy === `mark_verified-${r.id}` ? 'Updating…' : 'Mark as verified'}
              </button>
            )}
            {r.status !== 'approved' && (
              <button
                type="button"
                onClick={() => act('reject', r.id)}
                disabled={busy !== null}
                className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] hover:border-red-300 hover:text-red-700 disabled:opacity-50"
              >
                {busy === `reject-${r.id}` ? 'Rejecting…' : 'Reject'}
              </button>
            )}
            {r.status === 'approved' && (
              <button
                type="button"
                onClick={() => act('reject', r.id)}
                disabled={busy !== null}
                className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] hover:border-red-300 hover:text-red-700 disabled:opacity-50"
              >
                {busy === `reject-${r.id}` ? 'Revoking…' : 'Revoke & remove from directory'}
              </button>
            )}
            {r.status !== 'approved' && r.status !== 'rejected' && (
              <button
                type="button"
                onClick={() => act('stale', r.id)}
                disabled={busy !== null}
                className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] hover:border-amber-300 hover:text-amber-800 disabled:opacity-50"
              >
                {busy === `stale-${r.id}` ? 'Updating…' : 'Mark stale'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {batchId && batchFindingIds && batchFindingIds.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">
            Batch run — {batchFindingIds.length} new{' '}
            {batchFindingIds.length === 1 ? 'finding' : 'findings'} from the latest crawl
          </p>
          <p className="mt-1 text-emerald-800/90">
            Showing findings from email batch <span className="font-mono text-xs">{batchId}</span>.
            {' '}
            <button
              type="button"
              onClick={() => setShowBatchOnly((v) => !v)}
              className="font-semibold underline"
            >
              {showBatchOnly ? 'Show all findings' : 'Show this batch only'}
            </button>
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => runAiBatch(false)}
          disabled={busy !== null || awaitingAiCount === 0}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {busy === 'ai-batch'
            ? 'Running AI review…'
            : `Run AI review on queue (${awaitingAiCount})`}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['inspect', `Inspect queue (≥${NOTIFY_MIN_CONFIDENCE_SCORE}%)`],
            ['awaiting_ai', 'Awaiting AI'],
            ['needs_human', 'Needs human'],
            ['ai_reviewed', 'AI reviewed'],
            ['needs_review', 'Needs review'],
            ['new', 'New'],
            ['high', 'High confidence'],
            ['low', 'Low confidence'],
            ['official', 'Official sources'],
            ['conflicts', 'Conflicts'],
            ['all', 'All'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              filter === key
                ? 'bg-[var(--navy)] text-white'
                : 'border border-[var(--border)] bg-white text-[var(--navy)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={forceFilter}
          onChange={(e) => setForceFilter(e.target.value)}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        >
          <option value="">All forces</option>
          {forces.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          value={countyFilter}
          onChange={(e) => setCountyFilter(e.target.value)}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        >
          <option value="">All counties</option>
          {counties.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Filter custody suite"
          value={suiteFilter}
          onChange={(e) => setSuiteFilter(e.target.value)}
          className="min-w-[200px] rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        />
      </div>

      <p className="text-sm text-[var(--muted)]">
        Showing {filtered.length} of {rows.length} findings. Approved numbers appear in the directory;
        unverified until you mark them verified (high-confidence findings can be approved as verified).
      </p>

      <div className="hidden lg:block">
        <AdminWideTable
          title="Findings (wide table)"
          columns={[
            {
              id: 'suite',
              header: 'Suite',
              render: (r) => (
                <div>
                  <p className="font-semibold text-[var(--navy)]">{r.custodySuiteName}</p>
                  <p className="text-xs text-[var(--muted)]">{suiteMeta[r.custodySuiteId]?.county || '—'}</p>
                </div>
              ),
            },
            {
              id: 'force',
              header: 'Force',
              render: (r) => r.forceName,
            },
            {
              id: 'number',
              header: 'Number',
              render: (r) => <span className="font-mono text-sm">{r.possiblePhoneNumber}</span>,
            },
            {
              id: 'class',
              header: 'Classification',
              hideBelow: 'lg',
              render: (r) => r.classification,
            },
            {
              id: 'score',
              header: 'Score',
              render: (r) => `${r.confidenceScore} (${r.confidenceLevel})`,
            },
            {
              id: 'source',
              header: 'Source',
              hideBelow: 'lg',
              render: (r) => (
                <a
                  href={r.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--gold-link)] hover:underline"
                >
                  {r.sourceType}
                </a>
              ),
            },
            {
              id: 'ai',
              header: 'AI',
              render: (r) => aiBadge(r) ?? '—',
            },
            {
              id: 'status',
              header: 'Status',
              render: (r) => (
                <span
                  className={adminBadgeClass(
                    r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning',
                  )}
                >
                  {r.status}
                </span>
              ),
            },
            {
              id: 'actions',
              header: 'Actions',
              render: (r) => (
                <div className="flex flex-col gap-1 text-xs">
                  {r.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => act('approve', r.id)}
                      disabled={busy !== null}
                      className="font-semibold text-emerald-700 hover:underline disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => act('reject', r.id)}
                      disabled={busy !== null}
                      className="text-red-700 hover:underline disabled:opacity-50"
                    >
                      Reject
                    </button>
                  )}
                  <Link
                    href={`/admin/station-contacts?force=${encodeURIComponent(r.forceName)}`}
                    className="text-[var(--gold-link)] hover:underline"
                  >
                    Monitor hub
                  </Link>
                </div>
              ),
            },
          ]}
          rows={filtered}
          getRowKey={(r) => r.id}
          emptyMessage="No findings match the current filters."
        />
      </div>

      <div className="space-y-4 lg:hidden">{filtered.map(card)}</div>
      {filtered.length === 0 && (
        <p className="text-[var(--muted)]">No findings match the current filters.</p>
      )}
    </div>
  );
}
