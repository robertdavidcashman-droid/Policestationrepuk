import Link from 'next/link';
import type { Representative, PoliceStation } from '@/lib/types';
import type { CountySeoPage } from '@/lib/county-seo-pages';
import { DirectoryCard } from '@/components/DirectoryCard';
import { StationCard } from '@/components/StationCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StationNumbersPromo } from '@/components/StationNumbersPromo';

interface CountySeoTemplateProps {
  page: CountySeoPage;
  reps: Representative[];
  stations: PoliceStation[];
}

export function CountySeoTemplate({ page, reps, stations }: CountySeoTemplateProps) {
  return (
    <>
      {/* Navy header */}
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Reps by County', href: '/PoliceStationRepsByCounty' },
              { label: page.countyName },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">{page.h1}</h1>
          <p className="mt-3 max-w-2xl text-lg text-white">{page.intro}</p>
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <span className="flex items-center gap-2 text-white">
              <span className="text-2xl font-extrabold text-[var(--gold)]">{reps.length}+</span>
              Representatives
            </span>
            <span className="flex items-center gap-2 text-white">
              <span className="text-2xl font-extrabold text-[var(--gold)]">{stations.length}+</span>
              Stations
            </span>
            <span className="flex items-center gap-2 text-white">
              <span className="font-bold text-emerald-400">24/7</span>
              Coverage
            </span>
          </div>
        </div>
      </section>

    <div className="page-container">
      <div className="mx-auto max-w-5xl">

        {/* Representatives */}
        <section>
          <h2 className="text-h2 text-[var(--navy)]">
            {page.countyName} Police Station Representatives
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            Accredited representatives available for police station attendance in{' '}
            {page.countyName}. Contact directly for availability.
          </p>
          {reps.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reps.map((rep) => (
                <DirectoryCard key={rep.id} rep={rep} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 text-center shadow-[var(--card-shadow)]">
              <p className="text-[var(--muted)]">
                No representatives currently listed for {page.countyName}. Check back soon or{' '}
                <Link
                  href="/register"
                  className="text-[var(--gold-link)] no-underline hover:underline"
                >
                  register to be listed
                </Link>
                .
              </p>
            </div>
          )}
        </section>

        {/* Stations */}
        <section className="mt-12">
          <h2 className="text-h2 text-[var(--navy)]">
            Police Stations in {page.countyName}
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            Police stations with custody facilities in {page.countyName}.
          </p>
          {stations.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stations.map((station) => (
                <StationCard key={station.id} station={station} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center shadow-[var(--card-shadow)]">
              <p className="text-[var(--muted)]">
                Station data for {page.countyName} is being updated. Use the{' '}
                <Link
                  href="/StationsDirectory"
                  className="text-[var(--gold-link)] no-underline hover:underline"
                >
                  stations directory
                </Link>{' '}
                for a full list.
              </p>
            </div>
          )}
        </section>

        <div className="mt-12">
          <StationNumbersPromo variant="section" countyFilter={page.countyName} />
        </div>

        {/* Why use this directory */}
        <section className="mt-12 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
          <h2 className="text-xl font-bold text-[var(--navy)]">
            Why Use Our {page.countyName} Directory?
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <span className="shrink-0 text-lg text-[var(--gold)]">✓</span>
              <div>
                <h3 className="font-semibold text-[var(--navy)]">Accreditation</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  All listed representatives hold recognised accreditation for police station work.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 text-lg text-[var(--gold)]">✓</span>
              <div>
                <h3 className="font-semibold text-[var(--navy)]">24/7 Availability</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Many of our {page.countyName} reps offer round-the-clock availability for urgent
                  callouts.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 text-lg text-[var(--gold)]">✓</span>
              <div>
                <h3 className="font-semibold text-[var(--navy)]">Direct Contact</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Contact representatives directly — no middleman, no agency fees.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 text-lg text-[var(--gold)]">✓</span>
              <div>
                <h3 className="font-semibold text-[var(--navy)]">Local Coverage</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Representatives who know {page.countyName} custody suites and local procedures.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/directory"
            className="btn-gold !text-sm"
            data-event="blog_cta_click"
            data-event-placement="county_seo_directory"
          >
            Find a Police Station Rep
          </Link>
          <Link
            href="/Register"
            className="btn-outline !text-sm"
            data-event="rep_registration"
            data-event-source="county_seo_register"
          >
            Register as a Police Station Rep
          </Link>
          <Link href="/PoliceStationCover" className="btn-outline !text-sm">
            Police station cover guide
          </Link>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-[var(--navy)]">
            Frequently Asked Questions
          </h2>
          <div className="mt-5 space-y-3">
            <details className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)]">
              <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-[var(--foreground)]">
                How do I find a police station rep in {page.countyName}?
              </summary>
              <p className="px-5 pb-4 text-sm text-[var(--muted)]">
                Browse the listings above or use our main{' '}
                <Link href="/directory" className="text-[var(--gold-link)] hover:underline">
                  directory
                </Link>{' '}
                to search by station name or area. Contact representatives directly using the phone
                number or email on their profile.
              </p>
            </details>
            <details className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)]">
              <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-[var(--foreground)]">
                Are {page.countyName} reps available 24/7?
              </summary>
              <p className="px-5 pb-4 text-sm text-[var(--muted)]">
                Many representatives offer 24/7 availability. Check individual profiles for
                specific availability details and contact them directly to confirm.
              </p>
            </details>
            <details className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)]">
              <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-[var(--foreground)]">
                How do I register as a rep in {page.countyName}?
              </summary>
              <p className="px-5 pb-4 text-sm text-[var(--muted)]">
                Registration is free.{' '}
                <Link href="/register" className="text-[var(--gold-link)] hover:underline">
                  Register here
                </Link>{' '}
                to create your profile and be listed in the {page.countyName} directory.
              </p>
            </details>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
          <h2 className="text-xl font-bold text-white">
            Are You a Police Station Representative in {page.countyName}?
          </h2>
          <p className="mt-2 text-white">
            Join our free directory and connect with criminal defence solicitors looking for cover
            in {page.countyName}.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn-gold">
              Register Free
            </Link>
            <Link href="/GoFeatured" className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)]">
              Become Featured
            </Link>
          </div>
        </section>

        <p className="mt-8 text-xs text-[var(--muted)]">
          Listings are for professional reference only. PoliceStationRepUK does not verify current
          availability. Contact representatives directly to confirm. Not affiliated with any police
          force.
        </p>
      </div>
    </div>
    </>
  );
}
