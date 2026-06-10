import {
  POLICESTATIONAGENT_CTA,
  POLICESTATIONAGENT_HOME_HREF,
  POLICESTATIONAGENT_SITE,
} from '@/lib/policestationagent-promo';
import { PartnerOutboundLink } from '@/components/PartnerOutboundLink';

type Props = {
  className?: string;
  linkClassName?: string;
  /** GA4 placement override */
  placement?: string;
};

/** Kent-only solicitor promo — do not use on national pages without area context. */
export function PoliceStationAgentKentCta({ className, linkClassName, placement = 'kent_cta' }: Props) {
  return (
    <p className={className}>
      {POLICESTATIONAGENT_CTA}{' '}
      <PartnerOutboundLink
        href={POLICESTATIONAGENT_HOME_HREF}
        partner="policestationagent"
        placement={placement}
        target="_blank"
        rel="noopener noreferrer"
        className={
          linkClassName ??
          'font-semibold text-[var(--gold-link)] underline underline-offset-2 hover:text-[var(--gold)]'
        }
      >
        Visit {POLICESTATIONAGENT_SITE.replace(/^https?:\/\/(www\.)?/, '')}
      </PartnerOutboundLink>
    </p>
  );
}
