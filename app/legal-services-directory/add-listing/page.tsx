import { buildMetadata } from '@/lib/seo';
import { LegalDirectoryHero } from '@/components/legal-directory/LegalDirectoryHero';
import { DirectorySubmissionForm } from '@/components/legal-directory/DirectorySubmissionForm';
import { LegalDirectoryDisclaimer } from '@/components/legal-directory/LegalDirectoryDisclaimer';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';

export const metadata = buildMetadata({
  title: 'Add a Free Listing — Legal Services Directory',
  description:
    'Submit a free directory listing for your criminal law or criminal justice-related practice. Listings go live immediately after submission.',
  path: `${LEGAL_DIRECTORY_BASE}/add-listing`,
});

export default function AddListingPage() {
  return (
    <>
      <LegalDirectoryHero
        title="Add a Free Listing"
        description="Submit your organisation for a free listing. It will appear on the directory immediately. The site administrator receives an email copy with links to amend or remove if needed."
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
