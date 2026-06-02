import { AdminGate } from '@/components/admin/AdminGate';
import { AdminShell } from '@/components/admin/AdminShell';
import { CustodyTipsAdmin } from '@/components/admin/CustodyTipsAdmin';
import { getAllStations } from '@/lib/data';
import { getAllConsensusRecords } from '@/lib/custody-tips/storage';

export const dynamic = 'force-dynamic';

export default async function AdminCustodyTipsPage() {
  const [consensus, stations] = await Promise.all([
    getAllConsensusRecords(),
    getAllStations(),
  ]);
  const stationNames: Record<string, string> = {};
  for (const s of stations) stationNames[s.id] = s.name;

  return (
    <AdminGate>
      {({ email }) => (
        <AdminShell
          active="custody"
          adminEmail={email}
          title="Rep-contributed custody numbers"
          description="Numbers submitted by reps. Two independent reps (or one matching an official line) auto-publish as verified. Review single-source numbers and conflicts here."
        >
          <CustodyTipsAdmin initialConsensus={consensus} stationNames={stationNames} />
        </AdminShell>
      )}
    </AdminGate>
  );
}
