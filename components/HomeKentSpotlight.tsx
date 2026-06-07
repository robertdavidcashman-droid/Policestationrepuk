import {
  CONTACT_PHONE_TEL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_WHATSAPP_HREF,
} from '@/lib/contact-constants';
import { AdvertisementLabel } from './AdvertisementLabel';
export function HomeKentSpotlight() {
  return (
    <section className="section-pad relative border-y-2 border-[var(--gold)]/30 bg-gradient-to-br from-[var(--gold-pale)] via-white to-[var(--gold-pale)]" aria-labelledby="kent-agency-heading">
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl text-center">
          <AdvertisementLabel variant="gold" label="Promoted Service" />
          <h2 id="kent-agency-heading" className="text-h3 mt-3 text-[var(--navy)]">
            Kent Police Station Agent Cover
          </h2>
          <p className="mt-2 text-sm font-medium text-[var(--navy)]/85">
            Experienced solicitor providing police station agent cover for Kent law firms — daytime and
            evening attendance across all Kent custody suites. Operated independently by Robert Cashman
            via Tuckers Solicitors LLP.
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            This is a separate service from the PoliceStationRepUK directory.{' '}
            <a
              href="https://www.policestationagent.com?utm_source=policestationrepuk&utm_medium=web&utm_campaign=directory"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--navy)] underline"
            >
              Need a solicitor in Kent? Visit policestationagent.com
            </a>
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href={CONTACT_PHONE_TEL} className="btn-gold !text-sm">
              {CONTACT_PHONE_DISPLAY}
            </a>
            <a
              href={CONTACT_WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline !text-sm"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
