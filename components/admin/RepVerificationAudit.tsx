'use client';

import { useEffect, useMemo, useState } from 'react';

interface RepAuditRow {
  email: string;
  source: 'representative' | 'enquiry' | 'verification';
  name: string;
  phone: string;
  claimedStatus: string;
  pinSupplied: boolean;
  sraSupplied: boolean;
  proofSupplied: boolean;
  addressSupplied: boolean;
  counties: string[];
  countiesCount: number;
  stations: string[];
  stationsCount: number;
  dateRegistered: string | null;
  lastUpdated: string | null;
  ipAddress: string | null;
  publiclyVisible: boolean;
  verificationStatus: string | null;
  verificationStatusLabel: string | null;
  adminApproved: boolean | null;
  isPublic: boolean | null;
  lastVerifiedDate: string | null;
  risk: {
    category: 'low' | 'medium' | 'high' | 'reject' | 'ineligible';
    reasons: string[];
    highRiskFlags: string[];
    mediumRiskFlags: string[];
    lowRiskIndicators: string[];
    shouldHide: boolean;
  };
  duplicateReasons: string[];
  adminNotes: string;
  slug?: string;
}

interface Counts {
  total: number;
  ineligible: number;
  high: number;
  medium: number;
  low: number;
  publiclyVisible: number;
  hiddenPending: number;
  enquiries: number;
  verifications: number;
}

interface AuditResponse {
  counts: Counts;
  rows: RepAuditRow[];
}

const ACTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'approve-psras', label: 'Approve — PSRAS accredited' },
  { value: 'approve-duty-solicitor', label: 'Approve — duty solicitor' },
  { value: 'approve-solicitor', label: 'Approve — solicitor' },
  { value: 'request-evidence', label: 'Request further evidence' },
  { value: 'mark-suspected-fake', label: 'Mark as suspected fake / duplicate' },
  { value: 'mark-ineligible', label: 'Mark ineligible (probationary/trainee)' },
  { value: 'suspend', label: 'Suspend' },
  { value: 'remove', label: 'Remove from public directory' },
  { value: 'mark-needs-reverification', label: 'Mark needs re-verification' },
  { value: 'send-reverification-message', label: 'Send re-verification message' },
];

const RISK_COLOR: Record<RepAuditRow['risk']['category'], string> = {
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-red-100 text-red-800 border-red-200',
  reject: 'bg-red-200 text-red-900 border-red-300',
  ineligible: 'bg-purple-100 text-purple-800 border-purple-200',
};

