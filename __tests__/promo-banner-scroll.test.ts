import { describe, expect, it } from 'vitest';
import {
  clearPinnedOnScroll,
  SCROLL_HIDE_PX,
  shouldCollapsePromos,
} from '@/lib/promo-banner-scroll';

describe('promo-banner-scroll', () => {
  it('shows full banners at top of page', () => {
    expect(shouldCollapsePromos(0, false)).toBe(false);
    expect(shouldCollapsePromos(SCROLL_HIDE_PX, false)).toBe(false);
  });

  it('collapses after scrolling past threshold', () => {
    expect(shouldCollapsePromos(SCROLL_HIDE_PX + 1, false)).toBe(true);
  });

  it('stays expanded when pinned open below threshold scroll', () => {
    expect(shouldCollapsePromos(200, true)).toBe(false);
  });

  it('clears pin when scrolling past threshold', () => {
    expect(clearPinnedOnScroll(0, true)).toBe(true);
    expect(clearPinnedOnScroll(SCROLL_HIDE_PX, true)).toBe(true);
    expect(clearPinnedOnScroll(SCROLL_HIDE_PX + 1, true)).toBe(false);
  });
});
