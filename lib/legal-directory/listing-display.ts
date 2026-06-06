import type { PublicLegalDirectoryListing } from './types';
import type { LegalVerificationSourceType } from './verification-sources';

const REGISTER_SOURCE_TYPES = new Set<LegalVerificationSourceType>(['sra', 'bsb', 'cilex']);

export type ListingTrustBadgeVariant =
  | 'verified'
  | 'unverified'
  | 'laa-unclaimed'
  | 'laa-listed'
  | 'checked';

export interface ListingTrustBadge {
  key: string;
  label: string;
  variant: ListingTrustBadgeVariant;
  title?: string;
}

export function hasRegisterVerification(
  listing: Pick<PublicLegalDirectoryListing, 'verificationSources'>,
): boolean {
  return (listing.verificationSources ?? []).some((s) => REGISTER_SOURCE_TYPES.has(s.type));
}

export function isOnlyLaaVerification(
  listing: Pick<PublicLegalDirectoryListing, 'verificationSources' | 'unclaimedSeeded'>,
): boolean {
  if (listing.unclaimedSeeded) return true;
  const sources = listing.verificationSources ?? [];
  return sources.length > 0 && sources.every((s) => s.type === 'laa');
}

/** Whether the emerald "Verified" badge may appear on public UI. */
export function shouldShowPublicVerifiedBadge(
  listing: Pick<
    PublicLegalDirectoryListing,
    'verified' | 'unclaimedSeeded' | 'verificationSources' | 'verificationStatus'
  >,
): boolean {
  if (listing.unclaimedSeeded) return false;
  if (listing.verified) return true;
  return listing.verificationStatus === 'verified' && hasRegisterVerification(listing);
}

export function getListingTrustBadges(listing: PublicLegalDirectoryListing): ListingTrustBadge[] {
  if (listing.unclaimedSeeded) {
    const badges: ListingTrustBadge[] = [
      { key: 'laa-unclaimed', label: 'Unclaimed · LAA listed', variant: 'laa-unclaimed' },
    ];
    if (listing.dateVerified) {
      badges.push({
        key: 'laa-checked',
        label: `LAA data checked ${listing.dateVerified}`,
        variant: 'laa-listed',
        title: listing.sourceUrl || undefined,
      });
    }
    return badges;
  }

  const badges: ListingTrustBadge[] = [];

  if (shouldShowPublicVerifiedBadge(listing)) {
    badges.push({ key: 'verified', label: 'Verified', variant: 'verified' });
  } else if (listing.verificationStatus === 'unverified' && !listing.verified) {
    badges.push({ key: 'unverified', label: 'Unverified', variant: 'unverified' });
  } else if (isOnlyLaaVerification(listing) && listing.verificationStatus === 'verified') {
    badges.push({
      key: 'laa-listed',
      label: 'Listed in published LAA directory',
      variant: 'laa-listed',
      title: listing.sourceUrl || undefined,
    });
    if (listing.dateVerified) {
      badges.push({
        key: 'laa-checked',
        label: `LAA data checked ${listing.dateVerified}`,
        variant: 'laa-listed',
        title: listing.sourceUrl || undefined,
      });
    }
    return badges;
  }

  if (listing.verificationStatus === 'verified' && listing.dateVerified) {
    badges.push({
      key: 'checked',
      label: `Checked ${listing.dateVerified}`,
      variant: 'checked',
      title: listing.sourceUrl || undefined,
    });
  }

  return badges;
}

export function formatLegalAidStatusLabel(
  listing: Pick<PublicLegalDirectoryListing, 'legalAidStatus' | 'unclaimedSeeded'>,
): string {
  if (listing.unclaimedSeeded && listing.legalAidStatus === 'yes') {
    return 'Crime legal aid contract (LAA published data)';
  }
  if (listing.legalAidStatus === 'yes') return 'Yes';
  if (listing.legalAidStatus === 'no') return 'No';
  return 'N/A';
}

export function listingTrustBadgeClassName(variant: ListingTrustBadgeVariant): string {
  switch (variant) {
    case 'verified':
      return 'rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-emerald-800';
    case 'unverified':
      return 'rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-amber-900';
    case 'laa-unclaimed':
      return 'rounded-full border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-slate-700';
    case 'laa-listed':
      return 'rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700';
    case 'checked':
      return 'rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700';
  }
}

export function listingTrustBadgeHeroClassName(variant: ListingTrustBadgeVariant): string {
  switch (variant) {
    case 'verified':
      return 'rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200';
    case 'unverified':
      return 'rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-100';
    case 'laa-unclaimed':
      return 'rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-100';
    case 'laa-listed':
    case 'checked':
      return 'rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200';
  }
}
