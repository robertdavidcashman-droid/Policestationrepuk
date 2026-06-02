import type { PoliceStation } from '@/lib/types';

export function StationVerificationBadge({ station }: { station: PoliceStation }) {
  const meta = station.verificationMeta;
  if (!meta) return null;

  const custody = meta.fields?.custodyPhone;
  const phone = meta.fields?.phone;
  const contribution = meta.custodyContribution;

  return (
    <div className="mt-3 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-[var(--muted)]">
      <p className="font-semibold text-[var(--navy)]">Data verification</p>
      {contribution?.status === 'verified' && (
        <p>
          Custody number confirmed by {contribution.confirmedBy}{' '}
          {contribution.confirmedBy === 1 ? 'rep' : 'reps'}
          {contribution.dateVerified ? ` · last confirmed ${contribution.dateVerified}` : ''}.
        </p>
      )}
      {contribution?.status === 'unverified' && (
        <p className="text-amber-700">
          Custody number unverified — submitted by a rep, not yet confirmed. Please double-check
          before relying on it.
        </p>
      )}
      {meta.dateVerified && (
        <p>
          Last checked: {meta.dateVerified}
          {meta.verificationStatus === 'unverified' ? ' (unverified)' : ''}
        </p>
      )}
      {meta.sourceUrl && (
        <p>
          Source:{' '}
          <a
            href={meta.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--gold-link)] no-underline hover:underline"
          >
            official listing
          </a>
        </p>
      )}
      {custody?.status === 'not_publicly_listed' && (
        <p>Custody desk number: not publicly listed by the force.</p>
      )}
      {phone?.status === 'unverified' && <p>Main line: unverified — use Report correction if you have an update.</p>}
    </div>
  );
}
