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
  GETTING_STARTED_ESSENTIALS,
  GETTING_STARTED_ON_THIS_PAGE,
  GETTING_STARTED_PATH,
  GETTING_STARTED_RELATED,
} from '@/lib/guide-getting-started';

export const metadata = buildMetadata({
  title: 'Getting Started as a Police Station Representative UK',
  description:
    'New to police station representation? Start here: understand the role, find a supervising firm, follow PSRAS accreditation, and build a freelance career.',
  path: '/GettingStarted',
});

export default function GettingStartedPage() {
  return (
    <>
      <GuideHero
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'For Reps', href: '/RepsHub' },
          { label: 'Getting Started' },
        ]}
        title="Getting Started as a Police Station Representative"
        description="A practical onboarding path from zero to accredited rep — what to read first, how to find supervision, and what happens after the CIT."
      />
      <StructuredGuideShell sourcesContext={{ kind: 'page', path: '/GettingStarted' }}>
        <GuideToc items={GETTING_STARTED_ON_THIS_PAGE} />

        <section className="mb-12">
          <GuideSectionHeading id="who-for">Who this guide is for</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Career changers, paralegals, and law graduates exploring PSRAS before committing to the
            full solicitor route. If you are already enrolled, use this as a checklist against the{' '}
            <Link href="/HowToBecomePoliceStationRep" className="font-semibold text-[var(--navy)] underline">
              detailed PSRAS guide
            </Link>
            .
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="path">Your path into the role</GuideSectionHeading>
          <ol className="mt-6 space-y-4">
            {GETTING_STARTED_PATH.map((item) => (
              <li
                key={item.step}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--gold)]">
                  Step {item.step}
                </p>
                <Link href={item.href} className="mt-1 block text-lg font-bold text-[var(--navy)] underline">
                  {item.title}
                </Link>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="step-1">Step 1 — Understand the job</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Before approaching firms, read{' '}
            <Link href="/WhatDoesRepDo" className="font-semibold text-[var(--navy)] underline">
              what a rep actually does
            </Link>{' '}
            and the{' '}
            <Link href="/BeginnersGuide" className="font-semibold text-[var(--navy)] underline">
              custody lifecycle
            </Link>
            . Police station work is regulated, unsocial, and legally demanding — not a casual side
            role.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="step-2">Step 2 — Find a supervising firm</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            You cannot enrol or attend without a Standard Crime Contract firm willing to supervise
            you. See{' '}
            <Link href="/FindSupervisingSolicitor" className="font-semibold text-[var(--navy)] underline">
              find a supervising solicitor
            </Link>{' '}
            for how to approach firms and what they expect.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="step-3">Step 3 — PSRAS accreditation</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Written test → probationary register → portfolio → CIT. Typical timeline 12–18 months.
            Official scheme overview:{' '}
            <a
              href="https://www.gov.uk/guidance/police-station-representatives-and-duty-solicitors"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--navy)] underline"
            >
              gov.uk PSRAS guidance
            </a>
            .
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="step-4">Step 4 — After accreditation</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Join firm rotas, list on{' '}
            <Link href="/register" className="font-semibold text-[var(--navy)] underline">
              the directory
            </Link>
            , and read the{' '}
            <Link href="/GetWork" className="font-semibold text-[var(--navy)] underline">
              get work guide
            </Link>
            . Reliability and clean attendance notes are how you keep instructions.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="essentials">Essentials from day one</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {GETTING_STARTED_ESSENTIALS.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="related">Related guides</GuideSectionHeading>
          <GuideRelated links={GETTING_STARTED_RELATED} />
        </section>
      </StructuredGuideShell>
    </>
  );
}
