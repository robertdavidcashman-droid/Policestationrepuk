import {
  POLICESTATIONAGENT_CTA,
  POLICESTATIONAGENT_HOME_HREF,
  POLICESTATIONAGENT_SITE,
} from '@/lib/policestationagent-promo';

type Props = {
  className?: string;
  linkClassName?: string;
};

/** Kent-only solicitor promo — do not use on national pages without area context. */
export function PoliceStationAgentKentCta({ className, linkClassName }: Props) {
  return (
    <p className={className}>
      {POLICESTATIONAGENT_CTA}{' '}
      <a
        href={POLICESTATIONAGENT_HOME_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className={
          linkClassName ??
          'font-semibold text-[var(--gold-link)] underline underline-offset-2 hover:text-[var(--gold)]'
        }
      >
        Visit {POLICESTATIONAGENT_SITE.replace(/^https?:\/\/(www\.)?/, '')}
      </a>
    </p>
  );
}
