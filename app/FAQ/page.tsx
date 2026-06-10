import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ResolvedContentSources } from '@/components/ContentSourcesFooter';
import { PoliceStationAgentKentCta } from '@/components/PoliceStationAgentKentCta';
import { JsonLd } from '@/components/JsonLd';
import { FAQ_PAGE_FAQS, FAQ_PAGE_QUICK_LINKS } from '@/lib/faq-page';
import { buildMetadata, breadcrumbSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'FAQ — Police Station Representation Questions Answered',
  description:
    'Common questions about police station representation, how to register as a rep, our free directory, and more — answered by PoliceStationRepUK.',
  path: '/FAQ',
});

function faqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_PAGE_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}

export default function FAQPage() {
  return (
    <>
      <JsonLd data={faqSchema()} />
      <JsonLd data={breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'FAQ', url: '/FAQ' }])} />
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'FAQ', href: '/FAQ' },
            ]}
            light
          />
          <header>
            <h1 className="text-h1 text-white">Frequently Asked Questions</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white">
              Find answers to the most common questions about police station representation,
              registration, and our directory.
            </p>
            <p className="mt-3 text-sm text-white">
              Directory Information: We verify registration details when reps join. Listings are not
              endorsements. For inaccuracies, contact us at{' '}
              <a
                href="mailto:robertcashman@defencelegalservices.co.uk"
                className="text-[var(--gold-link)] hover:underline"
              >
                robertcashman@defencelegalservices.co.uk
              </a>
              .
            </p>
          </header>
        </div>
      </section>

      <div className="page-container">
      <ContentReliabilityNotice className="mb-8" />

      <div className="mb-12 space-y-4">
        {FAQ_PAGE_FAQS.map((faq) => (
          <details
            key={faq.q}
            className="group rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)] open:shadow-[var(--card-shadow-hover)]"
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 text-sm font-semibold text-[var(--foreground)] marker:hidden hover:text-[var(--gold-hover)]">
              <span>{faq.q}</span>
              <span className="mt-0.5 shrink-0 text-[var(--muted)] transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="border-t border-[var(--border)] px-6 pb-5 pt-4">
              <p className="text-sm leading-relaxed text-[var(--muted)]">{faq.a}</p>
            </div>
          </details>
        ))}
      </div>

      {/* Quick links */}
      <section className="border-t border-[var(--border)] pt-10">
        <h2 className="text-h2 mb-6 text-[var(--navy)]">Explore More</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FAQ_PAGE_QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] px-5 py-4 text-sm font-medium text-[var(--foreground)] no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:text-[var(--gold-hover)] hover:shadow-[var(--card-shadow-hover)]"
            >
              {link.label} →
            </Link>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <div className="mt-10 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center shadow-[var(--card-shadow)]">
        <p className="text-sm text-[var(--muted)]">
          Still have questions?{' '}
          <Link href="/Contact" className="font-medium text-[var(--gold-link)] hover:underline">
            Get in touch with us
          </Link>{' '}
          and we&apos;ll respond within 24 hours.
        </p>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Need a solicitor at the police station? Ask for the duty solicitor or contact a criminal defence firm in your
          area — this directory does not provide regulated legal advice.
        </p>
        <PoliceStationAgentKentCta
          className="mt-2 text-sm text-[var(--muted)]"
          placement="faq_page"
        />
      </div>

      <ResolvedContentSources className="mt-10" context={{ kind: 'page', path: '/FAQ' }} />
      </div>
    </>
  );
}
