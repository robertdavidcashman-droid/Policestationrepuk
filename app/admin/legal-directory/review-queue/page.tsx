import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { LoginForm } from '@/app/Account/LoginForm';
import { LegalDirectoryAdmin } from '@/components/legal-directory/LegalDirectoryAdmin';

export const dynamic = 'force-dynamic';

export default async function LegalDirectoryReviewQueuePage() {
  const auth = await requireAdmin();

  if (!auth.ok && auth.status === 401) {
    return (
      <section className="bg-slate-50 py-12">
        <div className="page-container">
          <h1 className="text-h2 text-[var(--navy)]">Review queue</h1>
          <LoginForm />
        </div>
      </section>
    );
  }

  if (!auth.ok) {
    return (
      <section className="py-12">
        <div className="page-container text-center text-red-700">Access denied</div>
      </section>
    );
  }

  return (
    <section className="bg-slate-50 py-10">
      <div className="page-container">
        <h1 className="text-h2 text-[var(--navy)]">Legal directory — review queue</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Prioritises flagged, pending update, deletion requested, spam, and high riskScore
          submissions.
        </p>
        <div className="mt-8">
          <LegalDirectoryAdmin reviewQueueOnly />
        </div>
        <Link href="/admin/legal-directory" className="mt-6 inline-block text-sm text-[var(--gold-link)]">
          ← All listings
        </Link>
      </div>
    </section>
  );
}
