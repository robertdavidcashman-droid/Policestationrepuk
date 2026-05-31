/** Scroll distance before full promo banners collapse (px). */
export const SCROLL_HIDE_PX = 56;

/** Whether full promo banners should be hidden (restore bar may still show). */
export function shouldCollapsePromos(
  scrollY: number,
  pinnedOpen: boolean,
  threshold = SCROLL_HIDE_PX,
): boolean {
  if (scrollY <= threshold) return false;
  if (pinnedOpen) return false;
  return true;
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

/** Whether sticky header should use compact sizing (same threshold as promos). */
export function shouldCompactHeader(scrollY: number, threshold = SCROLL_HIDE_PX): boolean {
  return scrollY > threshold;
}

/** Whether cookie notice should collapse to a floating pill while reading. */
export function shouldUseCookiePill(scrollY: number, threshold = SCROLL_HIDE_PX): boolean {
  return scrollY > threshold;
}
