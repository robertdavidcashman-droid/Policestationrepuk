import { SITE_BUILD_DATE, SITE_VERSION, formatSiteBuildDateUk } from '@/lib/site-version';

/** Small version + build date shown site-wide in the footer. */
export function SiteVersionStamp({ className = '' }: { className?: string }) {
  return (
    <p
      className={`font-mono text-[10px] leading-relaxed tracking-wide text-white/45 ${className}`.trim()}
      aria-label={`Site version ${SITE_VERSION}, built ${formatSiteBuildDateUk(SITE_BUILD_DATE)}`}
    >
      v{SITE_VERSION} · {formatSiteBuildDateUk(SITE_BUILD_DATE)}
    </p>
  );
}
