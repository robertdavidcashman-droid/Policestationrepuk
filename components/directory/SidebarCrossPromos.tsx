import Link from 'next/link';
import { PartnerOutboundLink } from '@/components/PartnerOutboundLink';
import {
  CONTACT_PHONE_TEL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_WHATSAPP_HREF,
} from '@/lib/contact-constants';
import { POLICESTATIONAGENT_KENT_RESOURCES_HREF } from '@/lib/policestationagent-promo';
import { WHATSAPP_JOIN_URL, WHATSAPP_JOIN_PHONE } from '@/lib/site-navigation';

/** Kent police station agent cover — sidebar companion to directory listings. */
export function SidebarKentAgentPromo() {
  return (
    <div className="rounded-xl border-2 border-[var(--gold)]/35 bg-[var(--gold-pale)]/40 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--navy)]">Promoted service</p>
      <p className="mt-1 text-sm font-bold text-[var(--navy)]">Kent police station agent</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
        Solicitor-led cover for Kent firms — separate from this directory.
      </p>
      <PartnerOutboundLink
        href={POLICESTATIONAGENT_KENT_RESOURCES_HREF}
        partner="policestationagent"
        placement="directory_sidebar_kent_resources"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs font-semibold text-[var(--navy)] underline"
      >
        Kent custody resources (free guide)
      </PartnerOutboundLink>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={CONTACT_PHONE_TEL}
          className="inline-flex min-h-[36px] flex-1 items-center justify-center rounded-lg bg-[var(--navy)] px-2 text-[11px] font-bold text-white no-underline"
        >
          {CONTACT_PHONE_DISPLAY}
        </a>
        <a
          href={CONTACT_WHATSAPP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[36px] flex-1 items-center justify-center rounded-lg border border-[var(--navy)]/20 bg-white px-2 text-[11px] font-semibold text-[var(--navy)] no-underline"
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}

/** Unified WhatsApp community — reps & firms. */
export function SidebarWhatsAppPromo() {
  return (
    <div className="rounded-xl border border-emerald-800/30 bg-gradient-to-b from-emerald-950 to-[#0a1f1a] p-4 text-white">
      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Community</p>
      <p className="mt-1 text-sm font-bold">WhatsApp group</p>
      <p className="mt-1 text-xs leading-relaxed text-emerald-100/90">
        Reps &amp; firms — text <span className="font-semibold text-white">{WHATSAPP_JOIN_PHONE}</span> to request
        access.
      </p>
      <a
        href={WHATSAPP_JOIN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block rounded-lg bg-[var(--gold)] py-2 text-center text-xs font-bold text-[var(--navy)] no-underline hover:bg-[var(--gold-hover)]"
      >
        Text to join
      </a>
      <Link
        href="/WhatsApp"
        className="mt-2 block text-center text-xs font-semibold text-emerald-200 underline hover:text-white"
      >
        How to join →
      </Link>
    </div>
  );
}
