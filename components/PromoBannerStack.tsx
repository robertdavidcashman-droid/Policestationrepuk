'use client';

import { useCallback, useEffect, useState } from 'react';
import { WhatsAppCommunityBanner } from '@/components/WhatsAppCommunityBanner';
import {
  CUSTODYNOTE_BANNER_DISMISSED_KEY,
  CustodyNoteTopBanner,
} from '@/components/CustodyNoteTopBanner';
import { PromoRestoreBar } from '@/components/PromoRestoreBar';
import {
  clearPinnedOnScroll,
  SCROLL_HIDE_PX,
  shouldCollapsePromos,
} from '@/lib/promo-banner-scroll';

export function PromoBannerStack() {
  const [collapsed, setCollapsed] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [cnDismissed, setCnDismissed] = useState(false);

  useEffect(() => {
    try {
      setCnDismissed(localStorage.getItem(CUSTODYNOTE_BANNER_DISMISSED_KEY) === '1');
    } catch {
      setCnDismissed(false);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      setPinnedOpen((prevPinned) => {
        const nextPinned = clearPinnedOnScroll(scrollY, prevPinned, SCROLL_HIDE_PX);
        setCollapsed((prevCollapsed) =>
          shouldCollapsePromos(scrollY, nextPinned, prevCollapsed),
        );
        return nextPinned;
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleExpand = useCallback(() => {
    setPinnedOpen(true);
    setCollapsed(false);
  }, []);

  const handleCnDismissChange = useCallback((dismissed: boolean) => {
    setCnDismissed(dismissed);
  }, []);

  return (
    <div aria-label="Site promotions">
      <div
        className={`promo-banner-stack-inner ${collapsed ? 'is-collapsed' : 'is-expanded'}`}
        aria-hidden={collapsed}
      >
        <div className="promo-banner-stack-content">
          <WhatsAppCommunityBanner />
          <CustodyNoteTopBanner onDismissChange={handleCnDismissChange} />
        </div>
      </div>
      {collapsed && <PromoRestoreBar cnDismissed={cnDismissed} onExpand={handleExpand} />}
    </div>
  );
}
