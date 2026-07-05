import Link from 'next/link';

export function HomeWhyChoose() {
  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
      title: 'Verified Professionals',
      body: 'Self-registered representatives with accreditation details visible to instructing firms. Firms remain responsible for their own checks.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      ),
      title: 'England & Wales Coverage',
      body: 'Representatives listed across all 42 police force areas, from London to rural custody suites, available for day and night cover.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
      title: 'Direct Connection',
      body: 'Contact reps directly via phone, email, or WhatsApp. No middleman, no fees. The engagement is between the firm and the rep.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      ),
      title: 'Free Resources',
      body: 'Training guides, PACE references, forms library, station phone numbers, and a professional Wiki — all free for the profession.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
      title: 'Active Community',
      body: (
        <>
          WhatsApp groups (fully accredited only), our{' '}
          <Link href="/Forum" className="font-semibold text-[var(--navy)] underline">
            community forum
          </Link>
          , and a blog with practical guidance for freelance reps and criminal defence firms.
        </>
      ),
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      title: '24/7 Access',
      body: 'The directory is available around the clock. Search by county, station, or name whenever you need emergency or planned cover.',
    },
  ];

  return (
    <section className="section-pad bg-slate-50" aria-label="Key features">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-h2 mt-0 text-[var(--navy)]">
            Why professionals use this directory
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-[var(--muted)]">
            A free, independent platform built for the criminal defence profession since 2016
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-[var(--card-border)] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--gold)]/40 hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--navy)] text-white">
                {f.icon}
              </div>
              <h3 className="mt-4 text-base font-bold text-[var(--navy)]">{f.title}</h3>
              <div className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{f.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
