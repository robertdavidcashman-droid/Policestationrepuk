'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

/** Delegates clicks on elements with data-event to GA4. */
export function AnalyticsEventBinder() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest<HTMLElement>('[data-event]');
      if (!el) return;
      const name = el.getAttribute('data-event');
      if (!name) return;
      const params: Record<string, string> = {};
      for (const { name: attr } of Array.from(el.attributes)) {
        if (attr.startsWith('data-event-') && attr.length > 'data-event-'.length) {
          params[attr.slice('data-event-'.length)] = el.getAttribute(attr) ?? '';
        }
      }
      trackEvent(name, params);
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
  return null;
}
