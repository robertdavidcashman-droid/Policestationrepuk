import { PsrTrainPromo } from '@/components/PsrTrainPromo';
import {
  GuideHero,
  GuideRelated,
  GuideSectionHeading,
  GuideToc,
  StructuredGuideShell,
} from '@/components/StructuredGuideLayout';
import { buildMetadata } from '@/lib/seo';
import {
  CIT_ON_THIS_PAGE,
  CIT_PITFALLS,
  CIT_RELATED,
  CIT_TIPS,
  CIT_TOPICS,
} from '@/lib/guide-prepare-for-cit';

export const metadata = buildMetadata({
  title: 'How to Prepare for the CIT — PSRAS Critical Incidents Test',
  description:
    'Prepare for the PSRAS Critical Incidents Test (CIT): format, PACE Code C topics, vulnerable suspects, s.34 adverse inference, Code D identification, and common pitfalls.',
  path: '/PrepareForCIT',
});

export default function PrepareForCITPage() {
  return (
    <>
      <GuideHero
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Resources', href: '/Resources' },
          { label: 'Prepare for CIT' },
        ]}
        title="How to Prepare for the Critical Incidents Test (CIT)"
        description="The final PSRAS assessment — simulated consultation and interview scenarios testing PACE knowledge, ethics, and practical decision-making."
      />
      <StructuredGuideShell
        sourcesContext={{ kind: 'page', path: '/PrepareForCIT' }}
        promo={<PsrTrainPromo className="mb-10" />}
      >
        <GuideToc items={CIT_ON_THIS_PAGE} />

        <section className="mb-12">
          <GuideSectionHeading id="what">What is the CIT?</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            The Critical Incidents Test is the final examination in PSRAS accreditation. After your
            portfolio is signed off, you face recorded simulated scenarios — typically a private
            consultation with an actor playing the suspect, then a simulated police interview. Assessors
            mark against the published competency framework (consultation, advice on silence and adverse
            inference, interview interventions, professional conduct). Check your assessment
            organisation (Cardiff University or Datalaw) for current format and pass rules.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="format">Assessment format</GuideSectionHeading>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Duration', value: 'One day — multiple scenarios (often 2–3)' },
              { label: 'Format', value: 'Disclosure pack → consultation → interview simulation' },
              { label: 'Pass standard', value: 'Competence-based; scenario-by-scenario assessment' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{item.label}</p>
                <p className="mt-2 text-sm text-[var(--navy)]">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="topics">High-yield study topics</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            You must know these areas without relying on looking everything up under time pressure:
          </p>
          <div className="mt-6 space-y-4">
            {CIT_TOPICS.map((topic) => (
              <div
                key={topic.title}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h3 className="font-bold text-[var(--navy)]">{topic.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{topic.body}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">Source: {topic.source}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="resources">Official study resources</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            <li>
              <a href="https://www.gov.uk/guidance/police-and-criminal-evidence-act-1984-pace-codes-of-practice" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--navy)] underline">
                PACE Codes A–H (gov.uk)
              </a>{' '}
              — especially Code C and Code D
            </li>
            <li>
              <a href="https://www.legislation.gov.uk/ukpga/1994/33/section/34" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--navy)] underline">
                CJPOA 1994 s.34
              </a>{' '}
              and{' '}
              <a href="https://www.cps.gov.uk/legal-guidance/adverse-inferences" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--navy)] underline">
                CPS adverse inferences guidance
              </a>
            </li>
            <li>
              <a href="https://www.sra.org.uk/solicitors/resources/specific-areas-of-practice/police-station-representative-accreditation-scheme/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--navy)] underline">
                SRA PSRAS page
              </a>{' '}
              — scheme overview and assessment organisations
            </li>
            <li>Your Cardiff or Datalaw candidate handbook — competency framework and portfolio requirements</li>
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="tips">Exam day tips</GuideSectionHeading>
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
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="related">Related guides</GuideSectionHeading>
          <GuideRelated links={CIT_RELATED} />
        </section>
      </StructuredGuideShell>
    </>
  );
}
