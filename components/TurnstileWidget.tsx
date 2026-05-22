'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Cloudflare Turnstile widget. Renders a "I'm human" challenge that resolves
 * to a token written into a hidden `cf-turnstile-response` input.
 *
 * The widget renders **nothing** (i.e. silently no-ops) when no site key is
 * configured — that way the same form works in local dev and preview deploys
 * without keys, and only becomes a real bot gate in production.
 *
 * Pass the same site key to the server via `lib/turnstile.ts::turnstileSiteKey`.
 *
 * The component exposes its current state through the optional `onStatus`
 * callback so the parent form can give the user actionable feedback ("bot
 * check complete", "bot check expired – please try again", etc.) instead of
 * a generic "couldn't verify your details" error.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: (errCode?: string) => void;
          'expired-callback'?: () => void;
          'timeout-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'flexible' | 'compact';
          action?: string;
        },
      ) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
      execute: (id: string) => void;
    };
    __cfTurnstileLoaded?: boolean;
  }
}

export type TurnstileStatus =
  | 'idle'
  | 'script-error'
  | 'render-error'
  | 'rendered'
  | 'verified'
  | 'expired'
  | 'error';

interface Props {
  siteKey: string | null;
  onToken?: (token: string) => void;
  onStatus?: (status: TurnstileStatus, detail?: string) => void;
  theme?: 'light' | 'dark' | 'auto';
  /** Used to namespace metrics; not a secret. */
  action?: string;
}

const SCRIPT_TIMEOUT_MS = 12_000;

function loadScriptOnce(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (window.__cfTurnstileLoaded) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-cf-turnstile-loader="1"]',
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('turnstile-script-error')),
        { once: true },
      );
      return;
    }
    const s = document.createElement('script');
    s.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.defer = true;
    s.dataset.cfTurnstileLoader = '1';
    const timeoutId = window.setTimeout(() => {
      reject(new Error('turnstile-script-timeout'));
    }, SCRIPT_TIMEOUT_MS);
    s.onload = () => {
      window.clearTimeout(timeoutId);
      window.__cfTurnstileLoaded = true;
      resolve();
    };
    s.onerror = () => {
      window.clearTimeout(timeoutId);
      reject(new Error('turnstile-script-error'));
    };
    document.head.appendChild(s);
  });
}

export function TurnstileWidget({
  siteKey,
  onToken,
  onStatus,
  theme = 'auto',
  action,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<TurnstileStatus>('idle');

  const emit = useCallback(
    (next: TurnstileStatus, detail?: string) => {
      setStatus(next);
      onStatus?.(next, detail);
    },
    [onStatus],
  );

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let cancelled = false;
    emit('idle');
    void loadScriptOnce()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        try {
          widgetIdRef.current = window.turnstile.render(ref.current, {
            sitekey: siteKey,
            theme,
            action,
            callback: (token) => {
              if (cancelled) return;
              onToken?.(token);
              emit('verified');
            },
            'error-callback': (errCode) => {
              if (cancelled) return;
              onToken?.('');
              emit('error', errCode || 'turnstile-error');
            },
            'expired-callback': () => {
              if (cancelled) return;
              onToken?.('');
              emit('expired');
              if (widgetIdRef.current && window.turnstile) {
                try {
                  window.turnstile.reset(widgetIdRef.current);
                } catch {
                  /* noop */
                }
              }
            },
            'timeout-callback': () => {
              if (cancelled) return;
              onToken?.('');
              emit('expired', 'timeout');
              if (widgetIdRef.current && window.turnstile) {
                try {
                  window.turnstile.reset(widgetIdRef.current);
                } catch {
                  /* noop */
                }
              }
            },
          });
          emit('rendered');
        } catch (err) {
          console.warn('[Turnstile] render failed:', err);
          emit('render-error', err instanceof Error ? err.message : String(err));
        }
      })
      .catch((err) => {
        console.warn('[Turnstile] script load failed:', err);
        emit('script-error', err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* noop */
        }
      }
    };
  }, [siteKey, theme, action, onToken, emit]);

  if (!siteKey) return null;
  return (
    <div className="space-y-2">
      <div ref={ref} className="mt-3" data-cf-turnstile data-status={status} />
      {(status === 'script-error' || status === 'render-error') && (
        <p className="text-xs text-red-700">
          The bot-protection check couldn&rsquo;t load. If you use a tracker- or
          script-blocking browser extension, please allow it for this page and
          refresh. If the problem persists, contact us and we&rsquo;ll register
          your details manually.
        </p>
      )}
      {status === 'expired' && (
        <p className="text-xs text-amber-700">
          Bot-protection check expired — please tick the box again.
        </p>
      )}
      {status === 'verified' && (
        <p className="text-xs text-emerald-700">Bot check complete.</p>
      )}
    </div>
  );
}
