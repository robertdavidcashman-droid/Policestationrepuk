import Link from 'next/link';
import type { LegalDirectoryLocation } from '@/lib/legal-directory/locations';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';

export function LocationCard({
  location,
  count,
}: {
  location: LegalDirectoryLocation;
  count?: number;
}) {
  return (
    <Link
      href={`${LEGAL_DIRECTORY_BASE}/location/${location.slug}`}
      className="card-surface block p-5 no-underline transition-colors hover:border-[var(--gold)]/50"
    >
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{location.type}</p>
      <h3 className="mt-1 text-lg font-bold text-[var(--navy)]">{location.label}</h3>
      {typeof count === 'number' && (
        <p className="mt-2 text-xs font-semibold text-[var(--gold-link)]">
          {count === 0 ? 'Browse services' : `${count} listing${count === 1 ? '' : 's'}`}
        </p>
      )}
    </Link>
  );
}
