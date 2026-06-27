import Link from 'next/link';
import type { Representative } from '@/lib/types';
import { selectMonthlySpotlight } from '@/lib/rep-spotlight';

const MONTH_LABEL = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Free, fairly-rotating "Rep of the Month" spotlight.
 * Distinct from paid Featured listings: placement here cannot be bought and the
 * selection rotates automatically so every rep gets an equal turn over time.
 */
export function RepSpotlight({ reps }: { reps: Representative[] }) {
  const [rep] = selectMonthlySpotlight(reps, 1);
  if (!rep) return null;

  const monthName = MONTH_LABEL.format(new Date());
  const stations = (rep.stations || []).slice(0, 3);

  return (
    <section
      className="section-pad bg-white"
      aria-labelledby="rep-spotlight-heading"
    >
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
          <div className="text-center">
            <span className="inline-block rounded-full bg-[var(--navy)]/5 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--navy)]">
              Rep of the Month · {monthName}
            </span>
            <h2 id="rep-spotlight-heading" className="text-h3 mt-3 text-[var(--navy)]">
              {rep.name}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {rep.county || 'England &amp; Wales'}
            </p>
            {stations.length > 0 && (
              <p className="mt-3 text-sm text-[var(--foreground)]">
                <span className="font-semibold">Covers:</span> {stations.join(', ')}
                {(rep.stations || []).length > 3
                  ? ` +${(rep.stations || []).length - 3} more`
                  : ''}
              </p>
            )}
            <div className="mt-6">
              <Link href={`/rep/${rep.slug}`} className="btn-gold !text-sm">
                View profile
              </Link>
            </div>
          </div>
          <p className="mt-6 border-t border-[var(--card-border)] pt-4 text-center text-xs leading-relaxed text-[var(--muted)]">
            A different representative is highlighted here each month at no cost.
            This spotlight rotates automatically and fairly across the directory —
            placement cannot be bought.
          </p>
        </div>
      </div>
    </section>
  );
}
