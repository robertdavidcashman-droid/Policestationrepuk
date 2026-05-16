import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CrawlContent } from '@/components/CrawlContent';
import { PsrTrainPromo } from '@/components/PsrTrainPromo';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'How to Become a Police Station Rep — PSRAS Guide',
  description:
    'Complete guide to becoming an accredited police station representative through the PSRAS scheme. Covers training, costs, the Critical Incident Test (CIT), and career paths.',
  path: '/HowToBecomePoliceStationRep',
});

export default function HowToBecomePage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-12 sm:py-16">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'How to Become a Police Station Rep', href: '/HowToBecomePoliceStationRep' },
            ]}
          />
          <h1 className="mt-4 text-h1 text-white">
            How to Become a Police Station Representative
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white">
            A complete guide to the Police Station Representatives Accreditation Scheme (PSRAS) —
            from enrolment to passing the Critical Incident Test and starting your career.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl">
          <CrawlContent slug="HowToBecomePoliceStationRep" />

          <PsrTrainPromo variant="hero" campaign="how_to_become" className="mt-10" />

          <section className="mt-10 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need Help?</h2>
            <p className="mt-3 text-white">
              Find an accredited police station representative or get in touch.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">Find a Rep</Link>
              <Link href="/Contact" className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] no-underline">Contact Us</Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
