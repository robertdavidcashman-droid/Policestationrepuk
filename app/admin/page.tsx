import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { LoginForm } from '@/app/Account/LoginForm';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  const auth = await requireAdmin();

  if (!auth.ok && auth.status === 401) {
    return (
      <section className="bg-slate-50 py-12">
        <div className="page-container">
          <div className="mx-auto max-w-md text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold)]">
              Private area
            </p>
            <h1 className="mt-2 text-h2 text-[var(--navy)]">Admin sign-in required</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              This page is restricted. Sign in with the admin email to continue.
            </p>
          </div>
          <div className="mt-8">
            <LoginForm />
          </div>
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

  return <AdminDashboard adminEmail={auth.email} />;
}
