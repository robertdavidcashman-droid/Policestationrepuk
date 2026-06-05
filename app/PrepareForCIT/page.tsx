import Link from 'next/link';
import { PsrTrainPromo } from '@/components/PsrTrainPromo';
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
  CIT_AFTER,
  CIT_ANSWER_FRAMEWORK,
  CIT_EXAM_DAY,
  CIT_FAQS,
  CIT_FORMAT_CARDS,
  CIT_MARKING_CRITERIA,
  CIT_ON_THIS_PAGE,
  CIT_PITFALLS,
  CIT_PREP_PLAN,
  CIT_RELATED,
  CIT_SCENARIO_FLOW,
  CIT_SYLLABUS_MODULES,
  CIT_TIPS,
} from '@/lib/guide-prepare-for-cit';

export const metadata = buildMetadata({
  title: 'PSRAS CIT Guide — Critical Incidents Test Preparation',
  description:
    'Complete PSRAS CIT preparation guide: audio role-play format, Content/Confidence/Control marking (50% each), scenario flow, SRA syllabus modules, study plan, and exam-day tips — verified against Datalaw and PSRA 2025.',
  path: '/PrepareForCIT',
});

export default function PrepareForCITPage() {
  return (
    <>
      <GuideHero
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Resources', href: '/Resources' },
          { label: 'CIT Exam Guide' },
        ]}
        title="PSRAS Critical Incidents Test (CIT) — Complete Guide"
        description="Prepare for the final PSRAS practical assessment: verified format, marking criteria, study syllabus mapped to SRA standards, and how to answer audio role-play scenarios."
        updated="5 June 2026"
      />
      <StructuredGuideShell
        sourcesContext={{ kind: 'page', path: '/PrepareForCIT' }}
        promo={<PsrTrainPromo className="mb-10" />}
      >
        <div className="mb-10 rounded-[var(--radius-lg)] border border-amber-300 bg-amber-50 p-6">
          <h2 className="text-base font-bold text-amber-900">Not the same as PSQ CIT</h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-900">
            This guide covers the <strong>PSRAS</strong> Critical Incidents Test for police station
            representative accreditation. Solicitors taking the Police Station Qualification (PSQ) sit
            a separate CIT under different regulations — do not confuse booking or PIN requirements.
          </p>
        </div>

        <GuideToc items={CIT_ON_THIS_PAGE} />

        <section className="mb-12">
          <GuideSectionHeading id="what">What is the CIT?</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            The Critical Incidents Test is the final practical assessment in PSRAS accreditation — a
            role-play under exam conditions testing whether you can effectively advise and assist
            clients at the police station (Datalaw; SRA scheme overview). Assessors mark against the{' '}
            <a
              href="https://www.sra.org.uk/solicitors/resources/specific-areas-of-practice/standards/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--navy)] underline"
            >
              SRA Standards of competence
            </a>
            . There is no exemption from the CIT (PSRA 2025).
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="prerequisites">Prerequisites</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            <li>
              Pass the{' '}
              <Link href="/PrepareForWrittenExam" className="font-semibold text-[var(--navy)] underline">
                written examination
              </Link>{' '}
              (or hold an LAA exemption)
            </li>
            <li>
              Pass Part A of the{' '}
              <Link href="/BuildPortfolioGuide" className="font-semibold text-[var(--navy)] underline">
                portfolio
              </Link>{' '}
              and receive a probationary LAA PIN via ADMIN 2 (PSRA 2025)
            </li>
            <li>
              Hold a valid probationary PIN when sitting PSRAS CIT (Datalaw — unlike some PSQ
              candidates)
            </li>
            <li>
              Part B portfolio and CIT may be undertaken in either order once probationary (Datalaw)
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="format">Assessment format</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Datalaw&apos;s published format uses <strong>audio scenarios</strong> — not necessarily live
            actors in a consultation room. You listen and respond aloud; responses are recorded.
            Cardiff may use a different delivery — confirm in your handbook before assuming live
            role-play.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
            {CIT_FORMAT_CARDS.map((item) => (
              <div
                key={item.label}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                  {item.label}
                </p>
                <p
                  className="mt-2 text-sm text-[var(--navy)]"
                  dangerouslySetInnerHTML={{ __html: item.value }}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="marking">Marking scheme</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Datalaw regulations: pass requires at least <strong>50% on each</strong> of Content,
            Confidence, and Control in <strong>each scenario</strong>.
          </p>
          <div className="mt-6 space-y-4">
            {CIT_MARKING_CRITERIA.map((c) => (
              <div
                key={c.criterion}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h3 className="font-bold text-[var(--navy)]">{c.criterion}</h3>
                <p
                  className="mt-2 text-sm text-[var(--muted)]"
                  dangerouslySetInnerHTML={{ __html: c.body }}
                />
                <p className="mt-2 text-xs text-[var(--muted)]">
                  <span className="font-semibold">Behaviours:</span>{' '}
                  <span dangerouslySetInnerHTML={{ __html: c.behaviours }} />
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="flow">Scenario flow (chronological)</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Scenarios follow a normal police station attendance from start to finish (Datalaw):
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {CIT_SCENARIO_FLOW.map((s) => (
              <li key={s.stage}>
                <span className="font-semibold text-[var(--navy)]">{s.stage}:</span> {s.detail}
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="syllabus">Study syllabus (SRA-aligned modules)</GuideSectionHeading>
          <div className="mt-6 space-y-4">
            {CIT_SYLLABUS_MODULES.map((topic) => (
              <div
                key={topic.title}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h3 className="font-bold text-[var(--navy)]">{topic.title}</h3>
                <p
                  className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                  dangerouslySetInnerHTML={{ __html: topic.body }}
                />
                <p className="mt-2 text-xs text-[var(--muted)]">Source: {topic.source}</p>
                <Link
                  href={topic.href}
                  className="mt-2 inline-block text-xs font-semibold text-[var(--navy)] underline"
                >
                  Read on PoliceStationRepUK →
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="answering">How to answer CIT prompts</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Use a consistent structure — speak as the representative, not as a student:
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {CIT_ANSWER_FRAMEWORK.map((step) => (
              <li key={step} dangerouslySetInnerHTML={{ __html: step }} />
            ))}
          </ol>
          <p className="mt-4 text-sm text-[var(--muted)]">
            Do not reproduce copyrighted scenario scripts from training providers. Practice with your
            own hypothetical facts and the site&apos;s PACE and disclosure guides.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="prep-plan">4–6 week prep plan</GuideSectionHeading>
          <div className="mt-4 space-y-3">
            {CIT_PREP_PLAN.map((w) => (
              <div
                key={w.week}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 text-sm"
              >
                <span className="font-bold text-[var(--navy)]">{w.week}:</span>{' '}
                <span className="text-[var(--muted)]">{w.focus}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="exam-day">Exam day</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {CIT_EXAM_DAY.map((tip) => (
              <li key={tip} dangerouslySetInnerHTML={{ __html: tip }} />
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="tips">Exam tips</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {CIT_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="pitfalls">Common pitfalls</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {CIT_PITFALLS.map((p) => (
              <li key={p} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="after">After the CIT</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {CIT_AFTER.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="faqs">FAQs</GuideSectionHeading>
          <GuideFaqs faqs={CIT_FAQS} />
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="related">Related guides</GuideSectionHeading>
          <GuideRelated links={CIT_RELATED} />
        </section>
      </StructuredGuideShell>
    </>
  );
}
