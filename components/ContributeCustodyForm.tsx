'use client';

import { useMemo, useState } from 'react';

export interface ContributeStation {
  id: string;
  name: string;
  forceName: string;
  /** Current custody number on file, if any (for confirm-or-correct). */
  current: string;
}

interface Row {
  key: number;
  label: string;
  number: string;
}

interface SubmitResult {
  stationName?: string;
  ok: boolean;
  status?: 'verified' | 'unverified';
  confirmedBy?: number;
  number?: string;
  error?: string;
}

interface RewardResult {
  eligible: boolean;
  stationCount: number;
  required: number;
  activated: boolean;
  pending: boolean;
  alreadyFeatured: boolean;
  expiresAt?: string;
}

function labelFor(s: ContributeStation): string {
  return s.forceName ? `${s.name} — ${s.forceName}` : s.name;
}

let nextKey = 0;
function blankRow(): Row {
  return { key: nextKey++, label: '', number: '' };
}

export function ContributeCustodyForm({
  stations,
  requiredForReward,
}: {
  stations: ContributeStation[];
  requiredForReward: number;
}) {
  const byLabel = useMemo(() => {
    const m = new Map<string, ContributeStation>();
    for (const s of stations) m.set(labelFor(s), s);
    return m;
  }, [stations]);

  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: requiredForReward }, () => blankRow()),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SubmitResult[] | null>(null);
  const [reward, setReward] = useState<RewardResult | null>(null);

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        // When a station is picked and the number is still blank, prefill the
        // current number so the rep can simply confirm it.
        if (patch.label !== undefined) {
          const station = byLabel.get(patch.label);
          if (station && !next.number) next.number = station.current;
        }
        return next;
      }),
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResults(null);
    setReward(null);

    const submissions = rows
      .map((r) => ({ station: byLabel.get(r.label.trim()), number: r.number.trim() }))
      .filter((r) => r.station && r.number)
      .map((r) => ({ stationId: r.station!.id, number: r.number }));

    if (submissions.length === 0) {
      setError('Pick at least one station from the list and enter its custody number.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/custody-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissions, source: 'contribute_page' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setResults(data.results as SubmitResult[]);
      setReward(data.reward as RewardResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl py-8">
      <datalist id="custody-stations">
        {stations.map((s) => (
          <option key={s.id} value={labelFor(s)} />
        ))}
      </datalist>

      <div className="rounded-xl border border-[var(--border)] bg-slate-50 px-5 py-4 text-sm text-[var(--muted)]">
        <p>
          <strong className="text-[var(--navy)]">How it works:</strong> pick a station, then confirm
          the number shown or correct it. A number goes live as <em>verified</em> once a second rep
          confirms it (or it matches an official line). Contribute{' '}
          <strong>{requiredForReward}</strong> stations to earn a free featured month — it activates
          once your listing is verified.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {rows.map((row, i) => {
          const station = byLabel.get(row.label.trim());
          return (
            <div
              key={row.key}
              className="grid gap-3 rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm sm:grid-cols-[1fr_220px]"
            >
              <div>
                <label className="block text-sm font-semibold text-[var(--navy)]">
                  Station {i + 1}
                </label>
                <input
                  type="text"
                  list="custody-stations"
                  value={row.label}
                  onChange={(e) => updateRow(row.key, { label: e.target.value })}
                  placeholder="Start typing a station name…"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  autoComplete="off"
                />
                {row.label.trim() && !station && (
                  <p className="mt-1 text-xs text-amber-700">
                    Pick a station from the list so we can match it.
                  </p>
                )}
                {station && (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {station.current
                      ? `On file: ${station.current} — confirm or correct it.`
                      : 'No number on file yet — add one.'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--navy)]">
                  Custody desk number
                </label>
                <input
                  type="tel"
                  value={row.number}
                  onChange={(e) => updateRow(row.key, { number: e.target.value })}
                  placeholder="01622 604 185"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  autoComplete="off"
                />
              </div>
            </div>
          );
        })}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, blankRow()])}
            className="btn-outline !text-sm"
          >
            + Add another station
          </button>
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
            {busy ? 'Submitting…' : 'Submit custody numbers'}
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {results && (
        <div className="mt-6 space-y-3">
          <h2 className="text-lg font-bold text-[var(--navy)]">Thanks — here&apos;s what happened</h2>
          {reward && <RewardBanner reward={reward} required={requiredForReward} />}
          <ul className="space-y-2">
            {results.map((r, i) => (
              <li
                key={i}
                className={`rounded-lg border px-4 py-2 text-sm ${
                  r.ok
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
              >
                {r.ok ? (
                  <>
                    <strong>{r.stationName}</strong>: {r.number} —{' '}
                    {r.status === 'verified'
                      ? `verified (confirmed by ${r.confirmedBy})`
                      : 'recorded, awaiting a second confirmation'}
                    .
                  </>
                ) : (
                  <>
                    <strong>{r.stationName ?? 'Station'}</strong>: {r.error}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RewardBanner({ reward, required }: { reward: RewardResult; required: number }) {
  if (reward.alreadyFeatured) {
    return (
      <p className="rounded-lg border border-[var(--border)] bg-slate-50 px-4 py-3 text-sm text-[var(--muted)]">
        You already have a featured listing — thank you for keeping the data fresh!
      </p>
    );
  }
  if (reward.activated) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Your free featured month is now active
        {reward.expiresAt ? ` until ${reward.expiresAt.slice(0, 10)}` : ''}. Thank you!
      </p>
    );
  }
  if (reward.pending) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        You&apos;ve earned a free featured month — it will activate automatically once your rep
        listing is verified.
      </p>
    );
  }
  const remaining = Math.max(0, required - reward.stationCount);
  return (
    <p className="rounded-lg border border-[var(--border)] bg-slate-50 px-4 py-3 text-sm text-[var(--muted)]">
      You&apos;ve contributed {reward.stationCount} of {required} stations needed for a free featured
      month — {remaining} to go.
    </p>
  );
}
