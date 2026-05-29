import { AdminGate } from '@/components/admin/AdminGate';
import { AdminShell } from '@/components/admin/AdminShell';
import { LegalDirectoryAdmin } from '@/components/legal-directory/LegalDirectoryAdmin';

export const dynamic = 'force-dynamic';

export default async function AdminLegalDirectoryReviewPage() {
  return (
    <AdminGate>
      {({ email }) => (
        <AdminShell
          active="legal-queue"
          adminEmail={email}
          title="Flagged legal directory listings"
          description="Optional view of higher-risk or suspended listings. New submissions are live immediately — use this queue to tidy up anything you want removed."
        >
          <LegalDirectoryAdmin reviewQueueOnly />
        </AdminShell>
      )}
    </AdminGate>
  );
}
