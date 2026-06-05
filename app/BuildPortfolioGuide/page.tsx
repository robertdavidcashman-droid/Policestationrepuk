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
  PORTFOLIO_BREADTH_MATRIX,
  PORTFOLIO_CASE_SECTIONS,
  PORTFOLIO_CASE_TABLE,
  PORTFOLIO_CHECKLIST,
  PORTFOLIO_COMPETENCE_MAP,
  PORTFOLIO_DEADLINES,
  PORTFOLIO_FAIL_PATTERNS,
  PORTFOLIO_FAQS,
  PORTFOLIO_JOURNEY_STEPS,
  PORTFOLIO_MISTAKES,
  PORTFOLIO_ON_THIS_PAGE,
  PORTFOLIO_PROBATIONARY_RULES,
  PORTFOLIO_PROVIDER_NOTES,
  PORTFOLIO_RELATED,
  PORTFOLIO_SUBMISSION_STEPS,
  PORTFOLIO_TIPS,
} from '@/lib/guide-build-portfolio';

export const metadata = buildMetadata({
  title: 'PSRAS Portfolio Guide — Part A & Part B (9 Cases)',
  description:
    'Complete PSRAS portfolio guide: nine case studies (2+2+5), probationary deadlines, SRA competence mapping, case report structure, submission workflow, and assessor fail patterns — sourced from PSRA 2025 and Datalaw.',
  path: '/BuildPortfolioGuide',
});

