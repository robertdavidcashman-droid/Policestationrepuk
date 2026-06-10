'use client';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { AnalyticsEvents } from '@/lib/analytics';

type Partner = 'custodynote' | 'psrtrain' | 'policestationagent';

interface PartnerOutboundLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  partner: Partner;
  placement: string;
  children: ReactNode;
}

/** Tracked outbound link to a sister site — fires GA4 partner click events. */
export function PartnerOutboundLink({
  href,
  partner,
  placement,
  children,
  onClick,
  ...rest
}: PartnerOutboundLinkProps) {
  return (
    <a
      href={href}
      onClick={(e) => {
        AnalyticsEvents.outboundPartnerClick(partner, placement);
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
