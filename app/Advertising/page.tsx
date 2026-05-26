import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  CUSTODYNOTE_BRAND_NAME,
  CUSTODYNOTE_DISCOUNT_CODE,
  CUSTODYNOTE_DISCOUNT_PCT,
  CUSTODYNOTE_MEMBER_PRICE_GBP,
  CUSTODYNOTE_PLATFORM_LINE,
  CUSTODYNOTE_PRICE_GBP,
  CUSTODYNOTE_SITE,
} from '@/lib/custodynote-promo';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Advertising & Promotions Disclosure | PoliceStationRepUK',
  description:
    'Information about advertising, promotions, and sponsored content on PoliceStationRepUK. How we label advertisements and what constitutes editorial vs promoted content.',
  path: '/Advertising',
});

export default function AdvertisingPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Advertising & Promotions Disclosure' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Advertising &amp; Promotions Disclosure</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white">
            How advertising, promoted services, and sponsored content are handled on
            PoliceStationRepUK.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-3xl space-y-10">

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Advertising on this site</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              PoliceStationRepUK is primarily a free directory connecting criminal defence firms with
              accredited police station representatives. In addition to this core function, the site
              features advertisements and promotions for related products and services.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              All advertisements and promoted services are clearly labelled so users can distinguish
              them from editorial content and core directory listings.
            </p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Current promoted services</h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
                <h3 className="font-bold text-[var(--navy)]">{CUSTODYNOTE_BRAND_NAME}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Desktop attendance note software for criminal defence solicitors and accredited
                  police station representatives. Available for {CUSTODYNOTE_PLATFORM_LINE.toLowerCase()}.
                  Developed by Defence Legal Services Ltd (trading as
                  Police Station Agent). Headline pricing: £{CUSTODYNOTE_PRICE_GBP}/month after a 30-day free trial,
                  with 6-month and annual options at checkout. PoliceStationRepUK readers pay
                  £{CUSTODYNOTE_MEMBER_PRICE_GBP}/month using code{' '}
                  <span className="font-mono font-semibold text-[var(--navy)]">{CUSTODYNOTE_DISCOUNT_CODE}</span>{' '}
                  ({CUSTODYNOTE_DISCOUNT_PCT}% off).
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Website:{' '}
                  <a href={CUSTODYNOTE_SITE} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--navy)] underline">
                    custodynote.com
                  </a>
                </p>
              </div>
              <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
                <h3 className="font-bold text-[var(--navy)]">Police Station Agent (Kent)</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Experienced criminal solicitor providing police station agent cover for Kent law
                  firms. Operated by Robert Cashman via Tuckers Solicitors LLP. This is a separate
                  legal service, not part of the PoliceStationRepUK directory function.
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Website:{' '}
                  <a href="https://www.policestationagent.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--navy)] underline">
                    policestationagent.com
                  </a>
                </p>
              </div>
              <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
                <h3 className="font-bold text-[var(--navy)]">Featured / Premium Listings</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Some representative listings may be promoted or featured for greater visibility.
                  These are labelled as &ldquo;Promoted Listings&rdquo; where they appear. Firms
                  should still verify accreditation and credentials independently before instructing
                  any representative.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Labelling system</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              We use clear labels to distinguish promoted content from editorial and directory
              content:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <li><strong className="text-[var(--navy)]">Advertisement</strong> — paid placement for a product or service</li>
              <li><strong className="text-[var(--navy)]">Featured Product</strong> — promoted product with a commercial relationship</li>
              <li><strong className="text-[var(--navy)]">Promoted Service</strong> — a service from a related business</li>
              <li><strong className="text-[var(--navy)]">Promoted Listings</strong> — representative profiles with paid visibility</li>
              <li><strong className="text-[var(--navy)]">Sponsored Service</strong> — content supported by a commercial partner</li>
            </ul>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">For advertisers</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              If you are a legal technology provider, training provider, or other business relevant
              to the criminal defence profession and would like to advertise on PoliceStationRepUK,
              please contact us.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Police station representatives looking to enhance their directory listing visibility
              should visit the{' '}
              <Link href="/GoFeatured" className="font-semibold text-[var(--navy)] underline">
                Featured Listings
              </Link>{' '}
              page.
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Questions?</h2>
            <p className="mt-2 text-sm text-white">
              Contact us for advertising enquiries or questions about how we handle promotions.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/Contact" className="btn-gold no-underline">
                Contact Us
              </Link>
              <Link href="/About" className="btn-outline !border-white/30 !text-white no-underline hover:!border-[var(--gold)]">
                About PoliceStationRepUK
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
