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
  WRITTEN_EXAM_AFTER,
  WRITTEN_EXAM_EXEMPTIONS,
  WRITTEN_EXAM_FAQS,
  WRITTEN_EXAM_FORMAT,
  WRITTEN_EXAM_ON_THIS_PAGE,
  WRITTEN_EXAM_OPEN_BOOK,
  WRITTEN_EXAM_PITFALLS,
  WRITTEN_EXAM_READING,
  WRITTEN_EXAM_RELATED,
  WRITTEN_EXAM_STANDARDS,
  WRITTEN_EXAM_STUDY_PLAN,
  WRITTEN_EXAM_TIPS,
  WRITTEN_EXAM_TOPICS,
} from '@/lib/guide-prepare-for-written-exam';

export const metadata = buildMetadata({
  title: 'PSRAS Written Exam Guide — Format, Exemptions & Study Plan',
  description:
    'Complete PSRAS written examination guide: two-hour format (4 of 5 questions, 50% pass), LAA exemptions, SRA syllabus topics, open-book rules, and 6-week study plan — verified against PSRA 2025 and Datalaw.',
  path: '/PrepareForWrittenExam',
});

export default function PrepareForWrittenExamPage() {
  return (
    <>
      <GuideHero
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Resources', href: '/Resources' },
          { label: 'Written Exam Guide' },
        ]}
        title="PSRAS Written Examination — Complete Guide"
        description="Prepare for the first stage of PSRAS accreditation: verified format, exemptions, examination topics, SRA competence areas, open-book rules, and a structured study plan."
        updated="5 June 2026"
      />
      <StructuredGuideShell
        sourcesContext={{ kind: 'page', path: '/PrepareForWrittenExam' }}
        promo={<PsrTrainPromo className="mb-10" />}
      >
        <div className="mb-10 rounded-[var(--radius-lg)] border border-amber-300 bg-amber-50 p-6">
          <h2 className="text-base font-bold text-amber-900">Check your exemption before booking</h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-900">
            PSRA 2025 lists specific written-exam exemptions (LPC, BPTC, solicitors, barristers,
            specified CILEX qualifications). A law degree or SQE pass alone does not automatically
            exempt you — confirm with the Legal Aid Agency if unsure (Datalaw advises LAA contact).
          </p>
        </div>

        <GuideToc items={WRITTEN_EXAM_ON_THIS_PAGE} />

        <section className="mb-12">
          <GuideSectionHeading id="what">What is the written exam?</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            The written examination assesses your understanding of the representative&apos;s role at
            the police station, criminal law, evidence, practice, and procedure (Datalaw). It must be
            passed before Part A portfolio cases begin (Datalaw) and before DSCC probationary
            registration (PSRA 2025). You are assessed against the{' '}
            <a
              href="https://www.sra.org.uk/solicitors/resources/specific-areas-of-practice/standards/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--navy)] underline"
            >
              SRA Standards of competence
            </a>
            .
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="journey">Where it sits in PSRAS</GuideSectionHeading>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            <li>
              <strong className="text-[var(--navy)]">Written exam</strong> (this guide) — or prove
              exemption
            </li>
            <li>
              <Link href="/BuildPortfolioGuide" className="font-semibold text-[var(--navy)] underline">
                Part A portfolio
              </Link>{' '}
              — four case studies; probationary PIN application
            </li>
            <li>
              <Link href="/BuildPortfolioGuide" className="font-semibold text-[var(--navy)] underline">
                Part B portfolio
              </Link>{' '}
              — five case studies (probationary)
            </li>
            <li>
              <Link href="/PrepareForCIT" className="font-semibold text-[var(--navy)] underline">
                Critical Incidents Test
              </Link>{' '}
              — final role-play (Part B and CIT in either order once probationary)
            </li>
          </ol>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="exemptions">Exemptions</GuideSectionHeading>
          <div className="mt-6 space-y-6">
            {WRITTEN_EXAM_EXEMPTIONS.map((block) => (
              <div key={block.group}>
                <h3 className="text-base font-bold text-[var(--navy)]">{block.group}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-[var(--muted)]">
                  {block.items.map((item) => (
                    <li key={item} dangerouslySetInnerHTML={{ __html: item }} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="format">Assessment format</GuideSectionHeading>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {WRITTEN_EXAM_FORMAT.map((item) => (
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
          <GuideSectionHeading id="syllabus">Examination topics</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Datalaw lists six major areas — questions draw from any combination:
          </p>
          <div className="mt-6 space-y-4">
            {WRITTEN_EXAM_TOPICS.map((topic) => (
              <div
                key={topic.title}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h3 className="font-bold text-[var(--navy)]">{topic.title}</h3>
                <p
                  className="mt-2 text-sm text-[var(--muted)]"
                  dangerouslySetInnerHTML={{ __html: topic.body }}
                />
                <p className="mt-2 text-xs text-[var(--muted)]">
                  <span className="font-semibold">Study:</span>{' '}
                  <span dangerouslySetInnerHTML={{ __html: topic.study }} />
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="standards">SRA competence areas</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Questions align with these assessment outcomes — read the full standards on the SRA
            website:
          </p>
          <ul className="mt-4 list-disc space-y-1 pl-6 text-sm text-[var(--muted)]">
            {WRITTEN_EXAM_STANDARDS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="study-plan">6-week study plan</GuideSectionHeading>
          <div className="mt-4 space-y-3">
            {WRITTEN_EXAM_STUDY_PLAN.map((w) => (
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
          <GuideSectionHeading id="open-book">Open-book rules</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {WRITTEN_EXAM_OPEN_BOOK.map((rule) => (
              <li key={rule} dangerouslySetInnerHTML={{ __html: rule }} />
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="reading">Suggested reading</GuideSectionHeading>
          <ul className="mt-4 space-y-3">
            {WRITTEN_EXAM_READING.map((book) => (
              <li
                key={book.title}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm"
              >
                <span
                  className="font-semibold text-[var(--navy)]"
                  dangerouslySetInnerHTML={{ __html: book.title }}
                />
                {' — '}
                <span
                  className="text-[var(--muted)]"
                  dangerouslySetInnerHTML={{ __html: book.note }}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="exam-day">Exam day tips</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {WRITTEN_EXAM_TIPS.map((tip) => (
              <li key={tip} dangerouslySetInnerHTML={{ __html: tip }} />
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="pitfalls">Common pitfalls</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {WRITTEN_EXAM_PITFALLS.map((p) => (
              <li key={p} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="after">After you pass</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {WRITTEN_EXAM_AFTER.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="faqs">FAQs</GuideSectionHeading>
          <GuideFaqs faqs={WRITTEN_EXAM_FAQS} />
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="related">Related guides</GuideSectionHeading>
          <GuideRelated links={WRITTEN_EXAM_RELATED} />
        </section>
      </StructuredGuideShell>
    </>
  );
}
