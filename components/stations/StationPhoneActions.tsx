'use client';

import { useCallback, useState } from 'react';
import type { PoliceStation } from '@/lib/types';
import { stationPhoneNumbers } from '@/lib/station-search';
import { phoneToTelHref } from '@/lib/phone';
import { formatPhoneUk } from '@/lib/phone-format';
import {
  DEFAULT_NON_EMERGENCY,
  getOfficialContact,
} from '@/lib/official-force-contacts';
import { getCustodyPublicDisplay } from '@/lib/station-contacts/publish';
import { isCustodyStation } from '@/lib/custody-station';
import { CUSTODY_NOT_PUBLISHED_TEXT } from '@/lib/station-contacts/types';

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

function CopyPhoneButton({ number, className }: { number: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  }, [number]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        className ??
        'inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] transition-colors hover:border-[var(--gold)]/50 hover:bg-[var(--gold-pale)]'
      }
    >
      {copied ? 'Copied!' : 'Copy number'}
    </button>
  );
}

interface PhoneActionRowProps {
  label: string;
  number: string;
  compact?: boolean;
}

function PhoneActionRow({ label, number, compact }: PhoneActionRowProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase text-[var(--muted)]">{label}</span>
        <a
          href={phoneToTelHref(number)}
          className="font-mono text-base font-semibold text-[var(--gold-link)] no-underline hover:underline"
        >
          {number}
        </a>
        <CopyPhoneButton
          number={number}
          className="inline-flex min-h-[36px] items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-[var(--navy)] hover:border-[var(--gold)]/50"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <a
        href={phoneToTelHref(number)}
        className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-[var(--navy)] px-4 py-3 text-base font-semibold text-white no-underline transition-colors hover:bg-[var(--navy-light)]"
      >
        Call {number}
      </a>
      <CopyPhoneButton number={number} className="w-full" />
    </div>
  );
}

export interface StationPhoneActionsProps {
  station: PoliceStation;
  compact?: boolean;
}

export function StationPhoneActions({ station, compact = false }: StationPhoneActionsProps) {
  const entries = stationPhoneNumbers(station);
  const custody = isCustodyStation(station);
  const custodyDisplay = custody ? getCustodyPublicDisplay(station) : null;
  const { number: neNumber, hint } = forceNonEmergency(station);

  const mainEntry = entries.find((e) => e.label === 'Main line' || e.label === 'Station');
  const custodyEntry = entries.find((e) => e.label.startsWith('Custody'));

  const spacing = compact ? 'space-y-2' : 'space-y-4';

  return (
    <div className={spacing}>
      {custody && custodyDisplay?.published && custodyEntry ? (
        <PhoneActionRow label="Custody desk" number={custodyEntry.number} compact={compact} />
      ) : custody ? (
        <p className="text-sm text-amber-800">{CUSTODY_NOT_PUBLISHED_TEXT}</p>
      ) : null}

      {mainEntry ? (
        <PhoneActionRow label="Main line" number={mainEntry.number} compact={compact} />
      ) : null}

      {entries
        .filter((e) => e !== mainEntry && e !== custodyEntry)
        .map((entry) => (
          <PhoneActionRow
            key={`${entry.label}-${entry.number}`}
            label={entry.label}
            number={entry.number}
            compact={compact}
          />
        ))}

      <div className={compact ? 'text-xs text-[var(--muted)]' : 'space-y-1 border-t border-[var(--border)] pt-3'}>
        <p className={compact ? '' : 'text-xs font-semibold uppercase text-[var(--muted)]'}>
          Force non-emergency
        </p>
        {compact ? (
          <a
            href={phoneToTelHref(neNumber)}
            className="font-mono font-medium text-[var(--gold-link)] no-underline hover:underline"
          >
            {neNumber}
          </a>
        ) : (
          <a
            href={phoneToTelHref(neNumber)}
            className="flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold)]"
          >
            {neNumber} ({hint})
          </a>
        )}
        {!compact ? (
          <p className="text-xs text-[var(--muted)]">
            Emergency: <strong className="text-[var(--navy)]">999</strong>
          </p>
        ) : null}
      </div>
    </div>
  );
}
