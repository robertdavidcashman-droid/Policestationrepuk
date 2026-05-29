import { buildMetadata } from '@/lib/seo';
import { LegalDirectoryHero } from '@/components/legal-directory/LegalDirectoryHero';
import { DirectoryManagementRequestForm } from '@/components/legal-directory/DirectoryManagementRequestForm';
import { LegalDirectoryDisclaimer } from '@/components/legal-directory/LegalDirectoryDisclaimer';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';

export const metadata = buildMetadata({
  title: 'Manage Your Listing — Legal Services Directory',
  description:
    'Request secure access to amend or delete your Legal Services Directory listing. Changes take effect immediately.',
  path: `${LEGAL_DIRECTORY_BASE}/manage-listing`,
});

export default function ManageListingPage() {
  return (
    <>
      <LegalDirectoryHero
        title="Manage your listing"
        description="Enter the email address on your listing to receive a secure management link. Amendments and deletions take effect immediately on the public directory."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Legal Services Directory', href: LEGAL_DIRECTORY_BASE },
          { label: 'Manage listing' },
        ]}
      />
      <div className="page-container section-pad max-w-lg space-y-8">
        <DirectoryManagementRequestForm />
        <p className="text-sm text-[var(--muted)]">
          If email delivery is unavailable, contact the site administrator.
        </p>
        <LegalDirectoryDisclaimer />
      </div>
    </>
  );
}
