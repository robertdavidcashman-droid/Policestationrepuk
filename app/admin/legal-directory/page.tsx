import { AdminGate } from '@/components/admin/AdminGate';
import { AdminShell } from '@/components/admin/AdminShell';
import { LegalDirectoryAdmin } from '@/components/legal-directory/LegalDirectoryAdmin';

export const dynamic = 'force-dynamic';

export default async function AdminLegalDirectoryPage() {
  return (
    <AdminGate>
      {({ email }) => (
        <AdminShell
          active="legal"
          adminEmail={email}
          title="Legal Services Directory"
          description="All listings publish immediately. Use this area to search, feature, suspend, or remove entries. You also receive email copies with amend and delete buttons."
        >
          <LegalDirectoryAdmin />
        </AdminShell>
      )}
    </AdminGate>
  );
}
