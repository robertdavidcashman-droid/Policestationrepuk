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
import { getCustodyPublicDisplay, getFieldPublicationMeta } from '@/lib/station-contacts/publish';
import {
  CUSTODY_NOT_PUBLISHED_TEXT,
  STATION_CONTACT_DISCLAIMER,
} from '@/lib/station-contacts/types';
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

function confidenceLabel(confidence: string): string | null {
  if (confidence === 'high') return 'High confidence';
  if (confidence === 'medium') return 'Medium confidence';
  if (confidence === 'low') return 'Low confidence';
  return null;
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

function FieldMetaLine({ station, field }: { station: PoliceStation; field: 'phone' | 'custodyPhone' }) {
  const meta = getFieldPublicationMeta(station, field);
  const conf = confidenceLabel(meta.confidence);
  if (!meta.sourceUrl && !meta.lastChecked && !conf) return null;
  return (
    <p className="mt-0.5 text-[10px] text-[var(--muted)]">
      {conf ? <span>{conf}</span> : null}
      {meta.lastChecked ? (
        <>
          {conf ? ' · ' : null}
          Last checked {meta.lastChecked}
        </>
      ) : null}
      {meta.sourceUrl ? (
        <>
          {' · '}
          <a
            href={meta.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--gold-link)] hover:underline"
          >
            source
          </a>
        </>
      ) : null}
    </p>
  );
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

export function StationContactDisclaimer({ className }: { className?: string }) {
  return (
    <p className={`text-[10px] leading-relaxed text-[var(--muted)] ${className ?? ''}`}>
      {STATION_CONTACT_DISCLAIMER}
    </p>
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
  showDisclaimer = false,
}: {
  station: PoliceStation;
  link?: boolean;
  className?: string;
  showDisclaimer?: boolean;
}) {
  const entries = stationPhoneNumbers(station);
  const wrapperClass = className ?? 'mt-2 text-xs';
  const custody = isCustodyStation(station);
  const custodyDisplay = custody ? getCustodyPublicDisplay(station) : null;
  const { number: neNumber, hint } = forceNonEmergency(station);

  const mainEntry = entries.find((e) => e.label === 'Main line' || e.label === 'Station');
  const custodyEntry = entries.find((e) => e.label.startsWith('Custody'));

  if (entries.length > 0 || custody) {
    return (
      <div className={wrapperClass}>
        {mainEntry ? (
          <div>
            <span className="text-[10px] font-semibold uppercase text-[var(--muted)]">Main: </span>
            <PhoneValue number={mainEntry.number} link={link} />
            <EntryMeta entry={mainEntry} />
            <FieldMetaLine station={station} field="phone" />
          </div>
        ) : null}
        {custody ? (
          <div className="mt-1">
            <span className="text-[10px] font-semibold uppercase text-[var(--muted)]">Custody: </span>
            {custodyDisplay?.published && custodyEntry ? (
              <>
                <PhoneValue number={custodyEntry.number} link={link} />
                <EntryMeta entry={custodyEntry} />
                <FieldMetaLine station={station} field="custodyPhone" />
              </>
            ) : (
              <span className="text-[10px] text-amber-800">{CUSTODY_NOT_PUBLISHED_TEXT}</span>
            )}
          </div>
        ) : null}
        {entries
          .filter((e) => e !== mainEntry && e !== custodyEntry)
          .map((entry) => (
            <div key={`${entry.label}-${entry.number}`} className="mt-1">
              <PhoneValue number={entry.number} link={link} />
              <EntryMeta entry={entry} />
            </div>
          ))}
        <div className="mt-1">
          <span className="text-[10px] font-semibold uppercase text-[var(--muted)]">Force: </span>
          <PhoneValue number={neNumber} link={link} className="text-[10px]" />
          <span className="ml-1 text-[10px] text-[var(--muted)]">({hint})</span>
        </div>
        <p className="mt-1 text-[10px] text-[var(--muted)]">
          Emergency: <strong className="text-[var(--navy)]">999</strong>
        </p>
        {showDisclaimer ? <StationContactDisclaimer className="mt-2" /> : null}
      </div>
    );
  }

  if (
    custodyDisplay?.state === 'fallback_101' &&
    custodyDisplay.message &&
    !entries.some((e) => e.label === 'Custody desk')
  ) {
    return (
      <div className={wrapperClass}>
        <p className="text-[10px] text-amber-800">{CUSTODY_NOT_PUBLISHED_TEXT}</p>
        <p className="mt-1 text-[10px] text-[var(--muted)]">
          {custodyDisplay.message}{' '}
          <PhoneValue number={custodyDisplay.number ?? '101'} link={link} className="text-[10px]" />
        </p>
        {showDisclaimer ? <StationContactDisclaimer className="mt-2" /> : null}
      </div>
    );
  }

  const cls: PhoneClass = classifyPhone(station);
  const number = displayPhoneNumber(station);

  if (cls === 'station' || cls === 'switchboard') {
    return (
      <div className={wrapperClass}>
        <PhoneValue number={number!} link={link} />
        {cls === 'switchboard' && (
          <span className="block text-[10px] text-[var(--muted)]">Force switchboard</span>
        )}
        {showDisclaimer ? <StationContactDisclaimer className="mt-2" /> : null}
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <p className="text-[10px] text-[var(--muted)]">
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
      {showDisclaimer ? <StationContactDisclaimer className="mt-2" /> : null}
    </div>
  );
}
