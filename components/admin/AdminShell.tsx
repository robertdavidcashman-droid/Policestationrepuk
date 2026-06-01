import Link from 'next/link';
import type { ReactNode } from 'react';

export type AdminSection = 'reps' | 'legal' | 'legal-queue' | 'stations';

const NAV: { id: AdminSection; href: string; label: string }[] = [
  { id: 'reps', href: '/admin', label: 'Rep verification' },
  { id: 'legal', href: '/admin/legal-directory', label: 'Legal directory' },
  { id: 'legal-queue', href: '/admin/legal-directory/review-queue', label: 'Flagged listings' },
  { id: 'stations', href: '/admin/station-updates', label: 'Station updates' },
];

export function AdminShell({
  active,
  adminEmail,
  title,
  description,
  children,
}: {
  active: AdminSection;
  adminEmail: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-slate-50 py-10">
      <div className="admin-container">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[var(--gold)]">Admin</p>
            <h1 className="text-h2 text-[var(--navy)]">{title}</h1>
            {description ? (
              <p className="mt-2 max-w-3xl text-lg text-[var(--muted)]">{description}</p>
            ) : null}
          </div>
          <p className="text-base text-[var(--muted)]">
            Signed in as <strong className="text-[var(--navy)]">{adminEmail}</strong>
          </p>
        </div>

        <nav
          className="mt-6 flex flex-wrap gap-2 border-b border-[var(--border)] pb-4"
          aria-label="Admin sections"
        >
          {NAV.map((item) => {
            const isActive = item.id === active;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-lg font-semibold no-underline transition-colors ${
                  isActive
                    ? 'bg-[var(--navy)] text-white'
                    : 'border border-[var(--border)] bg-white text-[var(--navy)] hover:border-[var(--gold)]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
