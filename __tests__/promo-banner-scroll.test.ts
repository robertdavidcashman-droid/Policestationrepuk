import { describe, expect, it } from 'vitest';
import {
  clearPinnedOnScroll,
  SCROLL_HIDE_PX,
  SCROLL_SHOW_PX,
  shouldCollapsePromos,
  shouldCompactHeader,
  shouldUseCookiePill,
} from '@/lib/promo-banner-scroll';

describe('promo-banner-scroll', () => {
  it('shows full banners at top of page', () => {
    expect(shouldCollapsePromos(0, false)).toBe(false);
    expect(shouldCollapsePromos(SCROLL_HIDE_PX, false)).toBe(false);
  });

  it('collapses after scrolling past threshold', () => {
    expect(shouldCollapsePromos(SCROLL_HIDE_PX + 1, false)).toBe(true);
  });

  it('uses hysteresis so collapse does not immediately re-expand', () => {
    // After collapse, a mid scroll (typical when top banners shrink) stays collapsed.
    expect(shouldCollapsePromos(40, false, true)).toBe(true);
    expect(shouldCollapsePromos(SCROLL_SHOW_PX + 1, false, true)).toBe(true);
    // Only re-expand when near the very top.
    expect(shouldCollapsePromos(SCROLL_SHOW_PX, false, true)).toBe(false);
    expect(shouldCollapsePromos(0, false, true)).toBe(false);
  });

  it('stays expanded when pinned open below threshold scroll', () => {
    expect(shouldCollapsePromos(200, true)).toBe(false);
    expect(shouldCollapsePromos(200, true, true)).toBe(false);
  });

  it('clears pin when scrolling past threshold', () => {
    expect(clearPinnedOnScroll(0, true)).toBe(true);
    expect(clearPinnedOnScroll(SCROLL_HIDE_PX, true)).toBe(true);
    expect(clearPinnedOnScroll(SCROLL_HIDE_PX + 1, true)).toBe(false);
  });

  it('compacts header after scrolling past threshold with hysteresis', () => {
    expect(shouldCompactHeader(0)).toBe(false);
    expect(shouldCompactHeader(SCROLL_HIDE_PX)).toBe(false);
    expect(shouldCompactHeader(SCROLL_HIDE_PX + 1)).toBe(true);
    expect(shouldCompactHeader(40, true)).toBe(true);
    expect(shouldCompactHeader(SCROLL_SHOW_PX, true)).toBe(false);
  });

  it('switches cookie notice to pill after scrolling past threshold with hysteresis', () => {
    expect(shouldUseCookiePill(0)).toBe(false);
    expect(shouldUseCookiePill(SCROLL_HIDE_PX)).toBe(false);
    expect(shouldUseCookiePill(SCROLL_HIDE_PX + 1)).toBe(true);
    expect(shouldUseCookiePill(40, true)).toBe(true);
    expect(shouldUseCookiePill(SCROLL_SHOW_PX, true)).toBe(false);
  });
});
