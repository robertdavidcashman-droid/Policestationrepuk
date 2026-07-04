import Link from 'next/link';
import { PartnerOutboundLink } from '@/components/PartnerOutboundLink';
import { POLICESTATIONAGENT_HOME_HREF } from '@/lib/policestationagent-promo';

const COVERAGE_LINKS = [
  { href: '/police-station-rep-kent', label: 'Kent' },
  { href: '/police-station-rep-london', label: 'London' },
  { href: '/police-station-rep-essex', label: 'Essex' },
  { href: '/directory/surrey', label: 'Surrey' },
  { href: '/directory/sussex', label: 'Sussex' },
  { href: '/directory/hertfordshire', label: 'Hertfordshire' },
  { href: '/directory/hampshire', label: 'Hampshire' },
  { href: '/directory/berkshire', label: 'Thames Valley (Berks)' },
  { href: '/directory/greater-manchester', label: 'Greater Manchester' },
  { href: '/directory/west-midlands', label: 'West Midlands' },
  { href: '/directory/west-yorkshire', label: 'West Yorkshire' },
  { href: '/directory/merseyside', label: 'Merseyside' },
  { href: '/PoliceStationRepsByCounty', label: 'All counties' },
] as const;

export function HomeSeoConversionHub() {
  return (
    <>
      <section className="section-pad border-b border-[var(--border)] bg-white" aria-labelledby="trust-heading">
        <div className="page-container !py-0">
          <div className="mx-auto max-w-3xl text-center">
            <h2 id="trust-heading" className="text-h2 mt-0 text-[var(--navy)]">
              Used by criminal law firms across the UK
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
              PoliceStationRepUK helps <strong className="text-[var(--navy)]">criminal defence firms</strong>, cover
              coordinators, and rota managers find <strong className="text-[var(--navy)]">accredited police station
              representatives</strong> for overnight, weekend, and emergency attendance. The directory has supported the
              profession since <strong className="text-[var(--navy)]">2016</strong> with a free-to-search, free-to-join
              model.
            </p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Operated by <strong className="text-[var(--navy)]">Defence Legal Services Ltd</strong>.{' '}
              <Link href="/AboutFounder" className="font-semibold text-[var(--navy)] underline decoration-[var(--navy)]/30 underline-offset-2">
                About the founder
              </Link>
              {' · '}
              <Link href="/About" className="font-semibold text-[var(--navy)] underline decoration-[var(--navy)]/30 underline-offset-2">
                About the directory
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section
        className="section-pad bg-slate-50"
        aria-labelledby="quick-answer-heading"
      >
        <div className="page-container !py-0">
          <div className="mx-auto max-w-3xl">
            <h2 id="quick-answer-heading" className="text-h2 mt-0 text-[var(--navy)]">
              Quick answer
            </h2>
            <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)]">
              <p className="text-base font-medium leading-relaxed text-[var(--foreground)]">
                <strong className="text-[var(--navy)]">PoliceStationRepUK</strong> is the UK&apos;s free directory of{' '}
                <strong className="text-[var(--navy)]">accredited police station representatives</strong> for{' '}
                <strong className="text-[var(--navy)]">criminal defence firms</strong> who need{' '}
                <strong className="text-[var(--navy)]">police station cover</strong> in England and Wales. It does not
                provide legal advice; it connects firms with reps and publishes guides on custody and PACE for general
                education only.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-white" aria-labelledby="what-is-psr-heading">
        <div className="page-container !py-0">
          <div className="mx-auto max-w-3xl">
            <h2 id="what-is-psr-heading" className="text-h2 mt-0 text-[var(--navy)]">
              What is a police station representative?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
              <strong className="text-[var(--navy)]">Definition:</strong> A police station representative is an
              accredited professional who attends the police station on behalf of an instructing criminal solicitor or
              firm to advise a suspect or volunteer, support them through booking-in and interview, and help protect
              their position under <Link href="/PACE" className="font-semibold text-[var(--navy)] underline">PACE</Link>{' '}
              and the Codes of Practice.
            </p>
            <ul className="mt-4 list-inside list-disc space-y-2 text-base text-[var(--muted)]">
              <li>Acts under the direction of the solicitor firm that instructs them.</li>
              <li>Attends custody suites and interview rooms across England and Wales.</li>
              <li>Often used for out-of-hours, volume, or geographic coverage where in-house staff are stretched.</li>
              <li>Must hold appropriate accreditation (e.g. Law Society / scheme requirements) — firms remain
                responsible for supervision and case conduct.</li>
            </ul>
            <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
              Read the full guide:{' '}
              <Link href="/police-station-representative" className="font-semibold text-[var(--navy)] underline">
                Police station representative (UK)
              </Link>
              {' · '}
              <Link href="/WhatDoesRepDo" className="font-semibold text-[var(--navy)] underline">
                What does a rep do?
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="section-pad border-t border-[var(--border)] bg-slate-50" aria-labelledby="how-it-works-heading">
        <div className="page-container !py-0">
          <div className="mx-auto max-w-3xl">
            <h2 id="how-it-works-heading" className="text-h2 mt-0 text-[var(--navy)]">
              How it works
            </h2>
            <ol className="mt-6 space-y-6">
              {[
                {
                  step: '1',
                  title: 'Contact',
                  body: 'A firm needs attendance at a station — they search by county, station, or name, or post to trusted WhatsApp / call-centre channels.',
                },
                {
                  step: '2',
                  title: 'Allocation',
                  body: 'A rep with the right accreditation and availability accepts the instruction from the firm. PoliceStationRepUK surfaces profiles and contact routes to speed this match.',
                },
                {
                  step: '3',
                  title: 'Attendance',
                  body: 'The rep attends custody, delivers advice, and reports back to the instructing solicitor in line with firm procedures and professional rules.',
                },
              ].map((s) => (
                <li key={s.step} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-sm font-bold text-white">
                    {s.step}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--navy)]">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/directory"
                className="btn-gold inline-flex justify-center !text-sm"
                data-event="blog_cta_click"
                data-event-placement="home_hub_directory"
              >
                Find a Police Station Rep
              </Link>
              <Link href="/search" className="btn-outline inline-flex justify-center !text-sm">
                Advanced search
              </Link>
              <Link href="/StationsDirectory" className="btn-outline inline-flex justify-center !text-sm">
                Station phone numbers
              </Link>
              <Link
                href="/Register"
                className="btn-outline inline-flex justify-center !text-sm"
                data-event="rep_registration"
                data-event-source="home_hub_register"
              >
                Register as a Police Station Rep
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-white" aria-labelledby="coverage-heading">
        <div className="page-container !py-0">
          <div className="mx-auto max-w-3xl text-center">
            <h2 id="coverage-heading" className="text-h2 mt-0 text-[var(--navy)]">
              Coverage across England &amp; Wales
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Browse representatives by region — and use our{' '}
              <Link href="/StationsDirectory" className="font-semibold text-[var(--navy)] underline">
                station phone directory
              </Link>{' '}
              for custody desk lines and main numbers.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {COVERAGE_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2 text-sm font-semibold text-[var(--navy)] no-underline shadow-sm transition-colors hover:border-[var(--gold)]"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad border-t border-[var(--border)] bg-[var(--navy)]" aria-labelledby="for-solicitors-heading">
        <div className="page-container !py-0">
          <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-2 lg:gap-12">
            <div>
              <h2 id="for-solicitors-heading" className="text-h2 mt-0 text-white">
                For criminal law firms
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white">
                We provide a <strong className="text-[var(--gold)]">police station cover</strong> discovery layer: find
                accredited reps by area, station, and availability. Use us alongside your panel, DSCC, and WhatsApp
                workflows — <strong className="text-[var(--gold)]">100% free to search</strong>.
              </p>
              <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-white">
                <li>Filter by county and custody suite</li>
                <li>24/7 directory access</li>
                <li>Links to rates, forms, and PACE resources</li>
              </ul>
              <Link
                href="/criminal-solicitor-police-station"
                className="mt-5 inline-block text-sm font-bold text-[var(--gold)] underline underline-offset-2 hover:text-white"
              >
                Police station rep cover guide for firms →
              </Link>
            </div>
            <div>
              <h2 className="text-h2 mt-0 text-white" id="for-clients-heading">
                Arrested? Need legal advice?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white">
                This site is a <strong className="text-[var(--gold)]">directory for firms and reps</strong>, not a
                substitute for your own lawyer. If you or someone you know is at a police station, ask for the duty
                solicitor or contact a criminal defence firm immediately.
              </p>
              <div className="mt-4 rounded-lg border border-[var(--gold)]/40 bg-white/10 p-4">
                <p className="text-sm font-semibold text-[var(--gold)]">Kent &amp; nearby</p>
                <p className="mt-2 text-sm text-white">
                  Need a solicitor in Kent?{' '}
                  <PartnerOutboundLink
                    href={POLICESTATIONAGENT_HOME_HREF}
                    partner="policestationagent"
                    placement="homepage_hub"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[var(--gold)] underline"
                  >
                    Visit policestationagent.com
                  </PartnerOutboundLink>{' '}
                  — solicitor-led police station cover for Kent firms (separate from this directory).
                </p>
                <p className="mt-2 text-xs text-slate-300">
                  Outside Kent or nearby areas, contact a criminal defence firm local to your police station or use the
                  duty solicitor scheme.
                </p>
              </div>
              <p className="mt-3 text-sm text-white">
                General information only:{' '}
                <Link href="/free-legal-advice-police-station" className="font-semibold text-[var(--gold)] underline">
                  Your rights at the police station
                </Link>
                {' · '}
                <Link href="/police-station-rights-uk" className="font-semibold text-[var(--gold)] underline">
                  Police station rights (UK)
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--gold)]" aria-labelledby="urgent-cta-heading">
        <div className="page-container !py-0 text-center">
          <h2 id="urgent-cta-heading" className="text-h2 mt-0 text-[var(--navy)]">
            Need cover now?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-[var(--navy)]">
            Search the free directory by county, station, or rep name.
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/directory"
              className="inline-flex min-h-[52px] items-center justify-center rounded-[var(--radius-lg)] bg-[var(--navy)] px-6 py-3 text-base font-bold text-white no-underline shadow-lg hover:bg-[var(--navy-light)]"
              data-event="blog_cta_click"
              data-event-placement="home_urgent_directory"
            >
              Find a Police Station Rep
            </Link>
            <Link
              href="/search"
              className="inline-flex min-h-[52px] items-center justify-center rounded-[var(--radius-lg)] border-2 border-[var(--navy)] bg-white px-6 py-3 text-base font-bold text-[var(--navy)] no-underline hover:bg-slate-50"
            >
              Advanced search
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
