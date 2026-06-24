import { AdminGate } from '@/components/admin/AdminGate';
import { AdminShell } from '@/components/admin/AdminShell';
import { StationContactsAdmin } from '@/components/admin/StationContactsAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StationContactsAdminPage() {
  return (
    <AdminGate>
      {({ email }) => (
        <AdminShell
          active="station-contacts"
          adminEmail={email}
          title="Station contacts monitor"
          description="Automated custody discovery and community corrections — review and approve before numbers publish. No CSV import."
        >
          <StationContactsAdmin />
        </AdminShell>
      )}
    </AdminGate>
  );
}
