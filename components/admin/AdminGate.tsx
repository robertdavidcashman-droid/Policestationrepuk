import Link from 'next/link';
import type { ReactNode } from 'react';
import { requireAdmin } from '@/lib/admin-auth';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';

export async function AdminGate({
  children,
}: {
  children: (auth: { email: string }) => ReactNode;
}) {
  const auth = await requireAdmin();

  if (!auth.ok && auth.status === 401) {
    return (
      <section className="bg-slate-50 py-12">
        <div className="page-container">
          <AdminLoginForm />
        </div>
      </section>
    );
  }

  if (!auth.ok) {
    return (
      <section className="bg-slate-50 py-16">
        <div className="page-container">
          <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-h2 text-red-700">Access denied</h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Your account is not authorised to view this page.
            </p>
            <Link href="/" className="btn-outline mt-6 inline-block !text-sm">
              Back to homepage
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return <>{children({ email: auth.email })}</>;
}
