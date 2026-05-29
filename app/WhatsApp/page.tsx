import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import {
  WHATSAPP_JOIN_URL,
  WHATSAPP_JOIN_PHONE,
  FACEBOOK_GROUP_URL,
  WHATSAPP_PAGE_FIRMS,
  WHATSAPP_PAGE_REPS,
  WHATSAPP_PAGE_SOLICITORS,
} from '@/lib/site-navigation';

export const metadata = buildMetadata({
  title: 'WhatsApp Group — Reps & Criminal Defence Firms',
  description:
    'Join the PoliceStationRepUK WhatsApp group — one community for accredited police station reps and verified criminal defence firms. Real-time cover requests, networking, and peer support. Free to join.',
  path: '/WhatsApp',
});

const FEATURES = [
  {
    icon: '🔒',
    title: 'Verified members — reps and firms',
    desc: 'Accredited reps show PSRAS / LCCSA / CLSA or equivalent; criminal defence firms are verified (e.g. against public SRA records). One professional group — trusted and relevant.',
  },
  {
    icon: '⚡',
    title: 'Instant job notifications',
    desc: 'Firms post police station cover requests; reps respond in real time — including evenings, weekends, and bank holidays.',
  },
  {
    icon: '💬',
    title: 'Direct communication',
    desc: 'Reps and firms message in the same thread — no middleman. Confirm cover and details quickly.',
  },
  {
    icon: '🆓',
    title: 'Free to join',
    desc: 'No charge to join or use the group. A free resource from PoliceStationRepUK for the police station representation community.',
  },
];

const JOIN_STEPS = [
  {
    step: 1,
    title: 'Send a text message',
    desc: (
      <>
        Text <strong>{WHATSAPP_JOIN_PHONE}</strong> (or tap the button below). Say whether you are a{' '}
        <strong>rep</strong> or a <strong>firm</strong>. Reps: include name, accreditation details, and areas you
        cover. Firms: include your name, firm name, and firm email.
      </>
    ),
  },
  {
    step: 2,
    title: 'We verify you',
    desc: 'Reps may be asked for accreditation proof. Firms may be checked against public records. We may follow up by email if needed.',
  },
  {
    step: 3,
    title: 'Get added to the group',
    desc: "Once verified, you'll receive a WhatsApp invitation. Accept it — then you're in the same group as reps and firms.",
  },
];

const RESOURCE_LINKS = [
  {
    href: '/directory',
    label: 'Reps Directory',
    desc: 'Get listed so firms can find you',
  },
  {
    href: '/register',
    label: 'Register Your Profile',
    desc: 'Create your free directory listing',
  },
  {
    href: '/GetWork',
    label: 'Get Work Guide',
    desc: 'Complete career strategy guide',
  },
  {
    href: '/FormsLibrary',
    label: 'Forms Library',
    desc: 'CRM1, CRM2 & legal aid forms',
  },
];

export default function WhatsAppPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'WhatsApp Group', href: '/WhatsApp' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">
            PoliceStationRepUK WhatsApp group
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            One WhatsApp community for <strong className="text-white">accredited police station reps</strong>,{' '}
            <strong className="text-white">criminal defence solicitors</strong>, and{' '}
            <strong className="text-white">criminal defence firms</strong> across England &amp; Wales — cover requests,
            networking, and peer support. Free; members are verified before being added.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={WHATSAPP_PAGE_REPS}
              className="btn-gold inline-flex min-h-[44px] items-center px-5 no-underline"
            >
              Join as a rep
            </Link>
            <Link
              href={WHATSAPP_PAGE_SOLICITORS}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-white/30 bg-white/10 px-5 text-sm font-semibold text-white no-underline hover:bg-white/20"
            >
              Join as a solicitor
            </Link>
            <Link
              href={WHATSAPP_PAGE_FIRMS}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-white/30 bg-white/10 px-5 text-sm font-semibold text-white no-underline hover:bg-white/20"
            >
              Join as a firm
            </Link>
          </div>
        </div>
      </section>

      <div className="page-container">
        {/* Features */}
        <div className="mb-14 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
            >
              <div className="mb-3 text-2xl">{f.icon}</div>
              <h2 className="font-semibold text-[var(--navy)]">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* How to Join — numbered steps */}
        <section className="mb-14 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8">
          <h2 className="text-h2 mb-6 text-center text-white">
            How to Join — 3 Simple Steps
          </h2>
          <ol className="mx-auto max-w-xl space-y-6">
            {JOIN_STEPS.map((s) => (
              <li key={s.step} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-sm font-bold text-[var(--navy)]">
                  {s.step}
                </span>
                <div>
                  <p className="font-semibold text-white">{s.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">
                    {s.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <a
              href={WHATSAPP_JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold inline-block no-underline"
            >
              Text to Join on WhatsApp
            </a>
            <p className="mt-4 text-3xl font-bold text-white">
              {WHATSAPP_JOIN_PHONE}
            </p>
          </div>
        </section>

        {/* What to expect */}
        <section className="mb-14 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)]">
          <h2 className="text-h2 mb-4 text-[var(--navy)]">What to Expect</h2>
          <ul className="space-y-3 text-sm text-[var(--muted)]">
            {[
              'Cover requests from solicitor firms posted in real time — respond instantly to secure work',
              'Professional environment — group rules are enforced to maintain quality and relevance',
              'Networking opportunities with fellow reps and criminal solicitors nationwide',
              'Industry updates, rate changes, and PACE developments shared by the community',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-[var(--gold)]">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Facebook group CTA */}
        <section className="mb-14 rounded-[var(--radius-lg)] border-2 border-blue-200 bg-blue-50 p-8 text-center">
          <h2 className="text-h2 text-[var(--navy)]">
            Join Our Facebook Group
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
            Our Facebook group is a complementary community space for police
            station reps and criminal defence professionals. Share articles,
            discuss industry news, and connect with colleagues across the
            country.
          </p>
          <a
            href={FACEBOOK_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline mt-5 inline-block no-underline"
          >
            Join the Facebook Group
          </a>
        </section>

        {/* Resources */}
        <section>
          <h2 className="text-h2 mb-6 text-[var(--navy)]">More Resources</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RESOURCE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
              >
                <p className="font-medium text-[var(--navy)]">{link.label}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{link.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
