import Link from 'next/link';
import type { PoliceStation } from '@/lib/types';
import { isCustodyStation } from '@/lib/custody-station';
import { isDialablePhone } from '@/lib/station-verification';

/** Prompt reps to contribute when a custody suite has no published desk line. */
export function CustodyContributePrompt({ station }: { station: PoliceStation }) {
  if (!isCustodyStation(station)) return null;
  if (isDialablePhone(station.custodyPhone)) return null;

  const href = `/contribute-custody-numbers?station=${encodeURIComponent(station.slug)}`;

  return (
    <aside className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-[var(--navy)]">
      <p className="font-semibold">Missing custody desk number</p>
      <p className="mt-1 leading-relaxed text-[var(--muted)]">
        We do not have a published custody desk line for {station.name}. If you cover this suite as
        an accredited rep, you can add or confirm the number — corroborated tips publish to the live
        directory.
      </p>
      <Link href={href} className="btn-gold mt-3 inline-block !text-sm no-underline">
        Contribute custody number
      </Link>
      <p className="mt-2 text-xs text-[var(--muted)]">
        <Link href="/Account" className="font-semibold text-[var(--gold-link)] hover:underline">
          Sign in
        </Link>{' '}
        to your rep account first.
      </p>
    </aside>
  );
}
