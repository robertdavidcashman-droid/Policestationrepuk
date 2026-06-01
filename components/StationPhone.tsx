import type { PoliceStation } from '@/lib/types';
import {
  classifyPhone,
  displayPhoneNumber,
  type PhoneClass,
} from '@/lib/station-search';
import { phoneToTelHref } from '@/lib/phone';

/**
 * Shared phone display used by the directory explorer and station cards so the
 * switchboard / generic / none labelling is identical everywhere.
 */
export function StationPhone({
  station,
  link = false,
  className,
}: {
  station: PoliceStation;
  link?: boolean;
  className?: string;
}) {
  const cls: PhoneClass = classifyPhone(station);
  const number = displayPhoneNumber(station);

  if (cls === 'station' || cls === 'switchboard') {
    const numberEl = link && number ? (
      <a
        href={phoneToTelHref(number)}
        className="font-medium text-[var(--gold-link)] no-underline hover:text-[var(--gold)] hover:underline"
      >
        {number}
      </a>
    ) : (
      <span className="font-medium text-[var(--gold-link)]">{number}</span>
    );

    return (
      <div className={className ?? 'mt-2 text-xs'}>
        {numberEl}
        {cls === 'switchboard' && (
          <span className="block text-[10px] text-[var(--muted)]">Force switchboard</span>
        )}
      </div>
    );
  }

  return (
    <p className={`text-[10px] text-[var(--muted)] ${className ?? 'mt-2'}`}>
      {cls === 'generic' ? 'Call 101 (non-emergency)' : 'No direct number — call 101'}
    </p>
  );
}
