/**
 * Reliance / verification warning shown across the site.
 *
 * - `variant="banner"` — prominent boxed notice for content/legal/fee pages.
 * - `variant="inline"` — compact single paragraph (e.g. end of an article).
 *
 * Wording is deliberately consistent everywhere: information may be wrong or
 * out of date, it is not legal advice, and the reader must verify against the
 * original source before relying on it.
 */
type Variant = 'banner' | 'inline';

const VERIFY_LINKS = [
  { href: 'https://www.legislation.gov.uk', label: 'legislation.gov.uk' },
  { href: 'https://www.gov.uk', label: 'gov.uk' },
  { href: 'https://www.gov.uk/government/organisations/legal-aid-agency', label: 'the Legal Aid Agency' },
  { href: 'https://www.cps.gov.uk', label: 'the CPS' },
];

export function ContentReliabilityNotice({
  variant = 'banner',
  className = '',
}: {
  variant?: Variant;
  className?: string;
}) {
  if (variant === 'inline') {
    return (
      <p className={`text-xs leading-relaxed text-[var(--muted)] ${className}`}>
        <strong className="text-[var(--foreground)]">Always verify before you rely on this.</strong>{' '}
        We make every effort to keep this information accurate and current, but law, procedure, fees
        and official guidance change frequently and errors can occur. Nothing here is legal advice.
        Before acting, confirm the position against the original source (such as{' '}
        <a
          href="https://www.legislation.gov.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--gold-link)] underline-offset-2 hover:underline"
        >
          legislation.gov.uk
        </a>
        ,{' '}
        <a
          href="https://www.gov.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--gold-link)] underline-offset-2 hover:underline"
        >
          gov.uk
        </a>
        , the LAA, CPS, or the relevant PACE Code) or take advice from a qualified professional.
      </p>
    );
  }

  return (
    <aside
      className={`rounded-[var(--radius-lg)] border border-amber-300/70 bg-amber-50 p-4 text-amber-950 sm:p-5 ${className}`}
      role="note"
      aria-label="Reliability and verification notice"
    >
      <p className="flex items-start gap-2 text-sm font-bold">
        <span aria-hidden className="mt-0.5 shrink-0">⚠️</span>
        <span>Always verify this information against the original source before relying on it</span>
      </p>
      <p className="mt-2 text-xs leading-relaxed sm:text-sm">
        We make every effort to provide reliable, up-to-date information, but law, procedure, fees and
        official guidance change frequently and mistakes can happen. This content is general
        information only and is <strong>not legal advice</strong>. Do not rely on it without checking
        the position yourself against an authoritative source &mdash; for example{' '}
        {VERIFY_LINKS.map((l, i) => (
          <span key={l.href}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700"
            >
              {l.label}
            </a>
            {i < VERIFY_LINKS.length - 1 ? ', ' : ''}
          </span>
        ))}
        , or the relevant PACE Code &mdash; or by taking advice from a qualified professional. Your
        firm and you remain responsible for your own compliance, checks and decisions.
      </p>
    </aside>
  );
}
