import Link from 'next/link';
import { AssistantChat } from '@/components/AssistantChat';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, breadcrumbSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'AI Assistant — Site & Career Help',
  description:
    'Ask the PoliceStationRepUK AI assistant about directory registration, station numbers, PSRAS guides, Custody Note, and published FAQs. General information only, not legal advice.',
  path: '/ai-assistant',
});

export default function AiAssistantPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'AI Assistant', url: '/ai-assistant' },
        ])}
      />
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'AI Assistant' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">AI assistant</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            Chat with our hybrid AI assistant for help with the directory, registration, station phone
            numbers, PSRAS career routes, Custody Note software, and how this site works. Answers draw on
            published guides — not legal advice. For custody emergencies, instruct a criminal defence
            solicitor.
          </p>
        </div>
      </section>

      <div className="page-container pb-12 pt-8">
        <ContentReliabilityNotice className="mb-6" />
        <div className="mx-auto flex max-w-2xl min-h-[28rem] flex-col rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:min-h-[32rem] sm:p-8">
          <AssistantChat className="min-h-[24rem] flex-1" />
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-[var(--muted)]">
          Prefer the floating bubble? Use <strong>Ask AI</strong> in the header or at the bottom right on
          any page. Still stuck?{' '}
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
