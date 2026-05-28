import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FirmDirectory } from '@/components/FirmDirectory';
import { LegalDirectoryPromo } from '@/components/legal-directory/LegalDirectoryPromo';
import { buildMetadata } from '@/lib/seo';
import { getAllLawFirms } from '@/lib/data';
import { FACEBOOK_GROUP_URL } from '@/lib/site-navigation';

export const metadata = buildMetadata({
  title: 'Criminal Defence Law Firms Directory — England & Wales',
  description:
    'Searchable directory of criminal defence law firms in England and Wales. Filter by county and specialism, and find firms that take police station cover work.',
  path: '/Firms',
});

const MAILTO_BASE = 'mailto:robertcashman@defencelegalservices.co.uk';

export default async function FirmsPage() {
  const firms = await getAllLawFirms();

  const psWorkCount = firms.filter((f) => f.policeStationWork).length;
  const dutyCount = firms.filter((f) => f.dutySolicitorScheme).length;

  const stats = [
    { label: 'Active Firms', value: String(firms.length) },
    { label: 'Police Station Work', value: String(psWorkCount) },
    { label: 'Duty Solicitor Scheme', value: String(dutyCount) },
  ];

  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Law Firms Directory' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Criminal Defence Law Firms Directory</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            English and Welsh criminal defence firms — searchable by name, county and specialism.
            Every firm listed here has been checked against the SRA register and has an active
            website at the time of curation.
          </p>
        </div>
      </section>

      <div className="page-container">
        {/* Stats */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 text-center shadow-[var(--card-shadow)]"
            >
              <p className="text-3xl font-bold text-[var(--gold-link)]">{stat.value}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 rounded-[var(--radius)] border border-yellow-200 bg-yellow-50 p-4 text-sm leading-relaxed text-yellow-800">
          This directory lists English &amp; Welsh criminal defence firms with active websites,
          curated from public SRA data and community submissions. Entries marked
          &ldquo;Police Station&rdquo; have indicated they accept police station cover work.
          Listings here are informational — please verify details directly with the firm
          before relying on this information. Are we missing your firm, or is something out
          of date? <a href={`${MAILTO_BASE}?subject=Firm%20Directory%20Correction`} className="font-semibold underline">Let us know</a>.
        </div>

        <LegalDirectoryPromo className="mb-8" />

        {/* Searchable directory */}
        <section className="mb-12">
          <FirmDirectory firms={firms} />
        </section>

        {/* Expand Your Reach */}
        <section className="mb-12">
          <h2 className="text-h2 mb-2 text-[var(--navy)]">Expand Your Reach</h2>
          <p className="mb-6 text-[var(--muted)]">
            Get your firm in front of hundreds of police station representatives actively looking for
            work across England &amp; Wales.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]">
              <p className="text-lg font-semibold text-[var(--navy)]">Free Listing</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Get your firm listed in our directory completely free of charge. Reach accredited reps
                actively looking for firms to work with.
              </p>
              <a
                href={`${MAILTO_BASE}?subject=Free%20Listing%20Request`}
                className="btn-gold mt-4 inline-block no-underline"
              >
                Request Free Listing
              </a>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]">
              <p className="text-lg font-semibold text-[var(--navy)]">Link Advert</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Premium link placement in our directory — your firm gets prominent positioning and
                increased visibility among working reps.
              </p>
              <a
                href={`${MAILTO_BASE}?subject=Link%20Advert%20Enquiry`}
                className="btn-outline mt-4 inline-block no-underline"
              >
                Enquire About Ads
              </a>
            </div>
          </div>
        </section>

        {/* Join the Community */}
        <section className="mb-12 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8">
          <h2 className="text-h2 mb-4 text-white">Join the Community</h2>
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-slate-300">
            Whether you&apos;re a firm looking to post cover requests or want to stay connected
            with the criminal defence community, join our groups to network, share updates, and
            find work.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/WhatsApp"
              className="rounded-[var(--radius)] border border-white/10 bg-white/5 p-5 no-underline transition-colors hover:bg-white/10"
            >
              <p className="font-semibold text-white">WhatsApp group (reps &amp; firms)</p>
              <p className="mt-1 text-sm text-slate-300">
                One community — firms post cover; accredited reps respond. Verified before joining.
              </p>
            </Link>
            <a
              href={FACEBOOK_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[var(--radius)] border border-white/10 bg-white/5 p-5 no-underline transition-colors hover:bg-white/10"
            >
              <p className="font-semibold text-white">Facebook Group</p>
              <p className="mt-1 text-sm text-slate-300">
                Open to all — discuss industry news and connect with colleagues.
              </p>
            </a>
          </div>
        </section>

        {/* Leave a Review */}
        <section className="mb-12">
          <h2 className="text-h2 mb-2 text-[var(--navy)]">Worked for a Firm? Leave a Review</h2>
          <p className="mb-4 text-[var(--muted)]">
            Help fellow reps by sharing your experience — did the firm pay on time? Were you treated
            professionally? Your anonymous review helps others make informed decisions.
          </p>
          <a
            href={`${MAILTO_BASE}?subject=Firm%20Review%20Submission`}
            className="btn-gold inline-block no-underline"
          >
            Submit a Review
          </a>
        </section>
      </div>
    </>
  );
}
