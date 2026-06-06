import Link from 'next/link';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';

const LAA_FIND_ADVISER_URL = 'https://find-legal-advice.justice.gov.uk';
const SRA_CHECK_URL = 'https://www.sra.org.uk/consumers/register/organisation/';

type Variant = 'full' | 'compact';

export function SolicitorsCategoryHub({
  listingCount = 0,
  unclaimedCount = 0,
  variant = 'full',
}: {
  listingCount?: number;
  unclaimedCount?: number;
  variant?: Variant;
}) {
  const mostlyUnclaimed = listingCount === 0 || unclaimedCount >= listingCount / 2;

  if (variant === 'compact') {
    return (
      <aside className="rounded-lg border border-[var(--gold)]/30 bg-[var(--gold-pale)] px-4 py-3 text-sm text-[var(--navy)]">
        <p className="leading-relaxed">
          Listings here are <strong>auto-imported from published Legal Aid Agency provider data</strong>{' '}
          and are mostly unclaimed — not firm-confirmed profiles. A crime legal aid contract is{' '}
          <strong>not</strong> the same as membership of the national duty solicitor rota.
        </p>
        <p className="mt-2">
          <a
            href={LAA_FIND_ADVISER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--gold-link)] hover:underline"
          >
            Find a legal aid adviser (gov.uk)
          </a>
          {' · '}
          <a
            href={SRA_CHECK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--gold-link)] hover:underline"
          >
            SRA — Check a solicitor
          </a>
        </p>
      </aside>
    );
  }

  return (
    <section className="card-surface space-y-6 border-l-4 border-[var(--gold)] p-6 sm:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--gold-link)]">
          LAA directory import
        </p>
        <h2 className="mt-2 text-h3 text-[var(--navy)]">
          About these solicitor listings
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-[var(--muted)]">
          {listingCount > 0 ? (
            <>
              This category includes approximately {listingCount.toLocaleString()} entries imported
              from the Legal Aid Agency&apos;s published directory of crime legal aid providers.
              {mostlyUnclaimed ? (
                <>
                  {' '}
                  Most are <strong>unclaimed</strong> — the firm has not confirmed contact details
                  or completed a profile on Police Station Rep UK.
                </>
              ) : null}
            </>
          ) : (
            <>
              Entries in this category are imported from the Legal Aid Agency&apos;s published
              directory of crime legal aid providers. Unclaimed listings are not firm-confirmed.
            </>
          )}{' '}
          Holding a crime legal aid contract does <strong>not</strong> mean a firm is on the
          national duty solicitor rota, and this is <strong>not</strong> a duty solicitor register.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--card-border)] bg-white p-5">
          <h3 className="font-semibold text-[var(--navy)]">Official firm finders</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Use government and regulator tools to confirm legal aid status, SRA registration, and
            current contact details before instructing.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={LAA_FIND_ADVISER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold !text-sm no-underline"
            >
              Find a legal aid adviser
            </a>
            <a
              href={SRA_CHECK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline !text-sm no-underline"
            >
              SRA — Check a solicitor
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--card-border)] bg-white p-5">
          <h3 className="font-semibold text-[var(--navy)]">For firms with a listing here</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Claim your auto-imported stub to add contact details, specialisms, and coverage — or
            submit a new listing if you are not yet in the directory.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`${LEGAL_DIRECTORY_BASE}/add-listing`}
              className="btn-gold !text-sm no-underline"
            >
              Add a listing
            </Link>
            <Link
              href={`${LEGAL_DIRECTORY_BASE}/resources`}
              className="btn-outline !text-sm no-underline"
            >
              Official resources
            </Link>
          </div>
        </div>
      </div>

      <p className="text-sm text-[var(--muted)]">
        Need an accredited police station rep for custody cover? Use the{' '}
        <Link href="/directory" className="font-semibold text-[var(--gold-link)] hover:underline">
          main rep directory
        </Link>{' '}
        — separate from these firm listings.
      </p>
    </section>
  );
}
