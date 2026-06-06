import Link from 'next/link';
import { LEGAL_DIRECTORY_BASE, REP_DIRECTORY_LINKS } from '@/lib/legal-directory/constants';

type Variant = 'full' | 'compact';

export function PoliceStationRepsCategoryHub({
  listingCount = 0,
  variant = 'full',
}: {
  listingCount?: number;
  variant?: Variant;
}) {
  const hasListings = listingCount > 0;

  if (variant === 'compact') {
    return (
      <aside className="rounded-lg border border-[var(--gold)]/30 bg-[var(--gold-pale)] px-4 py-3 text-sm text-[var(--navy)]">
        <p className="leading-relaxed">
          Accredited police station reps are listed in the{' '}
          <strong>main Police Station Rep UK directory</strong>, not as Legal Services Directory
          claimable listings.
        </p>
        <p className="mt-2">
          <Link href={REP_DIRECTORY_LINKS.find} className="font-semibold text-[var(--gold-link)] hover:underline">
            Find a rep
          </Link>
          {' · '}
          <Link href={REP_DIRECTORY_LINKS.register} className="font-semibold text-[var(--gold-link)] hover:underline">
            Register as a rep
          </Link>
        </p>
      </aside>
    );
  }

  if (hasListings) {
    return (
      <aside className="card-surface border-l-4 border-[var(--gold)] bg-[var(--gold-pale)]/50 p-5">
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          Individual listings below are optional business-style entries in the Legal Services
          Directory. For accredited reps with station coverage, use the{' '}
          <Link href={REP_DIRECTORY_LINKS.find} className="font-semibold text-[var(--gold-link)] hover:underline">
            main rep directory
          </Link>
          .
        </p>
      </aside>
    );
  }

  return (
    <section className="card-surface space-y-6 border-l-4 border-[var(--gold)] p-6 sm:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--gold-link)]">
          Main rep directory
        </p>
        <h2 className="mt-2 text-h3 text-[var(--navy)]">
          Accredited reps are listed separately
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-[var(--muted)]">
          Police Station Rep UK maintains a dedicated directory of accredited police station
          representatives and duty solicitors — with station coverage, availability, and moderation
          for criminal defence firms instructing cover. That live directory is separate from
          claimable Legal Services Directory listings used for firms, chambers, and specialists.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--card-border)] bg-white p-5">
          <h3 className="font-semibold text-[var(--navy)]">For firms looking for cover</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Search by county, station, or name. Confirm PSRAS accreditation and coverage with the
            rep before instructing.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={REP_DIRECTORY_LINKS.find} className="btn-gold !text-sm no-underline">
              Find a rep
            </Link>
            <Link href={REP_DIRECTORY_LINKS.counties} className="btn-outline !text-sm no-underline">
              Browse by county
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--card-border)] bg-white p-5">
          <h3 className="font-semibold text-[var(--navy)]">For reps wanting to join</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Register free in the main directory once you hold full PSRAS accreditation (or are a
            duty solicitor). Probationary reps are not eligible for freelance listing.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={REP_DIRECTORY_LINKS.register} className="btn-gold !text-sm no-underline">
              Register as a rep
            </Link>
            <Link
              href={REP_DIRECTORY_LINKS.nationalLanding}
              className="btn-outline !text-sm no-underline"
            >
              National directory
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--card-border)] pt-5">
        <h3 className="text-sm font-semibold text-[var(--navy)]">PSRAS &amp; career guides</h3>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
          <li>
            <Link
              href={REP_DIRECTORY_LINKS.accreditedGuide}
              className="text-[var(--gold-link)] no-underline hover:underline"
            >
              Accredited representative guide
            </Link>
          </li>
          <li>
            <Link
              href={REP_DIRECTORY_LINKS.becomeRepGuide}
              className="text-[var(--gold-link)] no-underline hover:underline"
            >
              How to become a rep
            </Link>
          </li>
          <li>
            <Link
              href={REP_DIRECTORY_LINKS.psrasResources}
              className="text-[var(--gold-link)] no-underline hover:underline"
            >
              Official resources &amp; regulators
            </Link>
          </li>
        </ul>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Prefer a business-style listing here instead?{' '}
          <Link
            href={`${LEGAL_DIRECTORY_BASE}/add-listing`}
            className="font-semibold text-[var(--gold-link)] hover:underline"
          >
            Add a free Legal Services Directory listing
          </Link>{' '}
          (secondary to the main rep directory for accredited reps).
        </p>
      </div>
    </section>
  );
}
