import Link from 'next/link';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';

/** Prompt firms to claim unclaimed LAA-sourced listings shown in results. */
export function UnclaimedListingsBanner({
  unclaimedCount,
  compact,
}: {
  unclaimedCount: number;
  compact?: boolean;
}) {
  if (unclaimedCount <= 0) return null;

  return (
    <aside
      className={
        compact
          ? 'rounded-lg border border-[var(--gold)]/30 bg-[var(--gold-pale)] px-4 py-3 text-sm text-[var(--navy)]'
          : 'card-surface border-l-4 border-[var(--gold)] bg-[var(--gold-pale)] p-5'
      }
    >
      <p className={compact ? 'leading-relaxed' : 'text-sm leading-relaxed text-[var(--muted)]'}>
        {unclaimedCount} result{unclaimedCount === 1 ? '' : 's'}{' '}
        {unclaimedCount === 1 ? 'is an' : 'are'} unclaimed listing
        {unclaimedCount === 1 ? '' : 's'} sourced from published Legal Aid Agency data.
        {compact ? ' ' : ' '}
        If one is your firm, use <strong>Claim listing</strong> on the card or profile page to
        confirm details and add contact information.
      </p>
      {!compact && (
        <Link
          href={`${LEGAL_DIRECTORY_BASE}/add-listing`}
          className="btn-outline mt-3 inline-block !text-sm no-underline"
        >
          Add a new listing instead
        </Link>
      )}
    </aside>
  );
}
