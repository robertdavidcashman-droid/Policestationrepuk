import { AdminGate } from '@/components/admin/AdminGate';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  return (
    <AdminGate>
      {({ email }) => (
        <AdminShell
          active="reps"
          adminEmail={email}
          title="Rep verification audit"
          description="Review and approve police station representative registrations, featured listings, and profile verification."
        >
          <AdminDashboard adminEmail={email} />
        </AdminShell>
      )}
    </AdminGate>
  );
}
