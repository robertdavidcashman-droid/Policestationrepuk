import type { PoliceStation } from '@/lib/types';
import Link from 'next/link';
import { isDialablePhone } from '@/lib/station-phone-dialable';
import { getCustodyPublicDisplay, getFieldPublicationMeta } from '@/lib/station-contacts/publish';
import { CUSTODY_NOT_PUBLISHED_TEXT } from '@/lib/station-contacts/types';
import { isCustodyStation } from '@/lib/custody-station';

function confidencePill(confidence: string): string | null {
  if (confidence === 'high') return 'High confidence';
  if (confidence === 'medium') return 'Medium confidence';
  if (confidence === 'low') return 'Low confidence';
  return null;
}

export function StationVerificationBadge({ station }: { station: PoliceStation }) {
  const meta = station.verificationMeta;
  if (!meta) return null;

  const custody = meta.fields?.custodyPhone;
  const phone = meta.fields?.phone;
  const contribution = meta.custodyContribution;
  const discovery = meta.custodyDiscovery;
  const custodyDisplay = isCustodyStation(station) ? getCustodyPublicDisplay(station) : null;
  const mainMeta = getFieldPublicationMeta(station, 'phone');
  const custodyMeta = getFieldPublicationMeta(station, 'custodyPhone');

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
      {discovery?.approvedAt && (
        <p>
          Autonomous discovery approved {discovery.approvedAt.slice(0, 10)}
          {discovery.sourceUrl ? (
            <>
              {' '}
              ·{' '}
              <a
                href={discovery.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--gold-link)] no-underline hover:underline"
              >
                source
              </a>
            </>
          ) : null}
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
          {meta.secondarySourceUrl ? (
            <>
              {' '}
              ·{' '}
              <a
                href={meta.secondarySourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--gold-link)] no-underline hover:underline"
              >
                secondary source
              </a>
            </>
          ) : null}
        </p>
      )}
      {confidencePill(mainMeta.confidence) && (
        <p>
          Main line confidence:{' '}
          <span className="rounded-full bg-slate-200 px-2 py-0.5 font-semibold text-[var(--navy)]">
            {confidencePill(mainMeta.confidence)}
          </span>
        </p>
      )}
      {custodyDisplay && !custodyDisplay.published && (
        <p className="font-semibold text-amber-800">{CUSTODY_NOT_PUBLISHED_TEXT}</p>
      )}
      {custodyDisplay?.published && confidencePill(custodyMeta.confidence) && (
        <p>
          Custody line confidence:{' '}
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-900">
            {confidencePill(custodyMeta.confidence)}
          </span>
        </p>
      )}
      {custody?.status === 'not_publicly_listed' && (
        <p>Custody desk number: not publicly listed by the force.</p>
      )}
      {phone?.status === 'unverified' && isDialablePhone(station.phone) && (
        <p className="text-amber-700">
          Main line is shown as <strong>unverified</strong> — please confirm before relying on it, or{' '}
          <Link href="/HelpUsStationNumbers" className="font-semibold underline">
            report a correction
          </Link>
          .
        </p>
      )}
      {custody?.status === 'unverified' && isDialablePhone(station.custodyPhone) && (
        <p className="text-amber-700">
          Custody desk number is shown as <strong>unverified</strong> —{' '}
          <Link href="/HelpUsStationNumbers" className="font-semibold underline">
            help verify or update it
          </Link>
          .
        </p>
      )}
      {phone?.status === 'unverified' && !isDialablePhone(station.phone) && (
        <p>Main line: unverified — use Report correction if you have an update.</p>
      )}
    </div>
  );
}
