import { notFound } from 'next/navigation';
import Link from 'next/link';
import { buildMetadata, breadcrumbSchema } from '@/lib/seo';
import { legalDirectoryListingSchema } from '@/lib/legal-directory/schema';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LegalDirectoryDisclaimer } from '@/components/legal-directory/LegalDirectoryDisclaimer';
import {
  getListingBySlug,
  isPubliclyVisible,
  toPublicListing,
} from '@/lib/legal-directory/storage';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';
import { phoneToTelHref } from '@/lib/phone';
import { SITE_URL } from '@/lib/seo-layer/config';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing || !isPubliclyVisible(listing)) {
    return buildMetadata({
      title: 'Listing not found',
      description: 'This listing is not available in the public directory.',
      path: `${LEGAL_DIRECTORY_BASE}/listing/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: listing.seoTitle,
    description: listing.seoDescription || listing.description.slice(0, 160),
    path: `${LEGAL_DIRECTORY_BASE}/listing/${listing.slug}`,
  });
}

export default async function ListingProfilePage({ params }: Props) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing || !isPubliclyVisible(listing)) notFound();

  const pub = toPublicListing(listing);
  const specialisms = pub.specialisms.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Legal Services Directory', url: `${SITE_URL}${LEGAL_DIRECTORY_BASE}` },
    { name: pub.businessName, url: `${SITE_URL}${LEGAL_DIRECTORY_BASE}/listing/${pub.slug}` },
  ]);

  const listingSchema = legalDirectoryListingSchema(pub);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <JsonLd data={listingSchema} />
      <section className="bg-[var(--navy)] py-10">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Legal Services Directory', href: LEGAL_DIRECTORY_BASE },
              { label: 'Search', href: `${LEGAL_DIRECTORY_BASE}/search` },
              { label: pub.businessName },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">{pub.businessName}</h1>
          <p className="mt-2 text-slate-300">
            {pub.category} · {[pub.town, pub.county].filter(Boolean).join(', ')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {pub.verified && (
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200">
                Verified
              </span>
            )}
            {pub.featured && (
              <span className="rounded-full bg-[var(--gold)]/20 px-3 py-1 text-xs font-bold text-[var(--gold)]">
                Featured
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="page-container section-pad">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <section className="card-surface p-6">
              <h2 className="text-h3 text-[var(--navy)]">About</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">
                {pub.description}
              </p>
            </section>

            {specialisms.length > 0 && (
              <section className="card-surface p-6">
                <h2 className="text-h3 text-[var(--navy)]">Specialisms</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {specialisms.map((s) => (
                    <span key={s} className="rounded-full bg-[var(--gold-pale)] px-3 py-1 text-sm text-[var(--navy)]">
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {(pub.areasCovered || pub.policeStationsCovered || pub.courtsCovered) && (
              <section className="card-surface p-6">
                <h2 className="text-h3 text-[var(--navy)]">Coverage</h2>
                {pub.areasCovered && (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    <strong>Areas:</strong> {pub.areasCovered}
                  </p>
                )}
                {pub.policeStationsCovered && (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    <strong>Police stations:</strong> {pub.policeStationsCovered}
                  </p>
                )}
                {pub.courtsCovered && (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    <strong>Courts:</strong> {pub.courtsCovered}
                  </p>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <div className="card-surface p-6">
              <h2 className="text-h4 text-[var(--navy)]">Contact</h2>
              {pub.contactPerson && (
                <p className="mt-2 text-sm text-[var(--muted)]">{pub.contactPerson}</p>
              )}
              {pub.phone && (
                <a href={phoneToTelHref(pub.phone)} className="btn-gold mt-4 block text-center no-underline">
                  Call {pub.phone}
                </a>
              )}
              <a href={`mailto:${pub.email}`} className="btn-outline mt-2 block text-center no-underline">
                Email
              </a>
              {pub.websiteUrl && (
                <a
                  href={pub.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline mt-2 block text-center no-underline"
                >
                  Website
                </a>
              )}
              <p className="mt-4 text-xs text-[var(--muted)]">
                Legal Aid: {pub.legalAidStatus === 'yes' ? 'Yes' : pub.legalAidStatus === 'no' ? 'No' : 'N/A'}
                {pub.availability24Hour ? ' · 24-hour availability' : ''}
              </p>
            </div>

            {(pub.regulatoryBody || pub.regulatoryNumber) && (
              <div className="card-surface p-6 text-sm text-[var(--muted)]">
                <h3 className="font-semibold text-[var(--navy)]">Regulatory</h3>
                {pub.regulatoryBody && <p className="mt-2">{pub.regulatoryBody}</p>}
                {pub.regulatoryNumber && <p>{pub.regulatoryNumber}</p>}
                {pub.accreditationDetails && (
                  <p className="mt-2 whitespace-pre-wrap">{pub.accreditationDetails}</p>
                )}
              </div>
            )}

            <Link
              href={`${LEGAL_DIRECTORY_BASE}/category/${pub.categorySlug}`}
              className="text-sm font-semibold text-[var(--gold-link)] no-underline hover:underline"
            >
              More in {pub.category}
            </Link>
          </aside>
        </div>

        <div className="mt-10">
          <LegalDirectoryDisclaimer />
        </div>
      </div>
    </>
  );
}
