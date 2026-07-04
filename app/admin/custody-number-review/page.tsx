import { AdminGate } from '@/components/admin/AdminGate';
import { AdminShell } from '@/components/admin/AdminShell';
import { CustodyNumberReviewAdmin } from '@/components/admin/CustodyNumberReviewAdmin';
import { getBatch } from '@/lib/custody-discovery/batch';
import { getAllFindings, getAllCustodySuites, loadAllApprovedNumbers } from '@/lib/custody-discovery/storage';

export const dynamic = 'force-dynamic';

export default async function CustodyNumberReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string; error?: string }>;
}) {
  const params = await searchParams;
  const [findings, suites, batch, approvedMap] = await Promise.all([
    getAllFindings(),
    getAllCustodySuites(),
    params.batch ? getBatch(params.batch) : Promise.resolve(null),
    loadAllApprovedNumbers(),
  ]);
  const approvedMeta: Record<string, { verificationStatus: 'verified' | 'unverified'; phoneNumber: string }> = {};
  for (const [suiteId, record] of approvedMap) {
    approvedMeta[suiteId] = {
      verificationStatus: record.verificationStatus ?? 'unverified',
      phoneNumber: record.phoneNumber,
    };
  }
  const suiteMeta: Record<string, { county: string; forceName: string }> = {};
  for (const s of suites) {
    suiteMeta[s.id] = { county: s.county, forceName: s.forceName };
  }

  return (
    <AdminGate>
      {({ email }) => (
        <AdminShell
          active="custody-discovery"
          adminEmail={email}
          title="Custody number discovery review"
          description="Autonomous web search findings with source evidence. High-confidence official numbers and corroborated multi-source matches auto-publish; junk, rep directories, and conflicts are auto-cleared where safe. Review anything still flagged here."
        >
          <CustodyNumberReviewAdmin
            initialFindings={findings}
            suiteMeta={suiteMeta}
            approvedMeta={approvedMeta}
            batchId={batch?.id ?? params.batch}
            batchFindingIds={batch?.findingIds}
            accessError={params.error}
          />
        </AdminShell>
      )}
    </AdminGate>
  );
}
