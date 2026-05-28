import { buildMetadata } from '@/lib/seo';
import { LegalDirectoryHero } from '@/components/legal-directory/LegalDirectoryHero';
import { DirectoryManagementRequestForm } from '@/components/legal-directory/DirectoryManagementRequestForm';
import { LegalDirectoryDisclaimer } from '@/components/legal-directory/LegalDirectoryDisclaimer';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';

export const metadata = buildMetadata({
  title: 'Manage Your Listing — Legal Services Directory',
  description:
    'Request secure access to amend or delete your Legal Services Directory listing. Changes require review before publication.',
  path: `${LEGAL_DIRECTORY_BASE}/manage-listing`,
});

export default function ManageListingPage() {
  return (
    <>
      <LegalDirectoryHero
        title="Manage your listing"
        description="Enter the email address on your listing to receive a secure management link. You cannot edit a listing without verifying ownership. Amendments and deletions are reviewed before taking effect."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Legal Services Directory', href: LEGAL_DIRECTORY_BASE },
          { label: 'Manage listing' },
        ]}
      />
      <div className="page-container section-pad max-w-lg space-y-8">
        <DirectoryManagementRequestForm />
        <p className="text-sm text-[var(--muted)]">
          If email delivery is unavailable, amendment requests are stored for administrator review.
          {/* TODO: connect additional ownership verification (SMS / SRA lookup) if required */}
        </p>
        <LegalDirectoryDisclaimer />
      </div>
    </>
  );
}
