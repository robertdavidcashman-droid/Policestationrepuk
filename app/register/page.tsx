import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { RegisterForm } from './RegisterForm';
import { CustodyNotePagePromo } from '@/components/CustodyNotePagePromo';
import { enquiryEmailVerificationEnabled } from '@/lib/enquiry-email-verify';

const TRUST_POINTS = [
  {
    title: 'Free directory listing',
    body: 'Submitting this form creates your public directory profile. There is no charge to be listed.',
  },
  {
    title: 'Private, gated form',
    body: 'The full registration form only unlocks after a quick server-side eligibility check on your PIN / SRA / proof URL — so the public site never exposes a fillable form to scrapers or bots.',
  },
  {
    title: 'Automatic verification',
    body: 'If you provide your PIN, SRA number, or proof of accreditation and everything checks out, your profile goes live immediately.',
  },
  {
    title: 'Manual review where needed',
    body: 'If anything looks incomplete, suspicious or borderline, your profile is held while an admin reviews it and you get an email when a decision is made.',
  },
];

const WHO_IS_ELIGIBLE = [
  'Fully accredited PSRAS police station representatives',
  'Duty solicitors (with SRA number and professional details)',
  'Solicitors (with SRA number and professional details)',
];

const NOT_ELIGIBLE = [
  'Probationary representatives',
  'Trainees',
  'Anyone &ldquo;studying for accreditation&rdquo; or &ldquo;working towards accreditation&rdquo;',
  'Students',
  'Anyone otherwise unaccredited',
];

export const metadata = buildMetadata({
  title: 'Register free — list your practice on PoliceStationRepUK',
  description:
    'Register free on PoliceStationRepUK. Add your PIN or SRA number, coverage and availability. Fully accredited PSRAS police station representatives, duty solicitors and solicitors go live immediately; borderline applications are held for manual admin review.',
  path: '/register',
  // The page exists as the destination of public CTAs, but the full
  // registration form is gated behind a server-issued one-shot eligibility
  // token (see app/api/register/gate). We do not want the gate landing page
  // crawled — robots.ts also disallows it.
  noIndex: true,
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
          <h1 className="mt-3 text-h1 text-white">Register free on PoliceStationRepUK</h1>
          <p className="mt-3 max-w-2xl text-lg text-white">
            Registration is a two-step process. First we run a quick eligibility check on your
            email, accreditation type and PIN / SRA / proof URL. If you pass, the full
            registration form unlocks below. Fully accredited reps with verifiable details go
            live immediately; anything borderline is held for manual admin review.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="rounded-[var(--radius-lg)] border border-amber-300 bg-amber-50 p-6">
                <h2 className="text-base font-bold text-amber-900">How this works</h2>
                <ol className="mt-3 space-y-2 text-sm leading-relaxed text-amber-800">
                  <li>
                    <strong>1.</strong> Complete the short <strong>eligibility check</strong> in
                    the panel opposite: email, accreditation type, and your{' '}
                    <strong>DSCC / PIN</strong>, <strong>SRA number</strong> or proof URL.
                  </li>
                  <li>
                    <strong>2.</strong> We verify your details on the server. Pass and the full
                    registration form unlocks in place; fail and your details are forwarded to
                    the admin for a manual decision instead.
                  </li>
                  <li>
                    <strong>3.</strong> If you&rsquo;re a fully accredited PSRAS rep, duty
                    solicitor or solicitor with verifiable evidence, your profile is published
                    immediately. Borderline submissions are held for manual admin review and
                    you&rsquo;ll hear back by email within 24 hours.
                  </li>
                </ol>
                <p className="mt-4 text-sm leading-relaxed text-amber-800">
                  Probationary representatives, trainees and unaccredited applicants are not
                  eligible and will be rejected at the eligibility check.
                </p>
              </div>

              <section className="mt-8">
                <h2 className="text-h2 text-[var(--navy)]">What happens after you register</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {TRUST_POINTS.map((item) => (
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
                <h3 className="text-base font-bold text-[var(--navy)]">Eligible to register</h3>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--muted)]">
                  {WHO_IS_ELIGIBLE.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-0.5 shrink-0 text-emerald-600">&#10003;</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <h3 className="mt-6 text-base font-bold text-red-700">Not eligible</h3>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--muted)]">
                  {NOT_ELIGIBLE.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-0.5 shrink-0 text-red-600">&#10005;</span>
                      <span dangerouslySetInnerHTML={{ __html: item }} />
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-8 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--navy)] p-6 text-white">
                <h3 className="text-lg font-bold">Privacy</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  We never display your full postal address, PIN number, SRA number, proof
                  document or any other private field in the public directory. Those details are
                  used only for verification by the PoliceStationRepUK admin team. See our{' '}
                  <Link href="/Privacy" className="text-[var(--gold)] no-underline hover:underline">
                    privacy policy
                  </Link>{' '}
                  for full details.
                </p>
              </section>

              <section className="mt-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6">
                <h3 className="text-base font-bold text-[var(--navy)]">
                  Your professional responsibility
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  By registering you confirm that <strong>you</strong> are responsible for your
                  own accreditation, professional indemnity insurance, regulatory compliance
                  (SRA, PSRAS, DSCC, ICO, etc.) and the work you carry out for any instructing
                  firm. PoliceStationRepUK does not check, renew or guarantee any of these on
                  your behalf. Please keep your listing details accurate and let us know
                  promptly if your status changes.
                </p>
              </section>

              <section className="mt-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--gold-pale)] p-6">
                <h3 className="text-base font-bold text-[var(--navy)]">
                  About PoliceStationRepUK
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  PoliceStationRepUK is an independent <strong>directory and connection
                  platform</strong>. We are not a law firm. We do not provide legal advice or
                  regulated legal services, we do not guarantee any representative&rsquo;s
                  accreditation, we do not supervise representatives once they are instructed,
                  and we are not a party to the contract between an instructing firm and a
                  representative. Verification means we have reviewed the evidence supplied at
                  registration; it does not replace the firm&rsquo;s own onboarding checks.
                </p>
              </section>
            </div>

            <div>
              <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)] sm:p-8 lg:sticky lg:top-28">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-[var(--navy)]">Your details</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    Use the same name and email you&rsquo;d like to appear on your public profile.
                    Required fields are marked with <span className="text-red-600">*</span>.
                  </p>
                </div>
                <RegisterForm
                  requireEmailCode={enquiryEmailVerificationEnabled()}
                />
              </div>
              <CustodyNotePagePromo variant="compact" className="mt-6" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
