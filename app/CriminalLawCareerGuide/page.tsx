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
  CAREER_DO,
  CAREER_DONT,
  CAREER_FAQS,
  CAREER_ON_THIS_PAGE,
  CAREER_RELATED,
  CAREER_ROUTES,
} from '@/lib/guide-criminal-law-career';

export const metadata = buildMetadata({
  title: 'How to Get Into Criminal Law in England & Wales',
  description:
    'Career guide to criminal law: SQE, solicitor apprenticeships (England), CILEX, PSRAS police station route, legal aid context, and practical job-search advice.',
  path: '/CriminalLawCareerGuide',
});

export default function CriminalLawCareerGuidePage() {
  return (
    <>
      <GuideHero
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Resources', href: '/Resources' },
          { label: 'Criminal Law Career Guide' },
        ]}
        title="How to Get Into Criminal Law in England & Wales"
        description="Qualification routes, legal aid context, and practical steps for criminal solicitors, fee-earners, and police station representatives — general information only."
      />
      <StructuredGuideShell sourcesContext={{ kind: 'page', path: '/CriminalLawCareerGuide' }}>
        <GuideToc items={CAREER_ON_THIS_PAGE} />

        <section className="mb-12">
          <GuideSectionHeading id="who-for">Who this guide is for</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Students, graduates, career changers, and paralegals exploring criminal defence. For
            the dedicated police station rep route, see{' '}
            <Link href="/HowToBecomePoliceStationRep" className="font-semibold text-[var(--navy)] underline">
              PSRAS accreditation guide
            </Link>
            .
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="work">What criminal lawyers do</GuideSectionHeading>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            <li>
              <strong className="text-[var(--navy)]">Police station</strong> — advise suspects in
              custody, disclosure, interview (often nights and weekends)
            </li>
            <li>
              <strong className="text-[var(--navy)]">Magistrates&apos; and Crown Court</strong> — bail,
              pleas, trials, sentencing (solicitors and barristers)
            </li>
            <li>
              <strong className="text-[var(--navy)]">Case preparation</strong> — evidence review, client
              care, CPS liaison, experts
            </li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
            Solicitors manage cases end-to-end; barristers are specialist advocates usually instructed
            for Crown Court trials. This guide focuses on solicitor and fee-earner routes.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="legal-aid">Legal aid context</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Most criminal defence in England and Wales is publicly funded through the{' '}
            <a
              href="https://www.gov.uk/topic/legal-aid-for-providers/crime"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--navy)] underline"
            >
              Legal Aid Agency criminal scheme
            </a>
            . Expect demanding hours and modest pay compared with commercial law — but work centred
            on liberty and fair process.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="routes">Qualification routes</GuideSectionHeading>
          <div className="mt-6 space-y-4">
            {CAREER_ROUTES.map((route) => (
              <div
                key={route.title}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h3 className="font-bold text-[var(--navy)]">{route.title}</h3>
                <p
                  className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                  dangerouslySetInnerHTML={{ __html: route.body }}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="psrass">Police station rep route (PSRAS)</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            PSRAS is a competence-based route into criminal defence at the police station — often
            12–18 months with firm sponsorship. No law degree required. Does not qualify you for
            court. Many use it as a specialist career or stepping stone.{' '}
            <Link href="/HowToBecomePoliceStationRep" className="font-semibold text-[var(--navy)] underline">
              Full PSRAS guide →
            </Link>
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="experience">Gaining experience</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Firms prioritise candidates with real exposure: paralegal roles, court visits, volunteering
            at law centres, police station shadowing, and client-facing work history. Qualifications
            open doors; experience gets offers.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="do-dont">Do and don&apos;t</GuideSectionHeading>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-[var(--radius)] border border-green-200 bg-green-50/50 p-5">
              <h3 className="font-bold text-green-900">Do</h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-green-900/90">
                {CAREER_DO.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[var(--radius)] border border-red-200 bg-red-50/50 p-5">
              <h3 className="font-bold text-red-900">Don&apos;t</h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-red-900/90">
                {CAREER_DONT.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="faqs">Frequently asked questions</GuideSectionHeading>
          <GuideFaqs faqs={CAREER_FAQS} />
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="related">Related guides</GuideSectionHeading>
          <GuideRelated links={CAREER_RELATED} />
        </section>
      </StructuredGuideShell>
    </>
  );
}
