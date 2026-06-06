import type { PoliceStation } from '@/lib/types';
import Link from 'next/link';
import {
  classifyPhone,
  displayPhoneNumber,
  stationPhoneNumbers,
  type PhoneClass,
  type StationPhoneEntry,
} from '@/lib/station-search';
import { stationPhoneEntryHint } from '@/lib/station-phone-labels';
import { phoneToTelHref } from '@/lib/phone';
import { formatPhoneUk } from '@/lib/phone-format';
import {
  DEFAULT_NON_EMERGENCY,
  getOfficialContact,
} from '@/lib/official-force-contacts';
import { getCustodyPhoneDisplay } from '@/lib/custody-discovery/display';
import { isCustodyStation } from '@/lib/custody-station';

function forceNonEmergency(station: PoliceStation): { number: string; hint: string } {
  const raw = getOfficialContact(station.forceName)?.nonEmergency ?? DEFAULT_NON_EMERGENCY;
  const number = formatPhoneUk(raw) || raw;
  const hint =
    station.forceName === 'British Transport Police'
      ? 'BTP non-emergency'
      : number === '101'
        ? 'Call 101 (non-emergency)'
        : 'Force non-emergency';
  return { number, hint };
}

function PhoneValue({
  number,
  link,
  className,
}: {
  number: string;
  link: boolean;
  className?: string;
}) {
  if (link) {
    return (
      <a
        href={phoneToTelHref(number)}
        className={
          className ??
          'font-medium text-[var(--gold-link)] no-underline hover:text-[var(--gold)] hover:underline'
        }
      >
        {number}
      </a>
    );
  }
  return <span className={className ?? 'font-medium text-[var(--gold-link)]'}>{number}</span>;
}

function EntryMeta({ entry }: { entry: StationPhoneEntry }) {
  return (
    <span className="ml-1 text-[10px] text-[var(--muted)]">
      {stationPhoneEntryHint(entry)}
      {!entry.verified && (
        <>
          {' '}
          ·{' '}
          <Link href="/HelpUsStationNumbers" className="font-semibold text-[var(--gold-link)] hover:underline">
            verify
          </Link>
        </>
      )}
    </span>
  );
}

/**
 * Shared phone display used by the directory explorer and station cards so the
 * switchboard / generic / none labelling is identical everywhere.
 */
export function StationPhone({
  station,
  link = false,
  className,
}: {
  station: PoliceStation;
  link?: boolean;
  className?: string;
}) {
  const entries = stationPhoneNumbers(station);
  const wrapperClass = className ?? 'mt-2 text-xs';
  const custodyDisplay = isCustodyStation(station) ? getCustodyPhoneDisplay(station) : null;

  if (
    custodyDisplay?.state === 'fallback_101' &&
    custodyDisplay.message &&
    !entries.some((e) => e.label === 'Custody desk')
  ) {
    return (
      <p className={`text-[10px] text-[var(--muted)] ${wrapperClass}`}>
        {custodyDisplay.message}{' '}
        <PhoneValue number={custodyDisplay.number ?? '101'} link={link} className="text-[10px]" />
      </p>
    );
  }

  if (entries.length > 0) {
    return (
      <div className={wrapperClass}>
        {entries.map((entry) => (
          <div key={`${entry.label}-${entry.number}`}>
            <PhoneValue number={entry.number} link={link} />
            <EntryMeta entry={entry} />
          </div>
        ))}
      </div>
    );
  }

  const cls: PhoneClass = classifyPhone(station);
  const number = displayPhoneNumber(station);
  const { number: neNumber, hint } = forceNonEmergency(station);

  if (cls === 'station' || cls === 'switchboard') {
    return (
      <div className={wrapperClass}>
        <PhoneValue number={number!} link={link} />
        {cls === 'switchboard' && (
          <span className="block text-[10px] text-[var(--muted)]">Force switchboard</span>
        )}
      </div>
    );
  }

  return (
    <p className={`text-[10px] text-[var(--muted)] ${wrapperClass}`}>
      {cls === 'generic' && number ? (
        <>
          <PhoneValue number={number} link={link} className="text-[10px]" />
          <span className="ml-1">· non-emergency</span>
        </>
      ) : (
        <>
          No direct number —{' '}
          <PhoneValue number={neNumber} link={link} className="text-[10px]" />
          <span className="ml-1">({hint})</span>
        </>
      )}
    </p>
  );
}
