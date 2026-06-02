import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo';
import { LegalDirectoryHero } from '@/components/legal-directory/LegalDirectoryHero';
import { LegalDirectoryDisclaimer } from '@/components/legal-directory/LegalDirectoryDisclaimer';
import { ClaimListingForm } from '@/components/legal-directory/ClaimListingForm';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';
import { getListingBySlug } from '@/lib/legal-directory/storage';
import { isUnclaimedSeededListing } from '@/lib/legal-directory/laa-seed';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return buildMetadata({
    title: 'Claim your listing — Legal Services Directory',
    description: 'Claim and complete your firm\u2019s listing in the criminal law legal services directory.',
    path: `${LEGAL_DIRECTORY_BASE}/claim/${slug}`,
    noIndex: true,
  });
}

export default async function ClaimListingPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing || !isUnclaimedSeededListing(listing)) notFound();

  return (
    <>
      <LegalDirectoryHero
        title={`Claim ${listing.businessName}`}
        description="This listing was created from published Legal Aid Agency data and is unclaimed. Claim it to confirm and complete your firm's details. We'll email a secure management link."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Legal Services Directory', href: LEGAL_DIRECTORY_BASE },
          { label: listing.businessName, href: `${LEGAL_DIRECTORY_BASE}/listing/${listing.slug}` },
          { label: 'Claim' },
        ]}
      />
      <div className="page-container section-pad max-w-xl space-y-8">
        <ClaimListingForm slug={listing.slug} businessName={listing.businessName} />
        <LegalDirectoryDisclaimer />
      </div>
    </>
  );
}
