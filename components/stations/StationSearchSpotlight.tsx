import Link from 'next/link';
import type { PoliceStation } from '@/lib/types';
import { getCustodyPublicDisplay } from '@/lib/station-contacts/publish';
import { isCustodyStation } from '@/lib/custody-station';
import { StationPhoneActions } from '@/components/stations/StationPhoneActions';

export interface StationSearchSpotlightProps {
  stations: PoliceStation[];
}

function SpotlightCard({ station }: { station: PoliceStation }) {
  const custody = isCustodyStation(station);
  const custodyDisplay = custody ? getCustodyPublicDisplay(station) : null;
  const updateHref = `/UpdateStation?station=${encodeURIComponent(station.id)}`;

  return (
    <article className="rounded-[var(--radius-lg)] border-2 border-[var(--gold)] bg-[var(--gold-pale)] p-5 shadow-[var(--card-shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link
            href={`/police-station/${station.slug}`}
            className="text-lg font-bold text-[var(--navy)] no-underline hover:text-[var(--gold-link)] hover:underline"
          >
            {station.name}
          </Link>
          {station.address ? (
            <p className="mt-1 text-sm text-[var(--muted)]">{station.address}</p>
          ) : null}
          {station.postcode ? (
            <p className="text-sm text-[var(--muted)]">{station.postcode}</p>
          ) : null}
          {station.forceName || station.county ? (
            <p className="mt-1 text-xs font-medium text-[var(--navy)]/80">
              {station.forceName}
              {station.forceName && station.county ? ' · ' : ''}
              {station.county}
            </p>
          ) : null}
        </div>
        {custody ? (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
              custodyDisplay?.published
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {custodyDisplay?.published ? 'Custody published' : 'Custody not published'}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <StationPhoneActions station={station} />
      </div>

      <p className="mt-4 text-xs">
        <Link
          href={updateHref}
          className="font-semibold text-[var(--gold-link)] no-underline hover:text-[var(--gold)] hover:underline"
        >
          Report an updated number →
        </Link>
      </p>
    </article>
  );
}

export function StationSearchSpotlight({ stations }: StationSearchSpotlightProps) {
  if (stations.length === 0) return null;

  return (
    <div className="space-y-4" aria-label="Top search matches">
      {stations.length === 1 ? (
        <SpotlightCard station={stations[0]} />
      ) : (
        stations.map((station) => <SpotlightCard key={station.id} station={station} />)
      )}
    </div>
  );
}

export function StationSearchSummaryStrip({ count, query }: { count: number; query: string }) {
  return (
    <div
      className="rounded-lg border border-[var(--border)] bg-slate-50 px-4 py-3 text-sm text-[var(--muted)]"
      role="status"
    >
      <strong className="text-[var(--navy)]">{count}</strong> stations match &ldquo;{query}&rdquo; —
      refine your search or scroll down to browse results.
    </div>
  );
}
