import type { ReactNode } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbSchema, faqPageSchema } from '@/lib/seo';

export function PillarSeoLayout({
  title,
  breadcrumbItems,
  quickAnswer,
  faqs,
  children,
}: {
  title: string;
  breadcrumbItems: { name: string; url: string }[];
  quickAnswer: string;
  faqs: { q: string; a: string }[];
  children: ReactNode;
}) {
  return (
    <>
      <JsonLd data={faqPageSchema(faqs)} />
      <JsonLd data={breadcrumbSchema(breadcrumbItems)} />
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={breadcrumbItems.map((b, i) => ({
              label: b.name,
              href: i < breadcrumbItems.length - 1 ? b.url : undefined,
            }))}
          />
          <h1 className="mt-3 text-h1 text-white">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/95">
            <Link href="/" className="font-semibold text-[var(--gold)] no-underline hover:underline">
              PoliceStationRepUK
            </Link>
            {' — '}
            free directory for criminal solicitors and accredited police station representatives (England &amp; Wales).
          </p>
        </div>
      </section>

      <div className="page-container">
        <article className="mx-auto max-w-3xl">
          <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--gold-pale)] p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">Quick answer</h2>
            <p className="mt-2 text-base font-medium leading-relaxed text-[var(--foreground)]">{quickAnswer}</p>
          </div>
          <div className="prose-pillar space-y-5 text-base leading-relaxed text-[var(--muted)]">{children}</div>

          <section className="mt-12 border-t border-[var(--border)] pt-10" aria-labelledby="pillar-faq-heading">
            <h2 id="pillar-faq-heading" className="text-xl font-bold text-[var(--navy)]">
              Frequently asked questions
            </h2>
            <div className="mt-6 space-y-3">
              {faqs.map((item) => (
                <details
                  key={item.q}
                  className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)]"
                >
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[var(--navy)] marker:hidden">
                    {item.q}
                  </summary>
                  <p className="border-t border-[var(--border)] px-4 py-3 text-sm leading-relaxed text-[var(--muted)]">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <nav className="mt-10 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-slate-50 p-6" aria-label="Related guides">
            <p className="text-sm font-bold text-[var(--navy)]">Related pages</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              <li>
                <Link href="/CommonOffencesGuide" className="font-medium text-[var(--navy)] underline">
                  Common Offences Guide
                </Link>
              </li>
              <li>
                <Link href="/PACE" className="font-medium text-[var(--navy)] underline">
                  PACE Codes
                </Link>
              </li>
              <li>
                <Link href="/police-station-representative" className="font-medium text-[var(--navy)] underline">
                  Police station representative
                </Link>
              </li>
              <li>
                <Link href="/criminal-solicitor-police-station" className="font-medium text-[var(--navy)] underline">
                  Criminal solicitor — police station
                </Link>
              </li>
              <li>
                <Link href="/police-station-rights-uk" className="font-medium text-[var(--navy)] underline">
                  Police station rights UK
                </Link>
              </li>
              <li>
                <Link href="/directory" className="font-medium text-[var(--navy)] underline">
                  Find a rep — directory
                </Link>
              </li>
            </ul>
          </nav>
        </article>
      </div>
    </>
  );
}
