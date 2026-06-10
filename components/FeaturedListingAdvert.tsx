import Link from 'next/link';

export function FeaturedListingAdvert({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`rounded-2xl border border-[var(--gold)]/45 bg-gradient-to-br from-[var(--navy)] via-[#142a61] to-[#0f1d45] p-5 text-white shadow-lg ${className}`}
      aria-label="Featured Representative Listings Now Available"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--gold)]">
            Featured Representative Listings Now Available
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/85">
            PoliceStationRepUK.com has now moved beyond its initial testing period and is operating as a live directory
            for police station representatives, solicitors and clients. Representatives can now upgrade to a Featured
            Listing for enhanced visibility across the platform.
          </p>
          <ul className="mt-3 grid gap-1.5 text-sm text-white/85 sm:grid-cols-2">
            <li>Priority placement in search results</li>
            <li>Homepage visibility</li>
            <li>Highlighted Featured badge</li>
            <li>Greater visibility to solicitors looking for cover</li>
          </ul>
          <p className="mt-3 text-sm">
            <span className="font-bold text-[var(--gold)]">Early access price: £4.99 per month.</span>{' '}
            <span className="text-slate-200">Introductory rate while the directory continues to grow.</span>
          </p>
        </div>
        <Link href="/Account" className="btn-gold shrink-0 !text-sm no-underline">
          Upgrade to Featured
        </Link>
      </div>
    </aside>
  );
}
