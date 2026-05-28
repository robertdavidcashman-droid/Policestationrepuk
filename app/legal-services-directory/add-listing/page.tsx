import { buildMetadata } from '@/lib/seo';
import { LegalDirectoryHero } from '@/components/legal-directory/LegalDirectoryHero';
import { DirectorySubmissionForm } from '@/components/legal-directory/DirectorySubmissionForm';
import { LegalDirectoryDisclaimer } from '@/components/legal-directory/LegalDirectoryDisclaimer';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';

export const metadata = buildMetadata({
  title: 'Add a Free Listing — Legal Services Directory',
  description:
    'Submit a free directory listing for your criminal law or criminal justice-related practice. Listings are reviewed before publication.',
  path: `${LEGAL_DIRECTORY_BASE}/add-listing`,
});

export default function AddListingPage() {
  return (
    <>
      <LegalDirectoryHero
        title="Add a Free Listing"
        description="Submit your organisation for review. Listings are not published automatically until moderated. Suspicious or spam submissions are referred to the site administrator."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Legal Services Directory', href: LEGAL_DIRECTORY_BASE },
          { label: 'Add a Listing' },
        ]}
      />
      <div className="page-container section-pad max-w-3xl space-y-8">
        <DirectorySubmissionForm />
        <LegalDirectoryDisclaimer />
      </div>
    </>
  );
}
