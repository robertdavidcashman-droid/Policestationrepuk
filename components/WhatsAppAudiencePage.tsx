import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CommunityEligibilityCallout } from '@/components/CommunityEligibilityCallout';
import { JsonLd } from '@/components/JsonLd';
import { FORUM_PATH } from '@/lib/community-messaging';
import {
  WHATSAPP_AUDIENCE_LIST,
  WHATSAPP_AUDIENCE_PAGES,
  WHATSAPP_JOIN_PHONE,
  type WhatsAppAudienceId,
} from '@/lib/whatsapp-audience';
import { SITE_URL } from '@/lib/seo-layer/config';
import { breadcrumbSchema, faqPageSchema } from '@/lib/seo';

export function WhatsAppAudiencePage({ audienceId }: { audienceId: WhatsAppAudienceId }) {
  const page = WHATSAPP_AUDIENCE_PAGES[audienceId];
  const others = WHATSAPP_AUDIENCE_LIST.filter((a) => a.id !== audienceId);

  const faqs = [
    {
      q: `Who is the WhatsApp group for ${page.shortLabel.toLowerCase()}?`,
      a: page.intro,
    },
    {
      q: 'Is it free to join?',
      a: 'Yes. There is no charge to join or use the group. PoliceStationRepUK provides it as a free resource for the criminal defence community.',
    },
    {
      q: 'How do I join?',
      a: `Text ${WHATSAPP_JOIN_PHONE} on WhatsApp or use the join button on this page. ${page.joinSteps[0]}`,
    },
  ];

  const bc = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'WhatsApp Group', url: '/WhatsApp' },
    { name: page.label, url: page.path },
  ]);

  return (
    <>
      <JsonLd data={bc} />
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: page.seoTitle,
          description: page.seoDescription,
          url: `${SITE_URL}${page.path}`,
          inLanguage: 'en-GB',
          isPartOf: { '@type': 'WebSite', name: 'PoliceStationRepUK', url: SITE_URL },
        }}
      />

      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'WhatsApp Group', href: '/WhatsApp' },
              { label: page.label },
            ]}
          />
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
            Free professional group
          </p>
          <h1 className="mt-2 text-h1 text-white">{page.headline}</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">{page.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={page.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold inline-flex min-h-[48px] items-center justify-center px-6 no-underline"
            >
              {page.cta}
            </a>
            <Link
              href="/WhatsApp"
              className="inline-flex min-h-[48px] items-center rounded-lg border border-white/30 bg-white/10 px-5 text-sm font-semibold text-white no-underline hover:bg-white/20"
            >
              Overview for all audiences
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Or text <strong className="text-white">{WHATSAPP_JOIN_PHONE}</strong>
          </p>
        </div>
      </section>

      <div className="page-container section-pad">
        <nav
          className="mb-10 flex flex-wrap gap-2"
          aria-label="Join WhatsApp by role"
        >
          {WHATSAPP_AUDIENCE_LIST.map((a) => (
            <Link
              key={a.id}
              href={a.path}
              aria-current={a.id === audienceId ? 'page' : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold no-underline transition-colors ${
                a.id === audienceId
                  ? 'bg-[var(--navy)] text-white'
                  : 'border border-[var(--border)] bg-white text-[var(--navy)] hover:border-[var(--gold)]'
              }`}
            >
              {a.label}
            </Link>
          ))}
        </nav>

        <section className="mb-12 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8">
          <h2 className="text-h2 text-[var(--navy)]">Why join</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--muted)]">
            {page.benefits.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="shrink-0 text-[var(--gold)]" aria-hidden>
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12 rounded-[var(--radius-lg)] bg-[var(--navy)] p-6 sm:p-8">
          <h2 className="text-h2 text-white">How to join — 3 steps</h2>
          <ol className="mx-auto mt-6 max-w-xl space-y-5">
            {page.joinSteps.map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-sm font-bold text-[var(--navy)]">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-slate-300">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <a
              href={page.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold inline-block no-underline"
            >
              {page.cta}
            </a>
          </div>
        </section>

        {audienceId === 'reps' && (
          <div className="mb-12">
            <CommunityEligibilityCallout />
          </div>
        )}

        {'forumAlternative' in page && page.forumAlternative && audienceId === 'reps' && (
          <p className="mb-12 text-sm leading-relaxed text-[var(--muted)]">
            {page.forumAlternative}{' '}
            <Link href={FORUM_PATH} className="font-semibold text-[var(--navy)] underline">
              Community forum
            </Link>
            .
          </p>
        )}

        {others.length > 0 && (
          <section className="mb-12">
            <h2 className="text-h2 text-[var(--navy)]">Joining as someone else?</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {others.map((a) => (
                <Link
                  key={a.id}
                  href={a.path}
                  className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40"
                >
                  <p className="font-semibold text-[var(--navy)]">{a.label}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{a.shortLabel}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-h2 text-[var(--navy)]">Related resources</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {page.related.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 text-sm font-medium text-[var(--navy)] no-underline hover:border-[var(--gold)]/40"
              >
                {link.label} →
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
