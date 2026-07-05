import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';
import {
  DIRECTORY_ELIGIBILITY_REPS,
  FACEBOOK_JOB_POSTING_WARNING,
  FORUM_ALTERNATIVE_REPS,
  FORUM_JOIN_HELP_INTRO,
  LAA_PAYMENT_REPS,
  WHATSAPP_REP_ELIGIBILITY,
} from '@/lib/community-messaging';
import { COMMUNITY_EMAIL, FACEBOOK_GROUP_URL } from '@/lib/site-navigation';
import { SUPPORT_MAILTO_HREF } from '@/lib/site-contact';

export const metadata = buildMetadata({
  title: 'Community Forum for Police Station Representatives',
  description:
    'Community forum for police station reps — advice, peer chat and networking via Facebook. Fully accredited professionals use the verified WhatsApp group for cover requests.',
  path: '/Forum',
});

const CHANNEL_GUIDE = [
  {
    title: 'Community forum & Facebook',
    who: 'Trainees, those working towards accreditation, and anyone wanting general advice or peer chat.',
    detail: FORUM_ALTERNATIVE_REPS,
  },
  {
    title: 'WhatsApp group',
    who: 'Fully accredited police station reps and verified criminal defence firms/solicitors only.',
    detail: `${WHATSAPP_REP_ELIGIBILITY} ${LAA_PAYMENT_REPS}`,
  },
  {
    title: 'Reps directory',
    who: 'Fully accredited reps, duty solicitors and solicitors with verifiable credentials.',
    detail: DIRECTORY_ELIGIBILITY_REPS,
  },
];

const COMMUNITY_FEATURES = [
  {
    title: 'Urgent Cover Requests',
    desc: 'Verified firms post cover requests in the WhatsApp group. Accredited reps respond in real time.',
  },
  {
    title: 'Peer Support & Advice',
    desc: 'Discuss complex cases (anonymised), share strategies, and get guidance — open forum on Facebook for trainees.',
  },
  {
    title: 'Legal Updates & News',
    desc: 'Stay informed with the latest changes to PACE, legal aid rates, sentencing guidelines, and criminal justice policy.',
  },
  {
    title: 'Career Development',
    desc: 'Share tips on building your freelance practice, marketing yourself to firms, and advancing your career in criminal defence.',
  },
  {
    title: 'Networking',
    desc: 'Connect with reps and solicitors across the country. Build professional relationships that lead to regular work.',
  },
  {
    title: 'Forms & Resources',
    desc: 'Members share useful templates, checklists, and practical resources for police station attendance work.',
  },
];

