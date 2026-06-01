import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ResolvedContentSources } from '@/components/ContentSourcesFooter';
import type { ContentSourceContext } from '@/lib/content-sources';

export function GuideSectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-h2 scroll-mt-24 text-[var(--navy)]">
      {children}
    </h2>
  );
}

export function GuideHero({
  breadcrumbs,
  title,
  description,
  updated = '1 June 2026',
}: {
  breadcrumbs: Array<{ label: string; href?: string }>;
  title: string;
  description: string;
  updated?: string;
}) {
  return (
    <section className="bg-[var(--navy)] py-12 sm:py-16">
      <div className="page-container !py-0">
        <Breadcrumbs light items={breadcrumbs} />
        <h1 className="mt-4 text-h1 text-white">{title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">{description}</p>
        <p className="mt-2 text-xs text-slate-400">
          Last updated: {updated} · Author: Robert Cashman, Duty Solicitor &amp; Higher Court Advocate
        </p>
      </div>
    </section>
  );
}

export function GuideToc({ items }: { items: ReadonlyArray<{ id: string; label: string }> }) {
  return (
    <nav
      className="mb-12 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)] sm:p-6"
      aria-label="On this page"
    >
      <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--muted)]">On this page</h2>
      <ul className="mt-3 columns-1 gap-x-8 text-sm sm:columns-2">
        {items.map((item) => (
          <li key={item.id} className="mb-1.5 break-inside-avoid">
            <a
              href={`#${item.id}`}
              className="font-medium text-[var(--navy)] underline decoration-[var(--gold)]/40 underline-offset-2 hover:decoration-[var(--gold)]"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function GuideFaqs({ faqs }: { faqs: ReadonlyArray<{ q: string; a: string }> }) {
  return (
    <div className="mt-4 divide-y divide-[var(--border)] rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)]">
      {faqs.map((faq) => (
        <details key={faq.q} className="group px-5 py-4">
          <summary className="cursor-pointer list-none font-semibold text-[var(--navy)] marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-start justify-between gap-3">
              {faq.q}
              <span className="shrink-0 text-[var(--gold)] transition-transform group-open:rotate-45">+</span>
            </span>
          </summary>
          <p
            className="mt-3 text-sm leading-relaxed text-[var(--muted)]"
            dangerouslySetInnerHTML={{ __html: faq.a }}
          />
        </details>
      ))}
    </div>
  );
}

export function GuideRelated({
  links,
}: {
  links: ReadonlyArray<{ href: string; label: string; desc: string }>;
}) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
        >
          <p className="font-medium text-[var(--navy)]">{link.label}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{link.desc}</p>
        </Link>
      ))}
    </div>
  );
}

export function GuideCta({
  title = 'Need help?',
  description = 'Find an accredited police station representative or get in touch.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="mt-3 text-slate-300">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/directory" className="btn-gold no-underline">
          Find a Rep
        </Link>
        <Link
          href="/Contact"
          className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] no-underline"
        >
          Contact Us
        </Link>
      </div>
    </section>
  );
}

export function StructuredGuideShell({
  children,
  sourcesContext,
  promo,
}: {
  children: React.ReactNode;
  sourcesContext: ContentSourceContext;
  promo?: React.ReactNode;
}) {
  return (
    <div className="page-container">
      <div className="mx-auto max-w-4xl pb-12">
        <ContentReliabilityNotice className="mb-8" />
        {children}
        <ResolvedContentSources id="sources" className="mb-10" context={sourcesContext} />
        {promo}
        <GuideCta />
      </div>
    </div>
  );
}
