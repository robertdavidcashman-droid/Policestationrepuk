import Link from 'next/link';
import { PSRTRAIN_NAME, PSRTRAIN_TRAINING_HREF } from '@/lib/psrtrain-promo';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { RegisterForm } from './RegisterForm';

const REGISTER_BENEFITS = [
  {
    title: 'Be found by firms quickly',
    body: 'Your profile appears in the public directory so criminal defence firms can search by county, station, and name.',
  },
  {
    title: 'Stay free to join',
    body: 'There are no listing fees for a standard profile while the platform is in this testing phase.',
  },
  {
    title: 'Show real coverage clearly',
    body: 'Counties, stations, availability, and accreditation are displayed so firms can instruct with confidence.',
  },
];

const WHAT_YOU_NEED = [
  'Your full contact details and preferred work email',
  'Accreditation status and any key practice notes',
  'The counties and custody suites you actually cover',
  'A realistic summary of your availability',
];

const RESOURCE_LINKS = [
  { href: '/GetWork', label: 'Get Work Guide', desc: 'The full step-by-step plan for winning instructions.' },
  { href: '/WhatsApp', label: 'WhatsApp Group', desc: 'Real-time job notifications and rep community updates.' },
  { href: '/FormsLibrary', label: 'Forms Library', desc: 'Templates and practical paperwork for day-to-day work.' },
  { href: '/Wiki', label: 'Rep Knowledge Base', desc: 'Training materials, guides, and operational resources.' },
];

export const metadata = buildMetadata({
  title: 'Register as a Police Station Representative',
  description:
    'Register with the PoliceStationRepUK directory. Free for accredited police station representatives. Connect with criminal solicitors seeking cover across England and Wales.',
  path: '/register',
});

export default function RegisterPage() {
  return (
    <>
      {/* Navy header */}
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Register' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">
            Register as a Police Station Representative
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-white">
            Join our free directory. Connect with criminal defence firms and solicitors seeking cover across England and Wales.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              {/* Trust badges */}
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  ✓ Free to register
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  ✓ Listed within 24 hours
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700">
                  ✓ No hidden fees
                </span>
              </div>

              <div className="mt-8 rounded-[var(--radius-lg)] border border-yellow-300 bg-yellow-50 p-6">
                <h2 className="text-base font-bold text-yellow-900">Important before you register</h2>
                <p className="mt-2 text-sm leading-relaxed text-yellow-800">
                  This directory is intended for <strong>fully accredited police station representatives</strong> and
                  duty solicitors who can accept work independently. If you are still probationary, work should remain
                  under the supervision arrangements required by your firm and regulator.
                </p>
              </div>

              <section className="mt-8">
                <h2 className="text-h2 text-[var(--navy)]">Why join PoliceStationRepUK?</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {REGISTER_BENEFITS.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
                    >
                      <h3 className="text-base font-bold text-[var(--navy)]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-8 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--gold-pale)] p-6">
                <h2 className="text-lg font-bold text-[var(--navy)]">What you should have ready</h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--muted)]">
                  {WHAT_YOU_NEED.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-8">
                <h2 className="text-h2 text-[var(--navy)]">Useful resources before you submit</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {RESOURCE_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
                    >
                      <p className="font-medium text-[var(--foreground)]">{link.label}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{link.desc}</p>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="mt-8 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--navy)] p-6 text-white">
                <h2 className="text-lg font-bold">What happens after you register?</h2>
                <ol className="mt-4 space-y-3 text-sm text-slate-300">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--navy)]">1</span>
                    We review your details and make sure the listing reads clearly for firms searching by area.
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--navy)]">2</span>
                    Your profile is published in the directory with your contact details, availability, and coverage.
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--navy)]">3</span>
                    Criminal defence firms can contact you directly when they need police station cover.
                  </li>
                </ol>
              </section>
            </div>

            <div>
              {/* Form card */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)] sm:p-8 lg:sticky lg:top-28">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-[var(--navy)]">Create your free directory profile</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    Complete the form below with accurate coverage and contact details. The clearer your information,
                    the easier it is for firms to instruct you.
                  </p>
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    Studying for accreditation?{' '}
                    <a
                      href={PSRTRAIN_TRAINING_HREF}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[var(--navy)] underline"
                    >
                      Practice on {PSRTRAIN_NAME}
                    </a>{' '}
                    (partner platform — does not replace PSRAS accreditation).
                  </p>
                </div>
                <RegisterForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
