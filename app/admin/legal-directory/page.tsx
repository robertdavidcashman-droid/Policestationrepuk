import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { LoginForm } from '@/app/Account/LoginForm';
import { LegalDirectoryAdmin } from '@/components/legal-directory/LegalDirectoryAdmin';

export const dynamic = 'force-dynamic';

export default async function AdminLegalDirectoryPage() {
  const auth = await requireAdmin();

  if (!auth.ok && auth.status === 401) {
    return (
      <section className="bg-slate-50 py-12">
        <div className="page-container">
          <h1 className="text-h2 text-[var(--navy)]">Legal directory admin</h1>
          <LoginForm />
        </div>
      </section>
    );
  }

  if (!auth.ok) {
    return (
      <section className="py-12">
        <div className="page-container text-center">
          <p className="text-red-700">Access denied</p>
          <Link href="/" className="btn-outline mt-4 inline-block">
            Home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-slate-50 py-10">
      <div className="page-container">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold)]">Admin</p>
        <h1 className="text-h2 text-[var(--navy)]">Legal Services Directory</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Moderate listings, amendments, and deletion requests. Suspicious submissions must not be
          published without review.
        </p>
        <div className="mt-8">
          <LegalDirectoryAdmin />
        </div>
        <p className="mt-6 text-xs text-[var(--muted)]">
          <Link href="/admin" className="text-[var(--gold-link)]">
            ← Rep admin
          </Link>
        </p>
      </div>
    </section>
  );
}