export default function BuildPortfolioGuidePage() {
  return (
    <>
      <GuideHero
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Resources', href: '/Resources' },
          { label: 'PSRAS Portfolio Guide' },
        ]}
        title="PSRAS Portfolio Guide — Part A &amp; Part B"
        description="How to build and submit your nine-case PSRAS portfolio: official requirements, case reports, breadth, deadlines, and what assessors actually mark — verified against PSRA 2025 and assessment organisation guidance."
        updated="5 June 2026"
      />
      <StructuredGuideShell sourcesContext={{ kind: 'page', path: '/BuildPortfolioGuide' }}>
        <div className="mb-10 rounded-[var(--radius-lg)] border border-amber-300 bg-amber-50 p-6">
          <h2 className="text-base font-bold text-amber-900">Verify with your assessment organisation</h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-900">
            Case counts and deadlines below are verified against the Police Station Register Arrangements
            2025 and Datalaw&apos;s published portfolio guide. Cardiff University may differ on templates
            and submission dates — always use your current candidate handbook.
          </p>
        </div>

        <GuideToc items={PORTFOLIO_ON_THIS_PAGE} />

        <section className="mb-12">
          <GuideSectionHeading id="journey">Where the portfolio sits in PSRAS</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            The portfolio is the supervised competence evidence between the{' '}
            <Link href="/PrepareForWrittenExam" className="font-semibold text-[var(--navy)] underline">
              written examination
            </Link>{' '}
            and the{' '}
            <Link href="/PrepareForCIT" className="font-semibold text-[var(--navy)] underline">
              Critical Incidents Test (CIT)
            </Link>
            . It is assessed by Cardiff University or Datalaw against the{' '}
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
          <ol className="mt-6 space-y-4">
            {PORTFOLIO_JOURNEY_STEPS.map((step) => (
              <li
                key={step.n}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--gold)]">
                  Step {step.n}
                </p>
                <h3 className="mt-1 font-bold text-[var(--navy)]">{step.title}</h3>
                <p
                  className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                  dangerouslySetInnerHTML={{ __html: step.body }}
                />
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="requirements">Official case requirements</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            The portfolio contains{' '}
            <strong className="text-[var(--navy)]">nine detailed case studies</strong>, each involving
            advice and attendance at a police interview (Datalaw). This replaces older informal
            guidance referring to &quot;6 + 10 attendances&quot; — those numbers are not in PSRA 2025 or
            Datalaw&apos;s published requirements.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-slate-50 text-left">
                  <th className="p-3 font-bold text-[var(--navy)]">Part</th>
                  <th className="p-3 font-bold text-[var(--navy)]">Cases</th>
                  <th className="p-3 font-bold text-[var(--navy)]">Your role</th>
                  <th className="p-3 font-bold text-[var(--navy)]">Supervision</th>
                </tr>
              </thead>
              <tbody>
                {PORTFOLIO_CASE_TABLE.map((row) => (
                  <tr key={row.part} className="border-b border-[var(--card-border)]">
                    <td className="p-3 font-medium text-[var(--navy)]">{row.part}</td>
                    <td className="p-3 text-[var(--muted)]">{row.cases}</td>
                    <td className="p-3 text-[var(--muted)]">{row.role}</td>
                    <td className="p-3 text-[var(--muted)]">{row.supervision}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {PORTFOLIO_PROVIDER_NOTES.map((note) => (
              <div
                key={note.provider}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h3 className="font-bold text-[var(--navy)]">{note.provider}</h3>
                <p
                  className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                  dangerouslySetInnerHTML={{ __html: note.notes }}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="probationary">Probationary rules while building the portfolio</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {PORTFOLIO_PROBATIONARY_RULES.map((rule) => (
              <li key={rule} dangerouslySetInnerHTML={{ __html: rule }} />
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="deadlines">Deadlines and PIN suspension</GuideSectionHeading>
          <div className="mt-6 space-y-4">
            {PORTFOLIO_DEADLINES.map((d) => (
              <div
                key={d.title}
                className="rounded-[var(--radius)] border-l-4 border-[var(--gold)] bg-slate-50 p-5"
              >
                <h3 className="font-bold text-[var(--navy)]">{d.title}</h3>
                <p
                  className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                  dangerouslySetInnerHTML={{ __html: d.body }}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="competence">SRA competence mapping</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Each case report should demonstrate the{' '}
            <a
              href="https://www.sra.org.uk/solicitors/resources/specific-areas-of-practice/standards/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--navy)] underline"
            >
              SRA assessment outcomes
            </a>
            . Map your sections as follows:
          </p>
          <div className="mt-6 space-y-3">
            {PORTFOLIO_COMPETENCE_MAP.map((row) => (
              <div
                key={row.outcome}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)]"
              >
                <p className="text-xs font-bold uppercase text-[var(--gold)]">{row.outcome}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--navy)]">{row.portfolioSection}</p>
                <p
                  className="mt-1 text-sm text-[var(--muted)]"
                  dangerouslySetInnerHTML={{ __html: row.body }}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="case-report">Case report blueprint</GuideSectionHeading>
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
                <p className="mt-2 text-xs italic text-[var(--muted)]">
                  Assessor focus: <span dangerouslySetInnerHTML={{ __html: s.assessor }} />
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="breadth">Breadth matrix (spread across 9 cases)</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Datalaw requires a good range of issues and offences across the portfolio — not nine
            identical shop-theft files. Plan breadth from case one:
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {PORTFOLIO_BREADTH_MATRIX.map((row) => (
              <li
                key={row.category}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm"
              >
                <span className="font-semibold text-[var(--navy)]">{row.category}:</span>{' '}
                <span className="text-[var(--muted)]">{row.examples}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="supervision">Supervisor feedback</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Part A Stage 2 requires signed written feedback from your supervising solicitor (Datalaw
            — upload as PDF for cases 3 and 4). Part B feedback sessions are recommended even when
            not mandatory in the submission. Supervisors must meet PSRA Crime Category Supervisor
            standards — see our{' '}
            <Link href="/FindSupervisingSolicitor" className="font-semibold text-[var(--navy)] underline">
              Find a Supervising Solicitor
            </Link>{' '}
            guide.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="submission">Submission workflow</GuideSectionHeading>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {PORTFOLIO_SUBMISSION_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="fail-patterns">Common fail patterns (assessor board)</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {PORTFOLIO_FAIL_PATTERNS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="checklist">Self-assessment checklist</GuideSectionHeading>
          <ul className="mt-4 space-y-2">
            {PORTFOLIO_CHECKLIST.map((item) => (
              <li
                key={item}
                className="flex gap-2 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 text-sm text-[var(--muted)]"
              >
                <span className="text-[var(--gold)]" aria-hidden>
                  ☐
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="tips">Tips for success</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {PORTFOLIO_TIPS.map((tip) => (
              <li key={tip} dangerouslySetInnerHTML={{ __html: tip }} />
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="mistakes">Common mistakes to avoid</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            {PORTFOLIO_MISTAKES.map((m) => (
              <li key={m} dangerouslySetInnerHTML={{ __html: m }} />
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="faqs">FAQs</GuideSectionHeading>
          <GuideFaqs faqs={PORTFOLIO_FAQS} />
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="related">Related guides</GuideSectionHeading>
          <GuideRelated links={PORTFOLIO_RELATED} />
        </section>
      </StructuredGuideShell>
    </>
  );
}