export default function ForumPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Community Forum', href: '/Forum' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">
            Community Forum for Police Station Representatives
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            Advice, peer chat and networking for the criminal defence community — especially if you are not yet fully
            accredited.
          </p>
        </div>
      </section>

      <div className="page-container">
        <section className="mb-10 rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-6 sm:p-8">
          <h2 className="text-h2 text-[var(--navy)]">Not fully qualified yet?</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--muted)]">
            {FORUM_ALTERNATIVE_REPS} The WhatsApp group and reps directory are for{' '}
            <strong>fully accredited professionals only</strong> — proof is required and checks are undertaken before
            you are added. {LAA_PAYMENT_REPS}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={FACEBOOK_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold inline-flex min-h-[44px] items-center no-underline"
            >
              Join the Facebook group &rarr;
            </a>
            <Link
              href="/WhatsApp"
              className="btn-outline inline-flex min-h-[44px] items-center no-underline"
            >
              WhatsApp (fully accredited only)
            </Link>
          </div>
        </section>

        <section
          className="mb-10 rounded-[var(--radius-lg)] border-2 border-rose-300 bg-rose-50 p-6 sm:p-8"
          aria-labelledby="facebook-job-warning-heading"
        >
          <h2 id="facebook-job-warning-heading" className="text-h2 text-rose-950">
            Posting jobs on Facebook? Read this first
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-rose-900/95">
            {FACEBOOK_JOB_POSTING_WARNING}
          </p>
        </section>

        <section className="mb-14">
          <h2 className="text-h2 mb-6 text-[var(--navy)]">Who should use which channel?</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {CHANNEL_GUIDE.map((item) => (
              <div
                key={item.title}
                className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h3 className="font-semibold text-[var(--navy)]">{item.title}</h3>
                <p className="mt-2 text-sm font-medium text-[var(--navy)]">{item.who}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border-2 border-blue-200 bg-blue-50 p-8">
            <h2 className="text-h2 mb-4 text-[var(--navy)]">Facebook group — advice &amp; chat</h2>
            <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">
              Our Facebook group is the main open community space for reps, trainees, solicitors, and criminal defence
              professionals. Share articles, ask questions, discuss industry news, and connect with colleagues.
            </p>
            <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">
              <strong>Open to all professionals</strong> in the criminal defence sector — including those working
              towards accreditation. <strong className="text-rose-800">No accreditation checks are made</strong> — see
              the warning above if you post cover requests here.
            </p>
            <a
              href={FACEBOOK_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline inline-flex min-h-[44px] items-center no-underline"
            >
              Join the Facebook Group &rarr;
            </a>
          </div>

          <div className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8">
            <h2 className="text-h2 mb-4 text-white">WhatsApp — professional group only</h2>
            <p className="mb-4 text-sm leading-relaxed text-slate-300">
              The PoliceStationRepUK WhatsApp group is for <strong className="text-white">fully accredited reps</strong>{' '}
              and <strong className="text-white">verified criminal defence firms</strong> — cover requests and paid
              work. Proof of accreditation is required; unverified requests are declined.
            </p>
            <p className="mb-6 text-sm leading-relaxed text-slate-300">
              {LAA_PAYMENT_REPS}
            </p>
            <Link
              href="/WhatsApp"
              className="btn-gold inline-flex min-h-[44px] items-center no-underline"
            >
              WhatsApp join guide &rarr;
            </Link>
          </div>
        </section>

        <section
          className="mb-14 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-slate-50 p-6 sm:p-8"
          aria-labelledby="forum-join-help-heading"
        >
          <h2 id="forum-join-help-heading" className="text-h2 text-[var(--navy)]">
            Need help joining?
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--muted)]">
            {FORUM_JOIN_HELP_INTRO}
          </p>
          <ul className="mt-4 max-w-3xl space-y-3 text-sm leading-relaxed text-[var(--muted)]">
            <li>
              <strong className="text-[var(--navy)]">Facebook group:</strong> log into Facebook first, then use the
              join button on the group page. If the group is private, wait for a Facebook admin to approve you — we
              cannot approve Facebook memberships from this site.
            </li>
            <li>
              <strong className="text-[var(--navy)]">Not fully accredited?</strong> use the Facebook group above for
              advice — do not apply for WhatsApp until you are fully qualified.
            </li>
            <li>
              <strong className="text-[var(--navy)]">WhatsApp invite not received?</strong> see the{' '}
              <Link href="/WhatsApp" className="font-semibold text-[var(--navy)] underline">
                WhatsApp join guide
              </Link>{' '}
              and email{' '}
              <a href={`mailto:${COMMUNITY_EMAIL}`} className="font-semibold text-[var(--navy)] underline">
                {COMMUNITY_EMAIL}
              </a>{' '}
              with proof of full accreditation.
            </li>
            <li>
              <strong className="text-[var(--navy)]">Directory or website issue?</strong>{' '}
              <Link href="/FAQ" className="font-semibold text-[var(--navy)] underline">
                Help &amp; FAQ
              </Link>
              ,{' '}
              <Link href="/Contact" className="font-semibold text-[var(--navy)] underline">
                Contact
              </Link>
              , or{' '}
              <a href={SUPPORT_MAILTO_HREF} className="font-semibold text-[var(--navy)] underline">
                email support
              </a>
              .
            </li>
          </ul>
        </section>

        <section className="mb-14">
          <h2 className="text-h2 mb-8 text-[var(--navy)]">What the community offers</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COMMUNITY_FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
              >
                <h3 className="font-semibold text-[var(--navy)]">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)]">
          <h2 className="text-h2 mb-4 text-[var(--navy)]">Fully accredited and ready to list?</h2>
          <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">
            If you&apos;re a fully accredited police station representative, register on our directory — free and
            verified. Do not register unless you meet the eligibility criteria.
          </p>
          <Link
            href="/register"
            className="btn-outline inline-flex min-h-[44px] items-center no-underline"
          >
            Register as rep &rarr;
          </Link>
        </section>

        <section>
          <h2 className="text-h2 mb-6 text-[var(--navy)]">Related resources</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: '/WhatsApp', label: 'WhatsApp Group', desc: 'Fully accredited only' },
              { href: FACEBOOK_GROUP_URL, label: 'Facebook Group', desc: 'Advice and peer chat', external: true },
              { href: '/directory', label: 'Reps Directory', desc: 'Find accredited reps' },
              { href: '/LegalUpdates', label: 'Legal Updates', desc: 'Latest news & changes' },
            ].map((link) =>
              'external' in link && link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
                >
                  <p className="font-medium text-[var(--navy)]">{link.label}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{link.desc}</p>
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
                >
                  <p className="font-medium text-[var(--navy)]">{link.label}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{link.desc}</p>
                </Link>
              ),
            )}
          </div>
        </section>
      </div>
    </>
  );
}
