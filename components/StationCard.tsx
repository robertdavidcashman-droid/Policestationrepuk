import Link from 'next/link';
import type { PoliceStation } from '@/lib/types';
import { StationPhone } from '@/components/StationPhone';

export function StationCard({ station }: { station: PoliceStation }) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-5 shadow-[var(--card-shadow)] transition-all duration-200 hover:shadow-[var(--card-shadow-hover)] hover:border-[var(--gold)]/40">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-[var(--navy)]">
          <Link href={`/police-station/${station.slug}`} className="no-underline hover:text-[var(--gold-hover)]">
            {station.name}
          </Link>
        </h3>
        {(station.isCustodyStation || station.custodySuite) && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
            Custody
          </span>
        )}
      </div>
      <p className="mt-1 text-xs font-medium text-[var(--gold-link)]">{station.forceName || station.county}</p>
      {station.postcode && (
        <p className="mt-0.5 text-xs text-[var(--muted)]">{station.postcode}</p>
      )}
      <p className="mt-2 text-sm text-[var(--muted)]">{station.address}</p>
      <StationPhone station={station} link className="mt-2 text-sm" />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link
          href={`/police-station/${station.slug}`}
          className="text-sm font-medium text-[var(--gold-link)] no-underline hover:text-[var(--gold)]"
        >
          Details →
        </Link>
      </div>
    </article>
  );
}
