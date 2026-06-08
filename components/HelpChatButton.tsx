'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AssistantChat } from '@/components/AssistantChat';
import { useAssistantUi } from '@/components/assistant/AssistantUiProvider';
import { CONTACT_WHATSAPP_HREF } from '@/lib/contact-constants';
import { SUPPORT_MAILTO_HREF } from '@/lib/site-contact';

function SparkleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 shrink-0"
      aria-hidden
    >
      <path d="M9.813 2.25a.75.75 0 0 1 .726.568l.66 2.631a3.75 3.75 0 0 0 2.805 2.805l2.631.66a.75.75 0 0 1 0 1.456l-2.631.66a3.75 3.75 0 0 0-2.805 2.805l-.66 2.631a.75.75 0 0 1-1.456 0l-.66-2.631a3.75 3.75 0 0 0-2.805-2.805l-2.631-.66a.75.75 0 0 1 0-1.456l2.631-.66a3.75 3.75 0 0 0 2.805-2.805l.66-2.631a.75.75 0 0 1 .73-.568Z" />
    </svg>
  );
}

export function HelpChatButton() {
  const { open, setOpen, tab, setTab, showHint } = useAssistantUi();
  const pathname = usePathname();
  const isHome = pathname === '/';
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || tab !== 'ask') return;
    const timer = window.setTimeout(() => {
      const textarea = panelRef.current?.querySelector('textarea');
      textarea?.focus();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [open, tab]);

  const widget = (
    <>
      <div className="fixed-ui-bottom-raised fixed-ui-right z-[55] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Open AI assistant"
          aria-expanded={open}
          className={`relative flex items-center gap-2 rounded-full bg-[var(--navy)] py-2 pl-3 pr-3 text-white shadow-lg transition-all hover:bg-[var(--navy-light)] hover:shadow-xl sm:pr-4 ${
            showHint && !open ? 'ring-2 ring-[var(--gold)] ring-offset-2 animate-pulse' : ''
          }`}
        >
          <SparkleIcon />
          <span className="text-xs font-bold uppercase tracking-wide">Ask AI</span>
        </button>
      </div>

      {open && (
        <div
          ref={panelRef}
          data-parity-mask
          role="dialog"
          aria-label="AI assistant"
          className="fixed-ui-bottom-raised fixed-ui-right z-[70] flex max-h-[min(90vh,36rem)] w-[min(calc(100vw-2rem-var(--safe-area-left)-var(--safe-area-right)),24rem)] flex-col overflow-hidden rounded-xl border border-[var(--card-border)] bg-white shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setTab('ask')}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                    tab === 'ask' ? 'bg-white text-[var(--navy)] shadow-sm' : 'text-[var(--muted)]'
                  }`}
                >
                  Ask AI
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
              {tab === 'ask' && (
                <p className="mt-2 text-[11px] leading-snug text-[var(--muted)]">
                  AI assistant · Site &amp; career guides · not legal advice
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 text-[var(--muted)] hover:text-[var(--navy)]"
              aria-label="Close AI assistant"
            >
              ✕
            </button>
          </div>

          <div
            className={`min-h-0 flex-1 overflow-hidden ${tab === 'ask' ? 'flex flex-col p-4 pt-3' : 'overflow-y-auto p-4'}`}
          >
            {tab === 'ask' ? (
              <>
                <AssistantChat compact className="min-h-0 flex-1" />
                <p className="mt-2 shrink-0 text-center text-[11px] text-[var(--muted)]">
                  <Link href="/guided-assistant" className="font-semibold text-[var(--navy)] hover:underline">
                    Open full AI assistant page →
                  </Link>
                </p>
              </>
            ) : (
              <>
                <h4 className="text-sm font-bold text-[var(--navy)]">Need help?</h4>
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

  if (!mounted) return null;

  return createPortal(widget, document.body);
}
