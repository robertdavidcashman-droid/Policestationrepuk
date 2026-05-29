import packageJson from '../package.json';

/** Site release version (from package.json / build env). */
export const SITE_VERSION =
  process.env.NEXT_PUBLIC_SITE_VERSION?.trim() || packageJson.version;

/**
 * Build / release date shown in the footer (YYYY-MM-DD, UK display).
 * Injected at build time via next.config env.
 */
export const SITE_BUILD_DATE =
  process.env.NEXT_PUBLIC_SITE_BUILD_DATE?.trim() ||
  new Date().toISOString().slice(0, 10);

export function formatSiteBuildDateUk(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${d} ${months[m - 1] ?? ''} ${y}`;
}
