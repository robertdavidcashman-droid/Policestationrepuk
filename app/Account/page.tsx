import { getSession } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin-auth';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LoginForm } from './LoginForm';
import { AccountDashboard } from './AccountDashboard';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Account — Manage Your PoliceStationRepUK Profile',
  description:
    'Sign in to manage your directory listing. Update your availability, contact details, stations, and more.',
  path: '/Account',
});

export default async function AccountPage() {
  const email = await getSession();

  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[{ label: 'Home', href: '/' }, { label: 'Account' }]}
          />
          <h1 className="mt-3 text-h1 text-white">Account</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">
            {email
              ? 'Manage your directory listing — update your profile, availability, and contact details.'
              : 'Sign in to manage your directory listing.'}
          </p>
        </div>
      </section>

      <div className="page-container">
        {email ? (
          <AccountDashboard userEmail={email} isAdmin={isAdminEmail(email)} />
        ) : (
          <LoginForm />
        )}
      </div>
    </>
  );
}
