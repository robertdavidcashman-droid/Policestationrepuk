import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CrawlContent } from '@/components/CrawlContent';
import { PsrTrainPromo } from '@/components/PsrTrainPromo';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Prepare for the CIT Exam — Critical Incidents Test Guide',
  description: 'Everything you need to know about the Critical Incidents Test (CIT) for police station representatives. Exam format, preparation tips, common scenarios, and how to pass first time through PSRAS.',
  path: '/PrepareForCIT',
});

export default function PrepareForCITPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-12 sm:py-16">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Prepareforcit' },
            ]}
          />
          <h1 className="mt-4 text-h1 text-white">How to Prepare for the CIT Exam</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white">
            Everything you need to know about the Critical Incidents Test and how to prepare effectively for this crucial PSRAS examination.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl">
          <CrawlContent slug="PrepareForCIT" />

          <PsrTrainPromo variant="hero" campaign="prepare_for_cit" className="mt-10" />

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
