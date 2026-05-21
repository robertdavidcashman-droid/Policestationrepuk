'use client';

import { useEffect, useRef } from 'react';

/**
 * Cloudflare Turnstile widget. Renders a "I'm human" challenge that resolves
 * to a token written into a hidden `cf-turnstile-response` input.
 *
 * The widget renders **nothing** (i.e. silently no-ops) when no site key is
 * configured — that way the same form works in local dev and preview deploys
 * without keys, and only becomes a real bot gate in production.
 *
 * Pass the same site key to the server via `lib/turnstile.ts::turnstileSiteKey`.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'flexible' | 'compact';
        },
      ) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
    __cfTurnstileLoaded?: boolean;
  }
}

interface Props {
  siteKey: string | null;
  onToken?: (token: string) => void;
  theme?: 'light' | 'dark' | 'auto';
}

function loadScriptOnce(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (window.__cfTurnstileLoaded) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-cf-turnstile-loader="1"]',
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.defer = true;
    s.dataset.cfTurnstileLoader = '1';
    s.onload = () => {
      window.__cfTurnstileLoaded = true;
      resolve();
    };
    document.head.appendChild(s);
  });
}

export function TurnstileWidget({ siteKey, onToken, theme = 'auto' }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let cancelled = false;
    void loadScriptOnce().then(() => {
      if (cancelled || !ref.current || !window.turnstile) return;
      try {
        widgetIdRef.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          theme,
          callback: (token) => {
            if (onToken) onToken(token);
          },
          'error-callback': () => onToken?.(''),
          'expired-callback': () => onToken?.(''),
        });
      } catch (err) {
        console.warn('[Turnstile] render failed:', err);
      }
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
  }, [siteKey, theme, onToken]);

  if (!siteKey) return null;
  return <div ref={ref} className="mt-3" data-cf-turnstile />;
}
