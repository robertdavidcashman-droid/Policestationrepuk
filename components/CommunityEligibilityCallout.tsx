import Link from 'next/link';
import {
  DIRECTORY_ELIGIBILITY_REPS,
  FORUM_ALTERNATIVE_REPS,
  FORUM_PATH,
  LAA_PAYMENT_REPS,
  REGISTER_PATH,
  WHATSAPP_REP_ELIGIBILITY,
} from '@/lib/community-messaging';
import { FACEBOOK_GROUP_URL } from '@/lib/site-navigation';

type Variant = 'full' | 'compact';

/**
 * Eligibility callout for WhatsApp / register journeys — used sparingly on high-intent pages only.
 */
export function CommunityEligibilityCallout({ variant = 'full' }: { variant?: Variant }) {
  if (variant === 'compact') {
    return (
      <aside className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-4 sm:p-5">
        <p className="text-sm font-semibold text-amber-950">Fully accredited only</p>
        <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
          {LAA_PAYMENT_REPS.split('.')[0]}.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
          Not fully qualified?{' '}
          <Link href={FORUM_PATH} className="font-semibold text-[var(--navy)] underline">
            Community forum
          </Link>{' '}
          for advice and chat.
        </p>
      </aside>
    );
  }

  return (
    <aside
      className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-5 sm:p-6"
      aria-labelledby="community-eligibility-heading"
    >
      <h2 id="community-eligibility-heading" className="text-base font-bold text-amber-950">
        Who can join — and who should use the forum instead
      </h2>
      <ul className="mt-3 space-y-3 text-sm leading-relaxed text-amber-900/95">
        <li>
          <strong className="text-amber-950">WhatsApp group:</strong> {WHATSAPP_REP_ELIGIBILITY}
        </li>
        <li>
          <strong className="text-amber-950">Paid work:</strong> {LAA_PAYMENT_REPS}
        </li>
        <li>
          <strong className="text-amber-950">Directory:</strong> {DIRECTORY_ELIGIBILITY_REPS}{' '}
          <Link href={REGISTER_PATH} className="font-semibold text-[var(--navy)] underline">
            Register eligibility
          </Link>
        </li>
        <li>
          <strong className="text-amber-950">Not fully qualified?</strong> {FORUM_ALTERNATIVE_REPS}{' '}
          <Link href={FORUM_PATH} className="font-semibold text-[var(--navy)] underline">
            Community forum
          </Link>{' '}
          or{' '}
          <a
            href={FACEBOOK_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--navy)] underline"
          >
            Facebook group
          </a>
          .
        </li>
      </ul>
    </aside>
  );
}
