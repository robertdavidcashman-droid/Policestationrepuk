import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo';
import { LegalDirectoryHero } from '@/components/legal-directory/LegalDirectoryHero';
import { DirectoryEditForm } from '@/components/legal-directory/DirectoryEditForm';
import { resolveManagementToken } from '@/lib/legal-directory/storage';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({
  title: 'Edit listing — Legal Services Directory',
  description: 'Secure listing management.',
  path: `${LEGAL_DIRECTORY_BASE}/manage-listing`,
  noIndex: true,
});

type Props = { params: Promise<{ token: string }> };

export default async function ManageListingTokenPage({ params }: Props) {
  const { token } = await params;
  const decoded = decodeURIComponent(token);
  const resolved = await resolveManagementToken(decoded);
  if (!resolved) notFound();

  const { listing } = resolved;

  return (
    <>
      <LegalDirectoryHero
        title="Edit your listing"
        description={`Signed in as ${resolved.email}. Changes go live on the directory immediately.`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Legal Services Directory', href: LEGAL_DIRECTORY_BASE },
          { label: 'Manage listing', href: `${LEGAL_DIRECTORY_BASE}/manage-listing` },
          { label: 'Edit' },
        ]}
      />
      <div className="page-container section-pad max-w-2xl">
        <DirectoryEditForm listing={listing} token={decoded} />
      </div>
    </>
  );
}
