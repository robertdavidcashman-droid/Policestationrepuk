/** Scroll distance before full promo banners collapse (px). */
export const SCROLL_HIDE_PX = 56;

/**
 * Scroll distance below which collapsed chrome may expand again (px).
 * Must be well below SCROLL_HIDE_PX so collapsing tall top banners (which
 * reduces document height and can drop scrollY) does not immediately re-expand
 * and cause a bounce loop.
 */
export const SCROLL_SHOW_PX = 12;

/** Whether full promo banners should be hidden (restore bar may still show). */
export function shouldCollapsePromos(
  scrollY: number,
  pinnedOpen: boolean,
  currentlyCollapsed = false,
  hideThreshold = SCROLL_HIDE_PX,
  showThreshold = SCROLL_SHOW_PX,
): boolean {
  if (pinnedOpen) return false;
  if (currentlyCollapsed) {
    // Stay collapsed until the user is clearly back near the top.
    return scrollY > showThreshold;
  }
  return scrollY > hideThreshold;
}

/** Clears pinned-open when user scrolls past the hide threshold. */
export function clearPinnedOnScroll(
  scrollY: number,
  pinnedOpen: boolean,
  threshold = SCROLL_HIDE_PX,
): boolean {
  if (scrollY > threshold) return false;
  return pinnedOpen;
}

/** Whether sticky header should use compact sizing (hysteresis with promos). */
export function shouldCompactHeader(
  scrollY: number,
  currentlyCompact = false,
  hideThreshold = SCROLL_HIDE_PX,
  showThreshold = SCROLL_SHOW_PX,
): boolean {
  if (currentlyCompact) {
    return scrollY > showThreshold;
  }
  return scrollY > hideThreshold;
}

/** Whether cookie notice should collapse to a floating pill while reading. */
export function shouldUseCookiePill(
  scrollY: number,
  currentlyPill = false,
  hideThreshold = SCROLL_HIDE_PX,
  showThreshold = SCROLL_SHOW_PX,
): boolean {
  if (currentlyPill) {
    return scrollY > showThreshold;
  }
  return scrollY > hideThreshold;
}
