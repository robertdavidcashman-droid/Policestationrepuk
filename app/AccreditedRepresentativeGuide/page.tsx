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
  ACCREDITED_FAQS,
  ACCREDITED_ON_THIS_PAGE,
  ACCREDITED_RELATED,
} from '@/lib/guide-accredited-representative';

export const metadata = buildMetadata({
  title: 'Accredited Representative Guide | How to Get Accredited',
  description:
    'What PSRAS accreditation means: assessment organisations, Police Station Register, probationary vs fully accredited status, and ongoing LAA requirements.',
  path: '/AccreditedRepresentativeGuide',
});

export default function AccreditedRepresentativeGuidePage() {
  return (
    <>
      <GuideHero
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'For Reps', href: '/RepsHub' },
          { label: 'Accredited Representative Guide' },
        ]}
        title="Accredited Police Station Representative — Guide"
        description="What accreditation means under PSRAS, how the Police Station Register works, and the difference between probationary and fully accredited status."
      />
      <StructuredGuideShell sourcesContext={{ kind: 'page', path: '/AccreditedRepresentativeGuide' }}>
        <GuideToc items={ACCREDITED_ON_THIS_PAGE} />

        <section className="mb-12">
          <GuideSectionHeading id="what">What is an accredited representative?</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            An accredited police station representative is a non-solicitor qualified under PSRAS to
            advise suspects at custody under PACE. Accreditation is competence-based — written
            assessment, supervised portfolio, and the Critical Incidents Test — not a law degree.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="psrass">PSRAS and assessment organisations</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            The scheme is authorised by the{' '}
            <a
              href="https://www.sra.org.uk/solicitors/resources/specific-areas-of-practice/police-station-representative-accreditation-scheme/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--navy)] underline"
            >
              Solicitors Regulation Authority
            </a>
            . Cardiff University and Datalaw run assessments. Enrol through your supervising firm&apos;s
            chosen provider. See the{' '}
            <Link href="/HowToBecomePoliceStationRep" className="font-semibold text-[var(--navy)] underline">
              full 2026 route guide
            </Link>{' '}
            for each stage.
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="register">Police Station Register</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            The Legal Aid Agency maintains the register via the Defence Solicitor Call Centre (DSCC).
            After passing the written test, firms submit ADMIN 2 to add you as probationary. After
            portfolio and CIT, you become fully accredited. DSCC forms and engaged requirements:{' '}
            <Link href="/DSCCRegistrationGuide" className="font-semibold text-[var(--navy)] underline">
              DSCC registration guide
            </Link>
            .
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="probationary">Probationary vs fully accredited</GuideSectionHeading>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="font-bold text-[var(--navy)]">Probationary</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                On the register after written test. Must work under direct supervision. Cannot
                freelance independently. Building Part A/B portfolio.
              </p>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <h3 className="font-bold text-[var(--navy)]">Fully accredited</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                After CIT pass. Can cover for firms with reduced supervision subject to contract
                rules. Freelance rota work is common.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="ongoing">Ongoing requirements</GuideSectionHeading>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            You remain on the register while engaged by an SCC firm and meeting contract and DSCC
            notification rules. Firms must keep register data accurate. Verify current requirements
            in the{' '}
            <a
              href="https://www.gov.uk/government/publications/standard-crime-contract-2025"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--navy)] underline"
            >
              Standard Crime Contract 2025
            </a>{' '}
            and{' '}
            <a
              href="https://www.gov.uk/guidance/police-station-representatives-and-duty-solicitors"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--navy)] underline"
            >
              PSRAS / register guidance
            </a>
            .
          </p>
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="faqs">Frequently asked questions</GuideSectionHeading>
          <GuideFaqs faqs={ACCREDITED_FAQS} />
        </section>

        <section className="mb-12">
          <GuideSectionHeading id="related">Related guides</GuideSectionHeading>
          <GuideRelated links={ACCREDITED_RELATED} />
        </section>
      </StructuredGuideShell>
    </>
  );
}
