import Link from 'next/link';
import { CUSTODYNOTE_TRIAL_HREF } from '@/lib/custodynote-promo';
import { WHATSAPP_PAGE_REPS } from '@/lib/site-navigation';

type PromoRestoreBarProps = {
  cnDismissed: boolean;
  onExpand: () => void;
};

export function PromoRestoreBar({ cnDismissed, onExpand }: PromoRestoreBarProps) {
  return (
    <div
      className="border-b border-[var(--navy-light)] bg-gradient-to-r from-[#0c221c] via-[#0f1d45] to-[#0c221c]"
      role="region"
      aria-label="Quick links to WhatsApp and Custody Note"
    >
      <div className="mx-auto flex max-w-[var(--container-max)] items-center justify-center gap-1 px-[var(--container-gutter)] py-0.5 sm:gap-1.5 sm:px-6 lg:px-8">
        <Link
          href={WHATSAPP_PAGE_REPS}
          className="inline-flex h-8 min-h-[2rem] max-w-[45%] shrink-0 items-center justify-center truncate rounded-full bg-emerald-900/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-50 no-underline ring-1 ring-emerald-700/50 transition-colors hover:bg-emerald-800 sm:h-9 sm:max-w-none sm:px-3 sm:text-[11px]"
        >
          Join WhatsApp group
        </Link>
        {!cnDismissed && (
          <a
            href={CUSTODYNOTE_TRIAL_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 min-h-[2rem] max-w-[45%] shrink-0 items-center justify-center truncate rounded-full bg-[var(--gold)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--navy)] no-underline transition-colors hover:bg-[var(--gold-hover)] sm:h-9 sm:max-w-none sm:px-3 sm:text-[11px]"
          >
            Custody Note trial
          </a>
        )}
        <button
          type="button"
          onClick={onExpand}
          aria-expanded={false}
          aria-label="Show promo banners"
          className="inline-flex h-8 min-h-[2rem] shrink-0 items-center justify-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-white/20 sm:h-9 sm:px-3 sm:text-[11px]"
        >
          <span className="hidden min-[400px]:inline">Show banners</span>
          <span className="min-[400px]:hidden">Expand</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden className="shrink-0">
            <path d="M2.5 6.5L5 4L7.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
