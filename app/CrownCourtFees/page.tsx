import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ResolvedContentSources } from '@/components/ContentSourcesFooter';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Crown Court Legal Aid Fee Rates | PoliceStationRepUK',
  description:
    'Crown Court legal aid: litigator graduated fees (LGFS) and advocates’ graduated fee scheme (AGFS). Overview for criminal defence practitioners — use official LAA tools for live amounts.',
  path: '/CrownCourtFees',
});

export default function CrownCourtFeesPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Crown Court legal aid fee rates' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Crown Court fees (overview)</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-200">
            Crown Court criminal legal aid uses graduated fee schemes: litigator fees for firm preparation work and
            advocacy fees (AGFS) for court work. Amounts depend on offence class, pages of prosecution evidence (PPE), trial
            length, and outcome — use the LAA calculator for exact figures.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10 pb-12 pt-8">
          <ContentReliabilityNotice />
          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">Litigator fees vs advocacy fees</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-[var(--navy)]">Litigator (LGFS)</h3>
                <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                  Paid to the solicitor firm for preparation: instructions, reviewing PPE, defence preparation, witnesses,
                  instructing counsel, and administration.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-[var(--navy)]">Advocacy (AGFS)</h3>
                <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                  Paid to the advocate for hearings: PTPH, mentions, trial, sentencing, appeals, and advocacy preparation
                  where claimable under the scheme.
                </p>
              </div>
            </div>
            <p className="text-[var(--muted)] leading-relaxed">
              Both can apply to the same case. If a solicitor advocate does their own advocacy, fee rules still separate
              the litigator and advocacy elements — follow current LAA guidance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">Offence classes (A–K)</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Crown Court offences sit in classes that drive base fees and PPE parameters. High-harm classes (e.g. homicide,
              serious sexual offending, robbery) sit in higher bands than volume summary-style offences remitted for
              sentence or tried on indictment.
            </p>
            <p className="text-sm text-[var(--muted)]">
              Use the LAA offence class tools — do not guess class from the indictment alone if unsure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">What feeds the calculation</h2>
            <ul className="list-disc space-y-2 pl-5 text-[var(--muted)] marker:text-[var(--gold)]">
              <li>
                <strong className="text-[var(--navy)]">Class</strong> — offence class and case type drive the fee structure.
              </li>
              <li>
                <strong className="text-[var(--navy)]">PPE</strong> — pages of prosecution evidence counted under the rules.
              </li>
              <li>
                <strong className="text-[var(--navy)]">Outcome</strong> — guilty plea, cracked trial, contested trial, appeal
                — each follows different tables.
              </li>
            </ul>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/80 p-4 text-sm text-[var(--muted)]">
              <p className="font-semibold text-[var(--navy)]">PPE — broadly</p>
              <p className="mt-2">Usually includes prosecution statements, exhibits, interview transcripts, and schedules as defined in the rules.</p>
              <p className="mt-2">Usually excludes defence material, counsel&apos;s working notes, and many court-generated documents — check the current definition.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">Examples (illustrative only)</h2>
            <p className="text-sm text-[var(--muted)]">
              Numbers below are rough illustrations. Always run the official LAA calculator before relying on any figure.
            </p>
            <div className="space-y-4 text-sm text-[var(--muted)]">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="font-bold text-[var(--navy)]">Example A — low class, guilty plea</p>
                <p className="mt-2">Narrow PPE, early guilty plea at PTPH — combined litigator and advocacy totals may sit in the hundreds to low thousands depending on class and tables in force.</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="font-bold text-[var(--navy)]">Example B — serious class, multi-day trial</p>
                <p className="mt-2">High PPE and several trial days — litigator and AGFS components each rise; totals can reach five figures where rules allow.</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="font-bold text-[var(--navy)]">Example C — cracked trial</p>
                <p className="mt-2">Guilty plea on the day of trial — different uplift/crack rules apply than for an early plea; verify against the AGFS/LGFS tables for the relevant period.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">Uplifts, conferences, QC-led cases</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Additional fees may exist for certain conferences, views, and wasted preparation where justified. QC-led
              cases adjust junior advocacy entitlements. These rules change with scheme updates — follow the current
              regulations and LAA manuals.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">Very high cost cases (VHCC)</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Exceptionally large or complex matters may leave graduated schemes for individually negotiated contracts.
              Early identification, LAA engagement, and realistic costing are essential.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">Official resources</h2>
            <ul className="list-disc space-y-2 pl-5 text-[var(--muted)] marker:text-[var(--gold)]">
              <li>
                <a
                  href="https://www.gov.uk/government/organisations/legal-aid-agency"
                  className="font-semibold text-[var(--navy)] underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Legal Aid Agency
                </a>{' '}
                — calculators and guidance
              </li>
              <li>
                <a
                  href="https://www.gov.uk/guidance/criminal-legal-aid-manual"
                  className="font-semibold text-[var(--navy)] underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Criminal Legal Aid Manual
                </a>
              </li>
              <li>
                <a
                  href="https://www.legislation.gov.uk/uksi/2013/435/contents"
                  className="font-semibold text-[var(--navy)] underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SI 2013/435
                </a>{' '}
                — remuneration regulations (as amended)
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-h2 text-[var(--navy)]">Related</h2>
            <ul className="text-[var(--muted)]">
              <li>
                <Link href="/MagistratesCourtFees" className="font-semibold text-[var(--navy)] underline">
                  Magistrates&apos; standard fees
                </Link>
              </li>
              <li>
                <Link href="/PoliceStationRepPay" className="font-semibold text-[var(--navy)] underline">
                  Police station fixed fees
                </Link>
              </li>
            </ul>
            <p className="text-sm text-[var(--muted)]">
              Disclaimer: general information only — not billing advice. Schemes and rates change; verify every claim.
            </p>
          </section>

          <ResolvedContentSources className="mb-10" context={{ kind: 'page', path: '/CrownCourtFees' }} />

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need help?</h2>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">
                Find a rep
              </Link>
              <Link href="/Contact" className="btn-outline no-underline">
                Contact us
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
