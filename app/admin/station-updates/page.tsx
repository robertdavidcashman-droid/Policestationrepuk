import { AdminGate } from '@/components/admin/AdminGate';
import { AdminShell } from '@/components/admin/AdminShell';
import { StationUpdatesAdmin } from '@/components/admin/StationUpdatesAdmin';
import {
  getAllStationOverrides,
  getPendingStationUpdates,
} from '@/lib/station-overrides';

export const dynamic = 'force-dynamic';

export default async function AdminStationUpdatesPage() {
  const [pending, overrides] = await Promise.all([
    getPendingStationUpdates(),
    getAllStationOverrides(),
  ]);

  return (
    <AdminGate>
      {({ email }) => (
        <AdminShell
          active="stations"
          adminEmail={email}
          title="Station phone & address corrections"
          description="Approve community-submitted custody desk, main line, and address updates. Approved corrections publish to the live directory immediately without a redeploy."
        >
          <StationUpdatesAdmin initialPending={pending} initialOverrides={overrides} />
        </AdminShell>
      )}
    </AdminGate>
  );
}
