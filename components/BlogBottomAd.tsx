import Link from 'next/link';
import { AdvertisementLabel } from './AdvertisementLabel';
import { PartnerOutboundLink } from './PartnerOutboundLink';
import { POLICESTATIONAGENT_HOME_HREF } from '@/lib/policestationagent-promo';

export function BlogBottomAd() {
  return (
    <aside
      className="mt-12 rounded-[var(--radius-lg)] border-2 border-[var(--gold)]/30 bg-gradient-to-br from-[var(--gold-pale)] to-white p-6 sm:p-8"
      aria-label="Sponsored: Police Station Agent Kent"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <AdvertisementLabel variant="gold" label="Sponsored Service" />
          <h3 className="mt-3 text-lg font-bold text-[var(--navy)]">
            Police Station Solicitor Cover in Kent
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Experienced criminal solicitor providing police station agent cover for Kent law firms.
            Qualified duty solicitor, Higher Court Advocate, and available for daytime and evening attendance
            across all Kent custody suites.
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            This is a separate service operated by Robert Cashman via Tuckers Solicitors LLP — not part of the
            PoliceStationRepUK directory function.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <PartnerOutboundLink
            href={POLICESTATIONAGENT_HOME_HREF}
            partner="policestationagent"
            placement="blog_bottom_ad"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold inline-flex justify-center !text-sm !no-underline"
          >
            Visit policestationagent.com
          </PartnerOutboundLink>
          <Link
            href="tel:01732247427"
            className="inline-flex justify-center rounded-lg border-2 border-[var(--navy)]/15 px-4 py-2.5 text-sm font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold-hover)]"
          >
            Call (01732) 247427
          </Link>
        </div>
      </div>
    </aside>
  );
}
