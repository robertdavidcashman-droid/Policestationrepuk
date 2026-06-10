import Link from 'next/link';
import type { PublicLegalDirectoryListing } from '@/lib/legal-directory/types';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';
import {
  getListingTrustBadges,
  listingTrustBadgeClassName,
} from '@/lib/legal-directory/listing-display';
import { phoneToTelHref } from '@/lib/phone';

/** Directory result card — monetisation: featured/promoted badges sort order in search. */
export function LegalDirectoryCard({ listing }: { listing: PublicLegalDirectoryListing }) {
  const profileHref = `${LEGAL_DIRECTORY_BASE}/listing/${listing.slug}`;
  const specialismTags = listing.specialisms
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  const websiteUrl = (() => {
    if (!listing.websiteUrl) return null;
    try {
      return new URL(listing.websiteUrl).toString();
    } catch {
      return null;
    }
  })();

  return (
    <article className="group flex flex-col rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white shadow-[var(--card-shadow)] transition-all duration-200 hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]">
      <div className="h-1 rounded-t-[var(--radius-lg)] bg-[var(--navy)]" />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {listing.logoUrl && (
          <div className="mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-[var(--card-border)] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={listing.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
          </div>
        )}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--navy)]/20 bg-[var(--navy)]/5 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--navy)]">
            {listing.category}
          </span>
          {listing.featured && (
            <span className="rounded-full border border-[var(--gold)] bg-[var(--gold-pale)] px-2.5 py-0.5 text-[11px] font-bold uppercase text-[var(--navy)]">
              Featured
            </span>
          )}
          {getListingTrustBadges(listing).map((badge) => (
            <span
              key={badge.key}
              className={listingTrustBadgeClassName(badge.variant)}
              title={badge.title}
            >
              {badge.label}
            </span>
          ))}
          {listing.availability24Hour && (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
              24h
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold tracking-tight text-[var(--navy)]">
          <Link href={profileHref} className="no-underline hover:text-[var(--gold-link)]">
            {listing.businessName}
          </Link>
        </h3>

        <p className="mt-1.5 text-sm text-[var(--muted)]">
          {[listing.town, listing.county].filter(Boolean).join(', ')}
        </p>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--muted)]">
          {listing.description.slice(0, 220)}
          {listing.description.length > 220 ? '…' : ''}
        </p>

        {listing.areasCovered && (
          <p className="mt-2 text-xs text-[var(--muted)]">
            <span className="font-semibold text-[var(--navy)]">Areas:</span>{' '}
            {listing.areasCovered.slice(0, 120)}
            {listing.areasCovered.length > 120 ? '…' : ''}
          </p>
        )}

        {specialismTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {specialismTags.map((s) => (
              <span
                key={s}
                className="rounded-full bg-[var(--gold-pale)] px-2.5 py-0.5 text-xs font-medium text-[var(--navy)]"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1" />

        <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
          {listing.phone && (
            <a
              href={phoneToTelHref(listing.phone)}
              className="btn-gold flex-1 !min-h-[40px] !px-3 !py-2 !text-sm text-center"
            >
              Call
            </a>
          )}
          {listing.email && (
            <a
              href={`mailto:${listing.email}`}
              className="btn-outline flex-1 !min-h-[40px] !px-3 !py-2 !text-sm text-center"
            >
              Email
            </a>
          )}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline flex-1 !min-h-[40px] !px-3 !py-2 !text-sm text-center"
            >
              Website
            </a>
          )}
          <Link
            href={profileHref}
            className="btn-navy w-full !min-h-[40px] !py-2 !text-sm text-center sm:w-auto sm:flex-1"
          >
            View full profile
          </Link>
          {listing.unclaimedSeeded && (
            <Link
              href={`${LEGAL_DIRECTORY_BASE}/claim/${listing.slug}`}
              className="btn-gold w-full !min-h-[40px] !py-2 !text-sm text-center no-underline sm:w-auto sm:flex-1"
            >
              Claim listing
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
