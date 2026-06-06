import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/seo-layer/config';

export const metadata = buildMetadata({
  title: 'Privacy Policy — How PoliceStationRepUK Protects Your Data',
  description:
    'How PoliceStationRepUK collects, stores, and protects your personal data. Read about your data rights under UK GDPR and how to request corrections or removal.',
  path: '/Privacy',
});

export default function PrivacyPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Privacy Policy' },
            ]}
          />
          <header className="mb-10">
            <h1 className="text-h1 text-white">Privacy Policy</h1>
            <p className="mt-2 text-sm text-slate-300">Last updated: 4 January 2026</p>
          </header>
        </div>
      </section>

      <div className="page-container">
      <div className="max-w-3xl space-y-10">
        {/* Who Operates */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">Who Operates This Website</h2>
          <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]">
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              <li>
                <span className="font-semibold text-[var(--navy)]">Operator:</span> Defence
                Legal Services Ltd
              </li>
              <li>
                <span className="font-semibold text-[var(--navy)]">Email:</span>{' '}
                <a
                  href="mailto:robertcashman@defencelegalservices.co.uk"
                  className="text-[var(--gold-link)] hover:underline"
                >
                  robertcashman@defencelegalservices.co.uk
                </a>
              </li>
              <li>
                <span className="font-semibold text-[var(--navy)]">Website:</span>{' '}
                <a
                  href={SITE_URL}
                  className="text-[var(--gold-link)] hover:underline"
                  rel="noopener noreferrer"
                >
                  {SITE_URL.replace(/^https?:\/\//, '')}
                </a>
              </li>
            </ul>
          </div>
          <p className="mt-4 text-sm text-[var(--muted)]">
            <Link href="/Advertising" className="font-semibold text-[var(--navy)] underline">
              Advertising &amp; Promotions Disclosure
            </Link>
            {' '}
            — how we label third-party promotions on this site.
          </p>
        </section>

        {/* What Data We Collect */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">What Data We Collect</h2>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            For Representatives Who Register
          </h3>
          <ul className="mb-6 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="mt-0.5 text-emerald-600">&#x2022;</span>Full name
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-emerald-600">&#x2022;</span>Email address
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-emerald-600">&#x2022;</span>Phone number
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-emerald-600">&#x2022;</span>Date of birth
              <span className="text-xs italic">(private &mdash; not shown publicly)</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-emerald-600">&#x2022;</span>Address and postcode
              <span className="text-xs italic">(private &mdash; not shown publicly)</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-emerald-600">&#x2022;</span>DSCC PIN number
              <span className="text-xs italic">(private &mdash; not shown publicly)</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-emerald-600">&#x2022;</span>County and stations covered
              <span className="text-xs italic">(public)</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-emerald-600">&#x2022;</span>Availability and
              accreditation type <span className="text-xs italic">(public)</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-emerald-600">&#x2022;</span>Optional notes and
              promotional text <span className="text-xs italic">(public if provided)</span>
            </li>
          </ul>

          <h3 className="mb-3 text-base font-semibold text-[var(--navy)]">
            For All Website Visitors
          </h3>
          <ul className="space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="mt-0.5 text-emerald-600">&#x2022;</span>Analytics data (page views,
              device type, approximate location via Google Analytics)
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-emerald-600">&#x2022;</span>Cookies for website
              functionality (see our{' '}
              <Link href="/Cookies" className="text-[var(--gold-link)] hover:underline">
                Cookies Policy
              </Link>
              )
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-emerald-600">&#x2022;</span>
              Questions you submit to the guided assistant are processed to return matching FAQ
              answers from our published guides. We do not store the text of assistant questions in
              our database; rate-limit counters may record anonymous request counts by IP address.
            </li>
          </ul>
        </section>

        {/* Public vs Private */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">
            What Data Is Public vs Private
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]">
              <h3 className="mb-3 text-sm font-semibold text-[var(--navy)]">
                Publicly Visible in Directory
              </h3>
              <ul className="space-y-1.5 text-sm text-[var(--muted)]">
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2713;</span>Name
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2713;</span>Phone number and email (behind
                  &ldquo;Show Contact Details&rdquo; button)
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2713;</span>County and stations covered
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2713;</span>Availability and accreditation
                  type
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">&#x2713;</span>Optional notes, website URL,
                  WhatsApp link
                </li>
              </ul>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]">
              <h3 className="mb-3 text-sm font-semibold text-[var(--navy)]">
                Never Shown Publicly
              </h3>
              <ul className="space-y-1.5 text-sm text-[var(--muted)]">
                <li className="flex gap-2">
                  <span className="text-red-500">&#x2717;</span>Date of birth
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">&#x2717;</span>Full address and postcode
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">&#x2717;</span>DSCC PIN number
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500">&#x2717;</span>Any data marked &ldquo;private&rdquo;
                  in your profile
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How We Use Your Data */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">How We Use Your Data</h2>
          <p className="mb-3 text-sm font-semibold text-[var(--navy)]">We use your data to:</p>
          <ul className="mb-6 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>Display your profile in the public
              directory
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>Allow criminal defence firms to
              search and contact you
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>Verify your registration details
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>Send you updates about the directory
              (if you opted in to marketing)
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2713;</span>Improve the website and directory
              service
            </li>
          </ul>
          <p className="mb-3 text-sm font-semibold text-[var(--navy)]">We will never:</p>
          <ul className="space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-red-500">&#x2717;</span>Sell your data to third parties
            </li>
            <li className="flex gap-2">
              <span className="text-red-500">&#x2717;</span>Share your private data (address, DOB,
              DSCC PIN) publicly
            </li>
            <li className="flex gap-2">
              <span className="text-red-500">&#x2717;</span>Use your data for purposes unrelated to
              the directory
            </li>
          </ul>
        </section>

        {/* Your Data Rights */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">Your Data Rights</h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            Under UK GDPR, you have the right to:
          </p>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            <li>
              <span className="font-semibold text-[var(--navy)]">Access:</span> Request a copy
              of all data we hold about you
            </li>
            <li>
              <span className="font-semibold text-[var(--navy)]">Rectification:</span> Correct
              inaccurate or incomplete data
            </li>
            <li>
              <span className="font-semibold text-[var(--navy)]">Erasure:</span> Request
              deletion of your profile and data
            </li>
            <li>
              <span className="font-semibold text-[var(--navy)]">Restriction:</span>{' '}
              Temporarily suspend use of your data
            </li>
            <li>
              <span className="font-semibold text-[var(--navy)]">Portability:</span> Receive
              your data in a structured format
            </li>
            <li>
              <span className="font-semibold text-[var(--navy)]">Object:</span> Object to
              processing of your data for marketing
            </li>
          </ul>
        </section>

        {/* How to Request Correction or Removal */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">
            How to Request Correction or Removal
          </h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            If you are a representative and want to:
          </p>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            <li>
              <span className="font-semibold text-[var(--navy)]">Update your profile:</span>{' '}
              Log in and edit via your Profile page
            </li>
            <li>
              <span className="font-semibold text-[var(--navy)]">
                Delete your profile entirely:
              </span>{' '}
              Email us at{' '}
              <a
                href="mailto:robertcashman@defencelegalservices.co.uk"
                className="text-[var(--gold-link)] hover:underline"
              >
                robertcashman@defencelegalservices.co.uk
              </a>{' '}
              with &ldquo;Delete My Profile&rdquo; in the subject line
            </li>
            <li>
              <span className="font-semibold text-[var(--navy)]">
                Report inaccurate data:
              </span>{' '}
              Email us or use the &ldquo;Suggest Edit&rdquo; feature on station pages
            </li>
            <li>
              <span className="font-semibold text-[var(--navy)]">
                Request a data export:
              </span>{' '}
              Email us and we&apos;ll send you all data we hold within 30 days
            </li>
          </ul>
          <p className="mt-4 text-sm text-[var(--muted)]">
            <span className="font-semibold text-[var(--navy)]">Response time:</span> We aim to
            respond to all data requests within 7 working days.
          </p>
        </section>

        {/* How Long We Keep Your Data */}
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">How Long We Keep Your Data</h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            We retain representative profiles for as long as:
          </p>
          <ul className="mb-4 space-y-1.5 text-sm text-[var(--muted)]">
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>Your account remains active
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">&#x2022;</span>You continue to use the directory
              service
            </li>
          </ul>
          <p className="text-sm text-[var(--muted)]">
            If you request deletion or your account is inactive for 3+ years, we will permanently
            delete all your personal data within 30 days, except where we are legally required to
            retain records (e.g., payment records for tax purposes are kept for 7 years).
          </p>
        </section>

        {/* Contact CTA */}
        <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center shadow-[var(--card-shadow)]">
          <h2 className="text-h2 mb-2 text-[var(--navy)]">Questions About Your Data?</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Contact our data protection officer for any privacy concerns.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/Contact"
              className="rounded-lg bg-[var(--accent)] px-7 py-3 text-sm font-semibold text-white no-underline hover:bg-[var(--accent-hover)]"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </div>
    </>
  );
}
