import Link from 'next/link';
import { WHATSAPP_PAGE_FIRMS } from '@/lib/site-navigation';

type FirmCoverCTAProps = {
  countyName?: string;
  compact?: boolean;
};

/** Firms needing police station cover — search directory or join WhatsApp. */
export function FirmCoverCTA({ countyName, compact = false }: FirmCoverCTAProps) {
  const area = countyName ? ` in ${countyName}` : '';

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        <Link
          href="/directory"
          className="inline-flex min-h-[2.25rem] items-center rounded-lg bg-[var(--navy)] px-3 py-1.5 text-xs font-semibold text-white no-underline hover:bg-[var(--navy-light)]"
        >
          Search directory
        </Link>
        <Link
          href={WHATSAPP_PAGE_FIRMS}
          className="inline-flex min-h-[2.25rem] items-center rounded-lg border border-[var(--navy)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold)]"
        >
          Firm WhatsApp
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--navy)]/10 bg-gradient-to-br from-slate-50 to-white p-6 text-center shadow-sm sm:p-8">
      <h3 className="text-lg font-bold text-[var(--navy)]">Need police station cover{area}?</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--muted)]">
        Search accredited representatives by county or station, or join our WhatsApp group for criminal
        defence firms arranging out-of-hours cover.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Link href="/directory" className="btn-gold inline-flex !text-sm !no-underline">
          Find a rep
        </Link>
        <Link
          href="/PoliceStationCover"
          className="inline-flex min-h-[2.25rem] items-center rounded-lg border-2 border-[var(--navy)]/15 px-4 py-2 text-sm font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold-hover)]"
        >
          Firm cover guide
        </Link>
        <Link
          href={WHATSAPP_PAGE_FIRMS}
          className="inline-flex min-h-[2.25rem] items-center rounded-lg border-2 border-emerald-700/20 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 no-underline hover:bg-emerald-100"
        >
          Join WhatsApp — firms
        </Link>
      </div>
    </div>
  );
}
