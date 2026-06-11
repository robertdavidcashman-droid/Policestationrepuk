import { AdminGate } from '@/components/admin/AdminGate';
import { AdminShell } from '@/components/admin/AdminShell';
import { FirmOutreachDashboard } from '@/components/admin/FirmOutreachDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FirmOutreachAdminPage() {
  return (
    <AdminGate>
      {({ email }) => (
        <AdminShell
          active="firm-outreach"
          adminEmail={email}
          title="Firm WhatsApp outreach"
          description="Automated discovery, email enrichment, and invitation sends for criminal defence firms and solicitors."
        >
          <FirmOutreachDashboard />
        </AdminShell>
      )}
    </AdminGate>
  );
}
