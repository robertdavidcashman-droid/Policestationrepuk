import Link from 'next/link';
import {
  GuideFaqs,
  GuideHero,
  GuideRelated,
  GuideSectionHeading,
  GuideToc,
  StructuredGuideShell,
} from '@/components/StructuredGuideLayout';
import { buildMetadata } from '@/lib/seo';
import {
  DSVR_COMPARISON,
  DSVR_FAQS,
  DSVR_ON_THIS_PAGE,
  DSVR_RELATED,
} from '@/lib/guide-duty-solicitor-vs-rep';

export const metadata = buildMetadata({
  title: 'Duty Solicitor vs Police Station Representative — Comparison',
  description:
    'Compare duty solicitors and accredited police station representatives: qualifications, PSRAS, duty rota, court work, and how they work together at custody.',
  path: '/DutySolicitorVsRep',
});

export default function DutySolicitorVsRepPage() {
  return (
    <>
      <GuideHero
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Resources', href: '/Resources' },
          { label: 'Duty Solicitor vs Rep' },
        ]}
        title="Duty Solicitor vs Police Station Representative"
        description="Understanding the differences in qualification, scope of work, and how duty solicitors and accredited reps deliver police station advice under legal aid."
      />
      <StructuredGuideShell sourcesContext={{ kind: 'page', path: '/DutySolicitorVsRep' }}>
        <GuideToc items={DSVR_ON_THIS_PAGE} />

        <section className="mb-12">
          <GuideSectionHeading id="who-for">Who this guide is for</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Suspects wondering who will attend; candidates choosing between PSRAS and the solicitor
            route; firms structuring cover. At custody, both roles provide full police station advice
            — the differences are qualification, court scope, and duty rota access.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="key-difference">The key difference</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Both can advise suspects at the police station under PACE. Duty solicitors are qualified
            solicitors who may sit on the duty rota and represent clients in court. Accredited reps
            qualify through PSRAS, work under solicitor supervision, and focus on police station
            work — they cannot conduct court proceedings.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="comparison">Side-by-side comparison</GuideSectionHeading>
          <div className="mt-6 overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--card-border)]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 font-bold text-[var(--navy)]">Aspect</th>
                  <th className="p-3 font-bold text-[var(--navy)]">Duty solicitor</th>
                  <th className="p-3 font-bold text-[var(--navy)]">Accredited rep</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {DSVR_COMPARISON.map((row) => (
                  <tr key={row.aspect}>
                    <td className="p-3 font-medium text-[var(--navy)]">{row.aspect}</td>
                    <td className="p-3 text-[var(--muted)]">{row.solicitor}</td>
                    <td className="p-3 text-[var(--muted)]" dangerouslySetInnerHTML={{ __html: row.rep }} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="duty-solicitor">What is a duty solicitor?</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            A qualified solicitor whose firm holds a crime contract and who meets duty solicitor
            requirements under the{' '}
            <a
              href="https://www.gov.uk/government/publications/standard-crime-contract-2025"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--navy)] underline"
            >
              Standard Crime Contract 2025
            </a>{' '}
            (including Police Station Qualification or CLAS, and rolling activity requirements).
            When a suspect requests the duty solicitor, the Defence Solicitor Call Centre (DSCC)
            contacts the firm on rota for that area and time slot.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="accredited-rep">What is an accredited representative?</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            A non-solicitor accredited through{' '}
            <a
              href="https://www.gov.uk/guidance/police-station-representatives-and-duty-solicitors"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--navy)] underline"
            >
              PSRAS
            </a>{' '}
            after written assessment, supervised portfolio, and the Critical Incidents Test. Reps
            appear on the Police Station Register and attend when instructed by a contract-holding
            firm — they are not named on the duty rota themselves.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="together">How they work together</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            <li>The duty firm receives the DSCC call and allocates attendance.</li>
            <li>Straightforward matters may be sent to an accredited rep; complex cases may be attended by the duty solicitor.</li>
            <li>Many firms use reps for volume cover across stations and hours.</li>
            <li>The supervising solicitor retains responsibility for the advice given.</li>
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="career">Which career path?</GuideSectionHeading>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="font-bold text-[var(--navy)]">Become a solicitor if…</h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[var(--muted)]">
                <li>You want court work as well as police stations</li>
                <li>You want direct duty rota status</li>
                <li>You are committed to the SQE or transitional route</li>
              </ul>
              <Link href="/CriminalLawCareerGuide" className="mt-4 inline-block text-sm font-semibold text-[var(--navy)] underline">
                Criminal law careers guide →
              </Link>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="font-bold text-[var(--navy)]">Become a rep if…</h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[var(--muted)]">
                <li>You want to focus on police station work</li>
                <li>You prefer a 12–18 month competence-based route</li>
                <li>Freelance flexible cover appeals to you</li>
              </ul>
              <Link href="/HowToBecomePoliceStationRep" className="mt-4 inline-block text-sm font-semibold text-[var(--navy)] underline">
                How to become a rep →
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="faqs">Frequently asked questions</GuideSectionHeading>
          <GuideFaqs faqs={DSVR_FAQS} />
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="related">Related guides</GuideSectionHeading>
          <GuideRelated links={DSVR_RELATED} />
        </section>
      </StructuredGuideShell>
    </>
  );
}