function fmtDate(value: string | null): string {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export function RepVerificationAudit() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<'all' | RepAuditRow['risk']['category']>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | RepAuditRow['source']>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [query, setQuery] = useState('');
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/rep-audit', { cache: 'no-store' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed: ${res.status}`);
      }
      setData((await res.json()) as AuditResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.rows.filter((r) => {
      if (riskFilter !== 'all' && r.risk.category !== riskFilter) return false;
      if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
      if (visibilityFilter === 'visible' && !r.publiclyVisible) return false;
      if (visibilityFilter === 'hidden' && r.publiclyVisible) return false;
      if (!q) return true;
      const hay = [
        r.name,
        r.email,
        r.phone,
        r.claimedStatus,
        r.counties.join(' '),
        r.stations.join(' '),
        r.adminNotes,
        r.ipAddress || '',
        r.slug || '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data, query, riskFilter, sourceFilter, visibilityFilter]);

  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-h3 text-[var(--navy)]">Rep Verification Audit</h2>
          <p className="text-xs text-[var(--muted)]">
            Every existing rep, enquiry and verification submission scored against the
            PoliceStationRepUK risk rules. High-risk and ineligible rows are hidden from the
            public directory automatically until you act on them.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={reload} disabled={loading} className="btn-outline !text-sm">
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {data && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-9">
          <Stat label="Total" value={data.counts.total} />
          <Stat label="Ineligible" value={data.counts.ineligible} tone="bad" />
          <Stat label="High" value={data.counts.high} tone="bad" />
          <Stat label="Medium" value={data.counts.medium} tone="warn" />
          <Stat label="Low" value={data.counts.low} tone="ok" />
          <Stat label="Public" value={data.counts.publiclyVisible} tone="ok" />
          <Stat label="Hidden pending" value={data.counts.hiddenPending} tone="warn" />
          <Stat label="Enquiries" value={data.counts.enquiries} />
          <Stat label="Verifications" value={data.counts.verifications} />
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          placeholder="Search name, email, phone, station, IP, notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        />
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)}
          className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
        >
          <option value="all">All risk categories</option>
          <option value="ineligible">Ineligible</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
          className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
        >
          <option value="all">All sources</option>
          <option value="representative">Existing rep</option>
          <option value="enquiry">Enquiry only</option>
          <option value="verification">Verification only</option>
        </select>
        <select
          value={visibilityFilter}
          onChange={(e) => setVisibilityFilter(e.target.value as typeof visibilityFilter)}
          className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
        >
          <option value="all">All visibility</option>
          <option value="visible">Publicly visible</option>
          <option value="hidden">Hidden pending review</option>
        </select>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          Loading audit…
        </div>
      )}

      {data && (
        <div className="mt-4 min-w-0 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-[1400px] w-full text-xs">
            <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-2 py-2">Risk</th>
                <th className="px-2 py-2">Name / Email</th>
                <th className="px-2 py-2">Phone</th>
                <th className="px-2 py-2">Claimed status</th>
                <th className="px-2 py-2">PIN</th>
                <th className="px-2 py-2">SRA</th>
                <th className="px-2 py-2">Proof</th>
                <th className="px-2 py-2">Addr</th>
                <th className="px-2 py-2">Counties</th>
                <th className="px-2 py-2">Stations</th>
                <th className="px-2 py-2">Registered</th>
                <th className="px-2 py-2">IP</th>
                <th className="px-2 py-2">Public?</th>
                <th className="px-2 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={`${r.source}:${r.email}`} className="border-b border-slate-100 align-top">
                  <td className="px-2 py-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${RISK_COLOR[r.risk.category]}`}
                    >
                      {r.risk.category}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <div className="font-semibold text-[var(--navy)]">{r.name || '—'}</div>
                    <div className="text-[10px] text-slate-500">{r.email}</div>
                    {r.slug && (
                      <a
                        href={`/rep/${r.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-[var(--gold-link)] underline"
                      >
                        /rep/{r.slug}
                      </a>
                    )}
                  </td>
                  <td className="px-2 py-2">{r.phone || '—'}</td>
                  <td className="px-2 py-2 max-w-[160px]">
                    <div className="break-words">{r.claimedStatus || '—'}</div>
                    {r.verificationStatusLabel && (
                      <div className="mt-0.5 text-[10px] uppercase text-slate-500">
                        {r.verificationStatusLabel}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">{r.pinSupplied ? '✓' : '✗'}</td>
                  <td className="px-2 py-2 text-center">{r.sraSupplied ? '✓' : '✗'}</td>
                  <td className="px-2 py-2 text-center">{r.proofSupplied ? '✓' : '✗'}</td>
                  <td className="px-2 py-2 text-center">{r.addressSupplied ? '✓' : '✗'}</td>
                  <td className="px-2 py-2 text-center">{r.countiesCount}</td>
                  <td className="px-2 py-2 text-center">{r.stationsCount}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{fmtDate(r.dateRegistered)}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-[10px] text-slate-500">
                    {r.ipAddress || '—'}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {r.publiclyVisible ? (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        LIVE
                      </span>
                    ) : (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                        hidden
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      onClick={() => setOpenEmail(r.email)}
                      className="btn-outline !px-2 !py-1 !text-[10px]"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-3 py-6 text-center text-sm text-slate-500">
                    No rows match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {openEmail && (
        <AuditDetailDrawer
          email={openEmail}
          row={data?.rows.find((r) => r.email === openEmail) ?? null}
          onClose={() => setOpenEmail(null)}
          onChanged={() => {
            void reload();
          }}
        />
      )}
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'warn' | 'bad' }) {
  const cls =
    tone === 'bad'
      ? 'border-red-200 bg-red-50'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50'
        : tone === 'ok'
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-slate-200 bg-white';
  return (
    <div className={`rounded-xl border p-2 ${cls}`}>
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-extrabold text-[var(--navy)]">{value}</p>
    </div>
  );
}

function AuditDetailDrawer({
  email,
  row,
  onClose,
  onChanged,
}: {
  email: string;
  row: RepAuditRow | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [action, setAction] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState(row?.adminNotes ?? '');
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runAction(actionId: string) {
    if (!actionId) return;
    setWorking(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/verify-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action: actionId, adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      setMessage(`Saved. New status: ${data.verificationStatus ?? '—'}`);
      onChanged();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setWorking(false);
    }
  }

  async function issueVerificationLink() {
    setWorking(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/verification-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, notifyApplicant: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Token issue failed');
      setMessage(`Verification link issued: ${data.link}`);
      onChanged();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Token issue failed');
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold)]">
              Verification audit
            </p>
            <h3 className="text-base font-bold text-[var(--navy)]">{email}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1 text-sm">
            Close
          </button>
        </div>

        {message && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-sm text-amber-900">
            {message}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 text-sm">
          {!row && <p>Loading…</p>}
          {row && (
            <>
              <section className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Summary
                </h4>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <dt className="text-slate-500">Name</dt>
                  <dd>{row.name || '—'}</dd>
                  <dt className="text-slate-500">Source</dt>
                  <dd className="uppercase">{row.source}</dd>
                  <dt className="text-slate-500">Risk</dt>
                  <dd>
                    <span
                      className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${RISK_COLOR[row.risk.category]}`}
                    >
                      {row.risk.category}
                    </span>
                  </dd>
                  <dt className="text-slate-500">Phone</dt>
                  <dd>{row.phone || '—'}</dd>
                  <dt className="text-slate-500">PIN supplied</dt>
                  <dd>{row.pinSupplied ? 'yes' : 'no'}</dd>
                  <dt className="text-slate-500">SRA supplied</dt>
                  <dd>{row.sraSupplied ? 'yes' : 'no'}</dd>
                  <dt className="text-slate-500">Proof supplied</dt>
                  <dd>{row.proofSupplied ? 'yes' : 'no'}</dd>
                  <dt className="text-slate-500">Address supplied</dt>
                  <dd>{row.addressSupplied ? 'yes' : 'no'}</dd>
                  <dt className="text-slate-500">Counties covered</dt>
                  <dd>{row.counties.join(', ') || '—'}</dd>
                  <dt className="text-slate-500">Stations covered</dt>
                  <dd>{row.stationsCount}</dd>
                  <dt className="text-slate-500">Registered</dt>
                  <dd>{fmtDate(row.dateRegistered)}</dd>
                  <dt className="text-slate-500">IP</dt>
                  <dd>{row.ipAddress || '—'}</dd>
                  <dt className="text-slate-500">Public?</dt>
                  <dd>{row.publiclyVisible ? 'yes' : 'no'}</dd>
                  <dt className="text-slate-500">Verification status</dt>
                  <dd>{row.verificationStatusLabel ?? row.verificationStatus ?? '—'}</dd>
                  <dt className="text-slate-500">Last verified</dt>
                  <dd>{fmtDate(row.lastVerifiedDate)}</dd>
                </dl>
              </section>

              {row.risk.highRiskFlags.length > 0 && (
                <section className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <p className="font-semibold">High-risk flags</p>
                  <ul className="mt-1 list-inside list-disc">
                    {row.risk.highRiskFlags.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </section>
              )}
              {row.risk.mediumRiskFlags.length > 0 && (
                <section className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <p className="font-semibold">Medium-risk flags</p>
                  <ul className="mt-1 list-inside list-disc">
                    {row.risk.mediumRiskFlags.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </section>
              )}
              {row.duplicateReasons.length > 0 && (
                <section className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-3 text-xs text-purple-900">
                  <p className="font-semibold">Duplicate detection</p>
                  <ul className="mt-1 list-inside list-disc">
                    {row.duplicateReasons.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </section>
              )}
              {row.risk.lowRiskIndicators.length > 0 && (
                <section className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                  <p className="font-semibold">Positive signals</p>
                  <ul className="mt-1 list-inside list-disc">
                    {row.risk.lowRiskIndicators.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Admin notes (private)
                </h4>
                <textarea
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                />
              </section>

              <section className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Issue verification link
                </h4>
                <p className="mt-1 text-xs text-slate-600">
                  Sends a private, single-use, 30-day verification link to the applicant&apos;s
                  email and records `verification-link-sent`.
                </p>
                <button
                  onClick={issueVerificationLink}
                  disabled={working}
                  className="btn-gold mt-2 !text-xs"
                >
                  Issue secure verification link
                </button>
              </section>

              <section className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Apply admin action
                </h4>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs sm:min-w-[16rem]"
                  >
                    <option value="">Pick an action…</option>
                    {ACTION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => runAction(action)}
                    disabled={working || !action}
                    className="btn-gold shrink-0 !text-xs"
                  >
                    Apply
                  </button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {ACTION_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => {
                        setAction(o.value);
                        void runAction(o.value);
                      }}
                      disabled={working}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-[11px] font-medium text-[var(--navy)] hover:border-[var(--gold)] disabled:opacity-60"
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-slate-500">
                  Approving sets adminApproved=true, isPublic=true, lastVerifiedDate=now and
                  promotes the profile to the public directory (visibility gate still requires
                  a verified status).
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
