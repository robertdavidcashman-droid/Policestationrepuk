import { AdminGate } from '@/components/admin/AdminGate';
import { AdminShell } from '@/components/admin/AdminShell';
import { AutomationHealthPanel } from '@/components/admin/AutomationHealthPanel';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminAutomationPage() {
  return (
    <AdminGate>
      {({ email }) => (
        <AdminShell
          active="automation"
          adminEmail={email}
          title="Automation health"
          description="Buffer scheduler, cross-site quotas, self-healing healthcheck, and incident controls. Live posting secrets are never shown."
        >
          <AutomationHealthPanel />
        </AdminShell>
      )}
    </AdminGate>
  );
}
