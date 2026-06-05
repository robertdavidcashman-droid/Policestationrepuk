import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ResolvedContentSources } from '@/components/ContentSourcesFooter';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, breadcrumbSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'FAQ — Police Station Representation Questions Answered',
  description:
    'Common questions about police station representation, how to register as a rep, our free directory, and more — answered by PoliceStationRepUK.',
  path: '/FAQ',
});

const FAQS = [
  {
    q: 'What is a Police Station Representative?',
    a: 'A police station representative (or "rep") is an accredited legal professional who attends police stations on behalf of criminal defence solicitor firms to advise and assist suspects during police interviews. Reps are accredited through the Police Station Representatives Accreditation Scheme (PSRAS) and appear on the LAA Police Station Register; they work under the supervision of an SRA-regulated firm holding a Standard Crime Contract — they are not solicitors and are not directly regulated by the SRA in the same way.',
  },
  {
    q: 'What qualifications do I need to become a rep?',
    a: 'To become an accredited police station representative you typically need to: (1) secure a Standard Crime Contract firm willing to supervise you, (2) enrol with an approved assessment organisation (Cardiff or Datalaw) — no law degree is required, (3) pass the written stage and build a supervised portfolio, (4) pass the Critical Incidents Test (CIT), and (5) be added to the Police Station Register via ADMIN 2. The Police Station Qualification (PSQ) is for duty solicitors, not reps. See our full guide for step-by-step guidance.',
  },
  {
    q: 'What personal characteristics do I need to succeed?',
    a: 'Successful police station reps tend to be calm under pressure, excellent communicators, and highly organised. You will often be called out at short notice (including nights and weekends), so reliability and flexibility are essential. Attention to detail and a thorough knowledge of PACE and the Codes of Practice are critical.',
  },
  {
    q: 'How can I get work as a freelance rep?',
    a: 'The most effective routes to freelance work are: (1) registering on PoliceStationRepUK so firms can find you instantly, (2) joining our WhatsApp group where firms post urgent cover requests, (3) networking directly with criminal defence firms in your area, and (4) building relationships with firms that receive DSCC duty allocations (reps attend on a firm\'s instruction — they cannot be on the duty solicitor rota themselves). See our Get Work guide for a full strategy.',
  },
  {
    q: 'Is there a fee to register on this directory?',
    a: "No — registration is completely free. There are no subscriptions, no hidden costs, and no commission on the work you receive. Creating and maintaining your profile on PoliceStationRepUK will always be free.",
  },
  {
    q: 'How does the WhatsApp group work?',
    a: "Our WhatsApp group is restricted to accredited police station representatives only. To join, you must provide proof of **PSRAS accreditation** (Police Station Register status via an SCC firm — probationary or accredited) or other verification listed on the Join page. Once verified, you'll receive urgent cover requests from solicitor firms posted in real time. Join via the WhatsApp page.",
  },
  {
    q: "Who operates PoliceStationRepUK?",
    a: "PoliceStationRepUK is operated by Defence Legal Services Ltd, an independent directory service. We are not affiliated with The Law Society, SRA, LCCSA, CLSA, the Legal Ombudsman, any UK police force, or any government body. We cannot provide legal advice or access case management systems.",
  },
  {
    q: 'What is a Featured Listing?',
    a: 'A Featured Listing gives your profile priority placement at the top of all search results, making you more visible to solicitor firms seeking cover. Featured listings are available for a small annual fee. See the Go Featured page for current pricing and availability.',
  },
];

const QUICK_LINKS = [
  { href: '/HowToBecomePoliceStationRep', label: 'How to Become a Rep' },
  { href: '/GetWork', label: 'Get Work as a Rep' },
  { href: '/directory', label: 'Reps Directory' },
  { href: '/FormsLibrary', label: 'Forms Library' },
  { href: '/StationsDirectory', label: 'Station Contacts' },
  { href: '/Resources', label: 'Training & Resources' },
];

function faqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
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
        {FAQS.map((faq) => (
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
          {QUICK_LINKS.map((link) => (
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
          Need a solicitor at the police station?{' '}
          <a href="https://www.policestationagent.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--gold-link)] underline">
            Visit policestationagent.com
          </a>
        </p>
      </div>

      <ResolvedContentSources className="mt-10" context={{ kind: 'page', path: '/FAQ' }} />
      </div>
    </>
  );
}
