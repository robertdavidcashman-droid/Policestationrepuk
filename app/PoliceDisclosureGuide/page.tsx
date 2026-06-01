import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CrawlContent } from '@/components/CrawlContent';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { CustodyNotePagePromo } from '@/components/CustodyNotePagePromo';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Police Disclosure Guide | PoliceStationRepUK',
  description: 'What is disclosure at the police station? Understanding your rights and how representatives use disclosure to protect your interests.',
  path: '/PoliceDisclosureGuide',
});

export default function PoliceDisclosureGuidePage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-12 sm:py-16">
        <div className="page-container !py-0">
          <Breadcrumbs light items={[{ label: 'Home', href: '/' }, { label: 'Police Disclosure Guide' }]} />
          <h1 className="mt-4 text-h1 text-white">Police Disclosure Explained</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">What is disclosure at the police station? Understanding your rights and how representatives use disclosure to protect your interests.</p>
        </div>
      </section>
      <div className="page-container">
        <div className="mx-auto max-w-4xl">
          <ContentReliabilityNotice className="mb-8" />
          <CrawlContent slug="PoliceDisclosureGuide" />
          <CustodyNotePagePromo variant="compact" className="mt-10" />
          <section className="mt-10 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need Help?</h2>
            <p className="mt-3 text-slate-300">Find an accredited police station representative or get in touch.</p>
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
