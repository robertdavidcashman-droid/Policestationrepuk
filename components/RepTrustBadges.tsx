import type { Representative } from '@/lib/types';
import {
  isFullProfileListing,
  profileCompleteness,
} from '@/lib/directory-ranking';

type Variant = 'card' | 'profile';

/**
 * Safe trust *signals* from listing data only — not verification of credentials.
 */
export function RepTrustBadges({
  rep,
  variant = 'card',
  directoryVerified = false,
}: {
  rep: Representative;
  variant?: Variant;
  /** Passed strict admin verification gate (see lib/rep-public-trust.ts). */
  directoryVerified?: boolean;
}) {
  const full = isFullProfileListing(rep);
  const contactReady = Boolean(rep.phone?.trim() && rep.email?.trim());
  const pct = profileCompleteness(rep);

  const base =
    variant === 'profile'
      ? 'rounded-lg border px-3 py-1.5 text-xs font-semibold'
      : 'rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide';

  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Listing quality signals">
      {directoryVerified && (
        <span
          className={`${base} border-emerald-400/50 bg-emerald-50 text-emerald-900`}
          title="Admin-verified for directory publication within the re-verification window"
        >
          Admin-verified listing
        </span>
      )}
      {rep.featured && (
        <span
          className={`${base} border-amber-300/60 bg-amber-50 text-amber-900`}
          title="Promoted directory placement"
        >
          Featured listing
        </span>
      )}
      {full && (
        <span
          className={`${base} border-emerald-300/60 bg-emerald-50 text-emerald-900`}
          title="Most profile fields completed by the representative"
        >
          Full profile
        </span>
      )}
      {!full && pct >= 45 && (
        <span
          className={`${base} border-slate-200 bg-slate-50 text-slate-600`}
          title="Based on fields completed in this listing"
        >
          Profile {pct}% complete
        </span>
      )}
      {contactReady && (
        <span
          className={`${base} border-[var(--navy)]/20 bg-[var(--navy)]/5 text-[var(--navy)]`}
          title="Phone and email shown on listing"
        >
          Contact-ready
        </span>
      )}
    </div>
  );
}
