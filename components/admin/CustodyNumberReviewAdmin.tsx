'use client';

import { useMemo, useState } from 'react';
import type { CustodyNumberFinding } from '@/lib/custody-discovery/types';
import { NOTIFY_MIN_CONFIDENCE_SCORE } from '@/lib/custody-discovery/confidence';
import { isOfficialSourceType } from '@/lib/custody-discovery/source-type';

type FilterKey =
  | 'all'
  | 'inspect'
  | 'new'
  | 'needs_review'
  | 'high'
  | 'low'
  | 'official'
  | 'conflicts';

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
            <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-[var(--navy)]">
              {r.pageSnippet}
            </p>
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

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['inspect', `Inspect queue (≥${NOTIFY_MIN_CONFIDENCE_SCORE}%)`],
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

      <div className="space-y-4">{filtered.map(card)}</div>
      {filtered.length === 0 && (
        <p className="text-[var(--muted)]">No findings match the current filters.</p>
      )}
    </div>
  );
}
