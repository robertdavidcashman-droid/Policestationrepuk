'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CONTACT_WHATSAPP_HREF } from '@/lib/contact-constants';
import { SUPPORT_MAILTO_HREF } from '@/lib/site-contact';

export function HelpChatButton() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      <button
        type="button"
        data-parity-mask
        onClick={() => setOpen((v) => !v)}
        aria-label="Open help chat"
        className="fixed-ui-bottom-raised fixed-ui-right z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--navy)] text-xl text-white shadow-lg transition-all hover:bg-[var(--navy-light)] hover:shadow-xl"
      >
        💬
      </button>

      {open && (
        <div
          data-parity-mask
          className="fixed-ui-bottom-raised fixed-ui-right z-[60] w-[min(calc(100vw-2rem-var(--safe-area-left)-var(--safe-area-right)),20rem)] rounded-xl border border-[var(--card-border)] bg-white p-5 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[var(--navy)]">Need Help?</h4>
            <button
              onClick={() => setOpen(false)}
              className="text-[var(--muted)] hover:text-[var(--navy)]"
              aria-label="Close help chat"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {isHome
              ? 'Use the directory to find reps nationwide. Kent agency phone and WhatsApp are in the Kent section on this page.'
              : 'Get instant answers about registration, finding representatives, or using the directory.'}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href={SUPPORT_MAILTO_HREF}
              className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-center text-sm font-medium text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)] hover:bg-slate-50"
            >
              Email support
            </a>
            <Link
              href="/Contact"
              className="rounded-lg bg-[var(--navy)] px-4 py-2.5 text-center text-sm font-medium text-white no-underline transition-colors hover:bg-[var(--navy-light)]"
            >
              Contact Us
            </Link>
            {!isHome && (
              <a
                href={CONTACT_WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-center text-sm font-medium text-emerald-800 no-underline transition-colors hover:bg-emerald-100"
              >
                💬 WhatsApp
              </a>
            )}
            <Link
              href="/FAQ"
              className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-center text-sm font-medium text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)]"
            >
              View FAQ
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
