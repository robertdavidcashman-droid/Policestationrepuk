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
  PORTFOLIO_CASE_SECTIONS,
  PORTFOLIO_MISTAKES,
  PORTFOLIO_ON_THIS_PAGE,
  PORTFOLIO_PART_A,
  PORTFOLIO_PART_B,
  PORTFOLIO_RELATED,
  PORTFOLIO_TIPS,
} from '@/lib/guide-build-portfolio';

export const metadata = buildMetadata({
  title: 'How to Build Your PSRAS Accreditation Portfolio',
  description:
    'PSRAS portfolio guide: Part A observation, Part B probationary practice, case report structure, reflection, and common mistakes before the CIT.',
  path: '/BuildPortfolioGuide',
});

export default function BuildPortfolioGuidePage() {
  return (
    <>
      <GuideHero
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Resources', href: '/Resources' },
          { label: 'Build Your Portfolio' },
        ]}
        title="How to Build Your Accreditation Portfolio"
        description="Step-by-step guide to PSRAS Part A and Part B portfolio evidence, case reports, and preparing for the Critical Incidents Test."
      />
      <StructuredGuideShell sourcesContext={{ kind: 'page', path: '/BuildPortfolioGuide' }}>
        <GuideToc items={PORTFOLIO_ON_THIS_PAGE} />

        <section className="mb-12">
          <GuideSectionHeading id="overview">Portfolio overview</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Your portfolio is evidence of competence assessed against the PSRAS framework by Cardiff
            University or Datalaw. It sits between the written test and the CIT. Exact minimum
            numbers and templates are in your assessment organisation handbook — verify before
            you start.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="part-a">Part A — observation</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {PORTFOLIO_PART_A.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="part-b">Part B — probationary practice</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {PORTFOLIO_PART_B.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="case-report">What goes in a case report</GuideSectionHeading>
          <div className="mt-6 space-y-4">
            {PORTFOLIO_CASE_SECTIONS.map((s, i) => (
              <div
                key={s.title}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h3 className="font-bold text-[var(--navy)]">
                  {i + 1}. {s.title}
                </h3>
                <p
                  className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                  dangerouslySetInnerHTML={{ __html: s.body }}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="tips">Tips for success</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {PORTFOLIO_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="mistakes">Common mistakes to avoid</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {PORTFOLIO_MISTAKES.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="related">Related guides</GuideSectionHeading>
          <GuideRelated links={PORTFOLIO_RELATED} />
          <p className="mt-4 text-sm text-[var(--muted)]">
            Full route map:{' '}
            <Link href="/HowToBecomePoliceStationRep" className="font-semibold text-[var(--navy)] underline">
              How to become a police station rep (2026 guide)
            </Link>
          </p>
        </section>
      </StructuredGuideShell>
    </>
  );
}
