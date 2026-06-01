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
  REP_DO_FAQS,
  REP_DO_LIMITS,
  REP_DO_ON_THIS_PAGE,
  REP_DO_RELATED,
  REP_DO_STEPS,
  REP_DO_TASKS,
} from '@/lib/guide-what-does-rep-do';

export const metadata = buildMetadata({
  title: 'What Does a Police Station Representative Do? — Guide',
  description:
    'What accredited police station representatives do at custody: disclosure, consultation, interview support, PACE compliance, and attendance notes — general information, not legal advice.',
  path: '/WhatDoesRepDo',
});

export default function WhatDoesRepDoPage() {
  return (
    <>
      <GuideHero
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Resources', href: '/Resources' },
          { label: 'What Does a Rep Do' },
        ]}
        title="What Does a Police Station Representative Actually Do?"
        description="A structured guide to the role, responsibilities, and typical attendance workflow for accredited police station representatives in England and Wales."
      />
      <StructuredGuideShell sourcesContext={{ kind: 'page', path: '/WhatDoesRepDo' }}>
        <GuideToc items={REP_DO_ON_THIS_PAGE} />

        <section className="mb-12">
          <GuideSectionHeading id="who-for">Who this guide is for</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Trainee and accredited reps, solicitors supervising cover, and anyone considering PSRAS
            accreditation. For suspects and families, see our{' '}
            <Link href="/BeginnersGuide" className="font-semibold text-[var(--navy)] underline">
              beginner&apos;s guide
            </Link>{' '}
            and{' '}
            <Link href="/InterviewUnderCaution" className="font-semibold text-[var(--navy)] underline">
              interview guide
            </Link>
            .
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="overview">Overview of the role</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            A police station representative (&quot;rep&quot;) is accredited under the{' '}
            <a
              href="https://www.sra.org.uk/solicitors/resources/specific-areas-of-practice/police-station-representative-accreditation-scheme/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--navy)] underline"
            >
              Police Station Representatives Accreditation Scheme (PSRAS)
            </a>{' '}
            to advise suspects detained under the{' '}
            <a
              href="https://www.legislation.gov.uk/ukpga/1984/60/contents"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--navy)] underline"
            >
              Police and Criminal Evidence Act 1984 (PACE)
            </a>
            . Reps attend custody suites; supervising solicitors at firms holding a{' '}
            <a
              href="https://www.gov.uk/government/publications/standard-crime-contract-2025"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--navy)] underline"
            >
              Standard Crime Contract
            </a>{' '}
            retain professional responsibility.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="tasks">Key tasks and responsibilities</GuideSectionHeading>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {REP_DO_TASKS.map((t) => (
              <div
                key={t.title}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h3 className="font-bold text-[var(--navy)]">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="attendance">A typical police station attendance</GuideSectionHeading>
          <ol className="mt-6 space-y-4">
            {REP_DO_STEPS.map((step) => (
              <li
                key={step.n}
                className="flex gap-4 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-sm font-bold text-white">
                  {step.n}
                </span>
                <div>
                  <h3 className="font-bold text-[var(--navy)]">{step.title}</h3>
                  <p
                    className="mt-1 text-sm leading-relaxed text-[var(--muted)]"
                    dangerouslySetInnerHTML={{ __html: step.body }}
                  />
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="limits">What representatives cannot do</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {REP_DO_LIMITS.map((item) => (
              <li key={item} dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="faqs">Frequently asked questions</GuideSectionHeading>
          <GuideFaqs faqs={REP_DO_FAQS} />
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="related">Related guides</GuideSectionHeading>
          <GuideRelated links={REP_DO_RELATED} />
        </section>
      </StructuredGuideShell>
    </>
  );
}
