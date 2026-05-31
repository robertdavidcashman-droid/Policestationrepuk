'use client';

import { useState, useEffect } from 'react';
import {
  CUSTODYNOTE_APPS_LINE,
  CUSTODYNOTE_DISCOUNT_CODE,
  CUSTODYNOTE_MEMBER_PRICE_GBP,
  CUSTODYNOTE_TRIAL_HREF,
  TOP_BANNER_TEXT,
  TOP_BANNER_TEXT_MOBILE,
} from '@/lib/custodynote-promo';

const STORAGE_KEY = 'cn-top-banner-dismissed';

export function CustodyNoteTopBanner() {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  const hidden = dismissed === true;

  return (
    <div
      className={`relative z-[100] border-b border-[#0a1633] bg-gradient-to-r from-[#0f1d45] via-[#152e6e] to-[#0f1d45] px-3 text-center transition-all duration-200 sm:px-4 ${hidden ? 'invisible h-0 overflow-hidden py-0' : 'visible py-1.5 sm:py-2.5'}`}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-2 gap-y-1.5 pr-9 sm:gap-4 sm:pr-10">
        <a
          href={CUSTODYNOTE_TRIAL_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-full text-center text-sm font-semibold text-white no-underline transition-colors hover:text-[var(--gold)] sm:text-[15px]"
        >
          <span className="sm:hidden">{TOP_BANNER_TEXT_MOBILE}</span>
          <span className="hidden sm:inline">{TOP_BANNER_TEXT}</span>
        </a>
        <span className="hidden h-4 w-px bg-white/30 sm:inline-block" aria-hidden />
        <span className="hidden text-[11px] font-medium text-white/85 md:inline">
          {CUSTODYNOTE_APPS_LINE}
        </span>
        <span className="hidden h-4 w-px bg-white/30 md:inline-block" aria-hidden />
        <span className="hidden text-[11px] font-medium text-white/85 lg:inline">
          PSR UK readers £{CUSTODYNOTE_MEMBER_PRICE_GBP}/mo · code{' '}
          <span className="rounded bg-[var(--gold)]/20 px-1.5 py-0.5 font-mono font-bold text-[var(--gold)]">
            {CUSTODYNOTE_DISCOUNT_CODE}
          </span>
        </span>
        <a
          href={CUSTODYNOTE_TRIAL_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center rounded-full bg-[var(--gold)] px-3 py-1.5 text-xs font-bold text-[var(--navy)] no-underline shadow-sm transition-colors hover:bg-[var(--gold-hover)] sm:px-4"
        >
          <span className="sm:hidden">Free trial →</span>
          <span className="hidden sm:inline">Start free trial →</span>
        </a>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(STORAGE_KEY, '1');
            } catch {
              /* ignore */
            }
            setDismissed(true);
          }}
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:right-4 ${hidden ? 'pointer-events-none' : ''}`}
          aria-label="Dismiss banner"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
