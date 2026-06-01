import Link from 'next/link';
import {
  GuideHero,
  GuideRelated,
  GuideSectionHeading,
  GuideToc,
  StructuredGuideShell,
} from '@/components/StructuredGuideLayout';
import { buildMetadata } from '@/lib/seo';
import {
  HOW_TO_BECOME_RELATED,
  HOW_TO_BECOME_ROUTE,
  HOW_TO_BECOME_SHORT_ON_THIS_PAGE,
} from '@/lib/guide-how-to-become-short';

export const metadata = buildMetadata({
  title: 'How to Become a Police Station Representative — Overview',
  description:
    'Overview of the PSRAS route to becoming an accredited police station rep: firm sponsorship, written test, portfolio, CIT, and register — with link to the full 2026 guide.',
  path: '/HowToBecome',
});

export default function HowToBecomePage() {
  return (
    <>
      <GuideHero
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'For Reps', href: '/RepsHub' },
          { label: 'How to Become' },
        ]}
        title="How to Become a Police Station Representative"
        description="Quick overview of the PSRAS accreditation route. For costs, timelines, exemptions, and FAQs, use the complete 2026 guide."
      />
      <StructuredGuideShell sourcesContext={{ kind: 'page', path: '/HowToBecome' }}>
        <div className="mb-10 rounded-[var(--radius-lg)] border border-[var(--gold)]/40 bg-[var(--gold-pale)]/30 p-6">
          <p className="text-sm leading-relaxed text-[var(--navy)]">
            <strong>Full guide:</strong> This page is a summary. The detailed walkthrough — eligibility,
            written exam exemptions, supervision, costs, and FAQs — is in{' '}
            <Link href="/HowToBecomePoliceStationRep" className="font-bold underline">
              How to Become a Police Station Representative (2026)
            </Link>
            .
          </p>
        </div>

        <GuideToc items={HOW_TO_BECOME_SHORT_ON_THIS_PAGE} />

        <section className="mb-12">
          <GuideSectionHeading id="overview">Overview</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Police station representatives qualify through PSRAS — not a law degree. You need a
            Standard Crime Contract firm to sponsor and supervise you, then pass written assessment,
            complete a portfolio of supervised attendances, and pass the Critical Incidents Test
            (CIT).
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="reality">Reality check</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            <li>Regulated legal work under PACE — same custody standard as junior duty solicitors</li>
            <li>24/7 on-call cover once accredited; reliability is your commercial asset</li>
            <li>No firm sponsorship = no route (the main barrier to entry)</li>
            <li>Probationary reps cannot freelance until fully accredited after the CIT</li>
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="route">The route at a glance</GuideSectionHeading>
          <ol className="mt-6 space-y-4">
            {HOW_TO_BECOME_ROUTE.map((step) => (
              <li
                key={step.n}
                className="flex gap-4 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-sm font-bold text-white">
                  {step.n}
                </span>
                <div>
                  <h3 className="font-bold text-[var(--navy)]">{step.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="supervision">Supervision — the main barrier</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Firms take professional and contract risk when supervising trainees. Expect to demonstrate
            commitment, availability, and basic PACE knowledge before enrolment. Read{' '}
            <Link href="/FindSupervisingSolicitor" className="font-semibold text-[var(--navy)] underline">
              find a supervising solicitor
            </Link>{' '}
            before paying assessment fees.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="providers">Assessment organisations</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Cardiff University Law School and Datalaw are the SRA-authorised assessment organisations.
            Your firm may prefer one provider. Check current enrolment fees and handbook requirements
            on their websites before committing.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="next">Your next steps</GuideSectionHeading>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            <li>
              Read the{' '}
              <Link href="/HowToBecomePoliceStationRep" className="font-semibold text-[var(--navy)] underline">
                complete 2026 guide
              </Link>
            </li>
            <li>
              Start{' '}
              <Link href="/GettingStarted" className="font-semibold text-[var(--navy)] underline">
                getting started
              </Link>{' '}
              checklist
            </li>
            <li>
              Approach firms via{' '}
              <Link href="/FindSupervisingSolicitor" className="font-semibold text-[var(--navy)] underline">
                supervising solicitor guide
              </Link>
            </li>
          </ol>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="related">Related guides</GuideSectionHeading>
          <GuideRelated links={HOW_TO_BECOME_RELATED} />
        </section>
      </StructuredGuideShell>
    </>
  );
}
