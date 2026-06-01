import Link from 'next/link';
import { StationsDataContributeCta } from '@/components/StationsDataContributeCta';
import { CAMPAIGN_HEADLINE, CAMPAIGN_PATH } from '@/lib/station-numbers-campaign';

export function HomePhoneNumbers() {
  return (
    <section className="section-pad bg-white" aria-label="Police station contacts">
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="text-h3 mt-0 text-[var(--navy)]">
            UK police station phone numbers
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Search custody suite lines, main numbers, and addresses across England &amp; Wales — kept
            accurate with help from reps, firms, and the public.
          </p>

          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
            <Link href="/StationsDirectory" className="btn-gold w-full sm:w-auto">
              Station phone numbers
            </Link>
            <Link href="/UpdateStation" className="btn-outline w-full sm:w-auto">
              Report updated number
            </Link>
            <Link href={CAMPAIGN_PATH} className="btn-outline w-full sm:w-auto">
              {CAMPAIGN_HEADLINE}
            </Link>
            <Link href="/Forces" className="btn-outline w-full sm:w-auto">
              Browse by force
            </Link>
          </div>

          <div className="mt-8 text-left">
            <StationsDataContributeCta variant="inline" className="text-center sm:text-left" />
          </div>
        </div>
      </div>
    </section>
  );
}
