'use client';

import Link from 'next/link';
import { getContentSources, type ContentSource, type ContentSourceContext } from '@/lib/content-sources';

export function ContentSourcesFooter({
  sources,
  className = '',
  id = 'sources',
  title = 'Sources & further reading',
}: {
  sources: ContentSource[];
  className?: string;
  id?: string;
  title?: string;
}) {
  if (sources.length === 0) return null;

  return (
    <section
      id={id}
      className={`rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8 ${className}`}
      aria-labelledby={`${id}-heading`}
    >
      <h2 id={`${id}-heading`} className="text-h2 text-[var(--navy)]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        Links are to official publishers (legislation, gov.uk, CPS, LAA, Sentencing Council). Case law on this
        site is limited to entries in our{' '}
        <Link href="/CommonOffencesGuide#sources" className="font-medium text-[var(--gold-link)] hover:underline">
          verified case-law registry
        </Link>
        . Always confirm the current version before relying on it in live advice.
      </p>
      <ul className="mt-4 space-y-2">
        {sources.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[var(--navy)] underline decoration-[var(--gold)]/40 underline-offset-2 hover:decoration-[var(--gold)]"
            >
              {link.label} ↗
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ResolvedContentSources({
  context,
  extra,
  className,
  id,
  title,
}: {
  context: ContentSourceContext;
  extra?: ContentSource[];
  className?: string;
  id?: string;
  title?: string;
}) {
  const sources = getContentSources(context, extra);
  return <ContentSourcesFooter sources={sources} className={className} id={id} title={title} />;
}
