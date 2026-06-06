import Link from 'next/link';
import { AssistantChat } from '@/components/AssistantChat';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, breadcrumbSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Guided Assistant — Site & Career Help',
  description:
    'Ask questions about PoliceStationRepUK — directory registration, station numbers, WhatsApp, PSRAS guides, and published FAQs. General information only, not legal advice.',
  path: '/guided-assistant',
});

export default function GuidedAssistantPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Guided Assistant', url: '/guided-assistant' },
        ])}
      />
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Guided Assistant' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Guided assistant</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            Search our published FAQs and guides for help with the directory, registration, station numbers,
            WhatsApp, and PSRAS career topics. This is not legal advice — for custody emergencies, instruct a
            criminal defence solicitor.
          </p>
        </div>
      </section>

      <div className="page-container pb-12 pt-8">
        <ContentReliabilityNotice className="mb-6" />
        <div className="mx-auto max-w-2xl rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
          <AssistantChat />
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-[var(--muted)]">
          Still stuck?{' '}
          <Link href="/Contact" className="font-semibold text-[var(--gold-link)] hover:underline">
            Contact us
          </Link>{' '}
          or browse the{' '}
          <Link href="/FAQ" className="font-semibold text-[var(--gold-link)] hover:underline">
            FAQ
          </Link>
          .
        </p>
      </div>
    </>
  );
}
