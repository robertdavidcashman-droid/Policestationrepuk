'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AssistantChat } from '@/components/AssistantChat';
import { CONTACT_WHATSAPP_HREF } from '@/lib/contact-constants';
import { SUPPORT_MAILTO_HREF } from '@/lib/site-contact';

type PanelTab = 'ask' | 'contact';

export function HelpChatButton() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PanelTab>('ask');
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      <button
        type="button"
        data-parity-mask
        onClick={() => setOpen((v) => !v)}
        aria-label="Open help assistant"
        aria-expanded={open}
        className="fixed-ui-bottom-raised fixed-ui-right z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--navy)] text-xl text-white shadow-lg transition-all hover:bg-[var(--navy-light)] hover:shadow-xl"
      >
        💬
      </button>

      {open && (
        <div
          data-parity-mask
          className="fixed-ui-bottom-raised fixed-ui-right z-[60] flex max-h-[min(85vh,32rem)] w-[min(calc(100vw-2rem-var(--safe-area-left)-var(--safe-area-right)),24rem)] flex-col overflow-hidden rounded-xl border border-[var(--card-border)] bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => setTab('ask')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  tab === 'ask' ? 'bg-white text-[var(--navy)] shadow-sm' : 'text-[var(--muted)]'
                }`}
              >
                Ask
              </button>
              <button
                type="button"
                onClick={() => setTab('contact')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  tab === 'contact' ? 'bg-white text-[var(--navy)] shadow-sm' : 'text-[var(--muted)]'
                }`}
              >
                Contact
              </button>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[var(--muted)] hover:text-[var(--navy)]"
              aria-label="Close help assistant"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {tab === 'ask' ? (
              <>
                <p className="mb-2 text-xs text-[var(--muted)]">
                  Search our FAQs and guides. Not legal advice.
                </p>
                <AssistantChat compact />
                <p className="mt-3 text-center text-[11px] text-[var(--muted)]">
                  <Link href="/guided-assistant" className="font-semibold text-[var(--navy)] hover:underline">
                    Open full assistant page →
                  </Link>
                </p>
              </>
            ) : (
              <>
                <h4 className="text-sm font-bold text-[var(--navy)]">Need Help?</h4>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {isHome
                    ? 'Use the directory to find reps nationwide. Kent agency phone and WhatsApp are in the Kent section on this page.'
                    : 'Email or contact us for directory enquiries. For urgent cover, use rep listings or WhatsApp.'}
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
                      WhatsApp
                    </a>
                  )}
                  <Link
                    href="/FAQ"
                    className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-center text-sm font-medium text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)]"
                  >
                    View FAQ
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
