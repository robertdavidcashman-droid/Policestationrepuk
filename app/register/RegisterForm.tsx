'use client';

/**
 * Two-stage public registration UX.
 *
 *   Stage 1 ("gate")   — a tiny eligibility form (email + accreditation type
 *                        + PIN/SRA/proof URL + Turnstile + optional email
 *                        code). On submit we POST to /api/register/gate which
 *                        risk-scores the partial payload and, on pass, mints
 *                        a single-use gate token bound to that email.
 *
 *   Stage 2 ("form")   — the full registration form. The HTML for this stage
 *                        is NEVER mounted unless stage 1 returned a valid
 *                        gate token, so the full form is not present in the
 *                        initial server response and cannot be filled in by
 *                        anyone who has not first passed the eligibility
 *                        check. On submit we POST to /api/register with the
 *                        gate token; the server requires + consumes it.
 *
 *   Stage 3 ("blocked")— hard rejection path. Shows the reason returned by
 *                        the gate (high risk, not eligible, etc.) and points
 *                        the user at /Contact so the admin team can manually
 *                        invite them.
 *
 *   Stage 4 ("success")— rendered after the full form is accepted.
 */

import { useCallback, useState } from 'react';
import Link from 'next/link';
import {
  APPLICANT_CATEGORY_LABELS,
  APPLICANT_CATEGORY_VALUES,
  type ApplicantCategory,
} from '@/lib/rep-status';
import { TurnstileWidget } from '@/components/TurnstileWidget';

const PUBLIC_NOTES_MAX = 1500;

interface GateState {
  email: string;
  category: ApplicantCategory | '';
  pinNumber: string;
  sraNumber: string;
  proofUrl: string;
  emailCode: string;
}

const GATE_EMPTY: GateState = {
  email: '',
  category: '',
  pinNumber: '',
  sraNumber: '',
  proofUrl: '',
  emailCode: '',
};

interface FormState {
  fullName: string;
  mobile: string;
  counties: string;
  stations: string;
  coverageAreas: string;
  availability: string;
  publicNotes: string;
  firmName: string;
  firmAddress: string;
  firmEmail: string;
  websiteUrl: string;
  whatsappLink: string;
  professionalProfileUrl: string;
  languages: string;
  specialisms: string;
  yearsExperience: string;
  fullPostalAddress: string;
  confirmAccredited: boolean;
  confirmAccurate: boolean;
  consentPublic: boolean;
}

const FORM_EMPTY: FormState = {
  fullName: '',
  mobile: '',
  counties: '',
  stations: '',
  coverageAreas: '',
  availability: '',
  publicNotes: '',
  firmName: '',
  firmAddress: '',
  firmEmail: '',
  websiteUrl: '',
  whatsappLink: '',
  professionalProfileUrl: '',
  languages: '',
  specialisms: '',
  yearsExperience: '',
  fullPostalAddress: '',
  confirmAccredited: false,
  confirmAccurate: false,
  consentPublic: true,
};

interface RegisterFormProps {
  turnstileSiteKey: string | null;
  requireEmailCode: boolean;
}

interface GatePassPayload {
  gateToken: string;
  email: string;
  category: ApplicantCategory;
  pinNumber: string;
  sraNumber: string;
  proofUrl: string;
}

interface SuccessResult {
  published: boolean;
  profileUrl: string | null;
}

type Stage = 'gate' | 'form' | 'blocked' | 'success';

interface BlockedInfo {
  reason: string;
  message: string;
}

export function RegisterForm({ turnstileSiteKey, requireEmailCode }: RegisterFormProps) {
  const [stage, setStage] = useState<Stage>('gate');
  const [gate, setGate] = useState<GateState>(GATE_EMPTY);
  const [gatePass, setGatePass] = useState<GatePassPayload | null>(null);
  const [form, setForm] = useState<FormState>(FORM_EMPTY);
  const [success, setSuccess] = useState<SuccessResult | null>(null);
  const [blocked, setBlocked] = useState<BlockedInfo | null>(null);

  if (stage === 'success' && success) {
    return <SuccessPanel success={success} />;
  }

  if (stage === 'blocked' && blocked) {
    return (
      <BlockedPanel
        info={blocked}
        onRetry={() => {
          setBlocked(null);
          setStage('gate');
        }}
      />
    );
  }

  if (stage === 'form' && gatePass) {
    return (
      <FullForm
        gatePass={gatePass}
        form={form}
        setForm={setForm}
        turnstileSiteKey={turnstileSiteKey}
        onSuccess={(result) => {
          setSuccess(result);
          setForm(FORM_EMPTY);
          setStage('success');
        }}
        onTokenExpired={() => {
          // Server told us the gate token expired. Restart the gate flow.
          setGatePass(null);
          setStage('gate');
        }}
      />
    );
  }

  return (
    <GateForm
      gate={gate}
      setGate={setGate}
      turnstileSiteKey={turnstileSiteKey}
      requireEmailCode={requireEmailCode}
      onPass={(payload) => {
        setGatePass(payload);
        setStage('form');
      }}
      onBlocked={(info) => {
        setBlocked(info);
        setStage('blocked');
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Stage 1 — eligibility gate                                                */
/* -------------------------------------------------------------------------- */

function GateForm({
  gate,
  setGate,
  turnstileSiteKey,
  requireEmailCode,
  onPass,
  onBlocked,
}: {
  gate: GateState;
  setGate: React.Dispatch<React.SetStateAction<GateState>>;
  turnstileSiteKey: string | null;
  requireEmailCode: boolean;
  onPass: (payload: GatePassPayload) => void;
  onBlocked: (info: BlockedInfo) => void;
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [hp, setHp] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const handleTurnstileToken = useCallback((t: string) => setTurnstileToken(t), []);
  const [codeStatus, setCodeStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [codeError, setCodeError] = useState<string | null>(null);

  const isPsras = gate.category === 'psras-accredited';
  const isSolicitorOrDuty =
    gate.category === 'solicitor' || gate.category === 'duty-solicitor';

  async function handleSendCode() {
    setCodeError(null);
    if (!gate.email.trim()) {
      setCodeStatus('error');
      setCodeError('Please enter your email address first.');
      return;
    }
    if (turnstileSiteKey && !turnstileToken) {
      setCodeStatus('error');
      setCodeError('Please complete the bot-protection check before requesting a code.');
      return;
    }
    setCodeStatus('sending');
    try {
      const res = await fetch('/api/register/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: gate.email.trim().toLowerCase(),
          turnstileToken,
          _hp: hp,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        sent?: boolean;
        error?: string;
      };
      if (res.ok && body.ok) {
        setCodeStatus('sent');
        return;
      }
      setCodeStatus('error');
      setCodeError(body.error || 'Could not send a verification code. Please try again.');
    } catch {
      setCodeStatus('error');
      setCodeError('Could not send a verification code. Please try again.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorDetail(null);
    if (hp) return;

    const email = gate.email.trim().toLowerCase();
    const pinNumber = gate.pinNumber.trim();
    const sraNumber = gate.sraNumber.trim();
    const proofUrl = gate.proofUrl.trim();

    if (!email) {
      setStatus('error');
      setErrorDetail('Please provide the email address you want to be listed under.');
      return;
    }
    if (!gate.category) {
      setStatus('error');
      setErrorDetail(
        'Please confirm your professional status. PoliceStationRepUK does not list probationary representatives, trainees or unaccredited applicants.',
      );
      return;
    }
    if (gate.category === 'psras-accredited' && !pinNumber && !proofUrl) {
      setStatus('error');
      setErrorDetail(
        'PSRAS-accredited reps must supply either a DSCC / PIN number or a URL to proof of accreditation before we can show the registration form.',
      );
      return;
    }
    if (
      (gate.category === 'solicitor' || gate.category === 'duty-solicitor') &&
      !sraNumber &&
      !proofUrl
    ) {
      setStatus('error');
      setErrorDetail(
        'Solicitors and duty solicitors must supply either an SRA number or a URL to proof of registration before we can show the registration form.',
      );
      return;
    }
    if (turnstileSiteKey && !turnstileToken) {
      setStatus('error');
      setErrorDetail('Please complete the bot-protection check before submitting.');
      return;
    }
    if (requireEmailCode && !gate.emailCode.trim()) {
      setStatus('error');
      setErrorDetail(
        'Please request and enter the 6-digit code we email you to verify your address.',
      );
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch('/api/register/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          category: gate.category,
          pinNumber,
          sraNumber,
          proofUrl,
          emailCode: gate.emailCode.trim(),
          turnstileToken,
          _hp: hp,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        gateToken?: string;
        gateData?: {
          email?: string;
          category?: ApplicantCategory;
          pinNumber?: string;
          sraNumber?: string;
          proofUrl?: string;
        };
        reason?: string;
        message?: string;
        error?: string;
      };

      if (res.ok && body.ok && body.gateToken && body.gateData) {
        onPass({
          gateToken: body.gateToken,
          email: body.gateData.email ?? email,
          category: (body.gateData.category as ApplicantCategory) ?? (gate.category as ApplicantCategory),
          pinNumber: body.gateData.pinNumber ?? pinNumber,
          sraNumber: body.gateData.sraNumber ?? sraNumber,
          proofUrl: body.gateData.proofUrl ?? proofUrl,
        });
        return;
      }

      // 200 with ok:false means "rejected" — show the blocked panel.
      if (res.ok && body.ok === false && body.reason && body.message) {
        onBlocked({ reason: body.reason, message: body.message });
        return;
      }

      // Anything else is a soft validation error — stay on the gate.
      setStatus('error');
      setErrorDetail(body.message || body.error || 'Something went wrong. Please try again.');
    } catch {
      setStatus('error');
      setErrorDetail('Something went wrong. Please try again.');
    }
  }

  return (
    <>
      <div className="mb-5 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold-pale)] p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--navy)]">
          Step 1 of 2 — eligibility check
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          To keep the public form private, we first verify your accreditation. Once you pass this
          quick eligibility check the full registration form will appear below. We never publish
          your PIN, SRA number or postal address.
        </p>
      </div>

      {status === 'error' && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">We couldn&rsquo;t verify your details</p>
          {errorDetail && <p className="mt-2 text-sm">{errorDetail}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Honeypot — must remain empty */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            height: 0,
            width: 0,
            overflow: 'hidden',
            opacity: 0,
          }}
        >
          <label htmlFor="gate-website">Website</label>
          <input
            id="gate-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="nope"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="gate-email" className="block text-sm font-medium text-[var(--foreground)]">
            Email address <span className="text-red-600">*</span>
          </label>
          <input
            id="gate-email"
            name="email"
            type="email"
            required
            inputMode="email"
            autoComplete="email"
            value={gate.email}
            onChange={(e) => setGate((p) => ({ ...p, email: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            This will become the email on your public listing. You&rsquo;ll receive a verification
            code at this address.
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">
            Professional status <span className="text-red-600">*</span>
          </legend>
          <p className="text-xs text-[var(--muted)]">
            Only the three categories below are eligible.
          </p>
          <div className="space-y-2">
            {APPLICANT_CATEGORY_VALUES.map((value) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm transition-colors hover:border-[var(--gold)]/40"
              >
                <input
                  type="radio"
                  name="gate-category"
                  value={value}
                  checked={gate.category === value}
                  onChange={() => setGate((p) => ({ ...p, category: value }))}
                  className="mt-0.5"
                  required
                />
                <span className="leading-snug text-[var(--foreground)]">
                  {APPLICANT_CATEGORY_LABELS[value]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <legend className="text-sm font-bold uppercase tracking-wide text-amber-900">
            Proof of accreditation <span className="text-red-600">*</span>
          </legend>
          <p className="text-xs text-amber-800">
            Supply at least one of the following. Without verifiable evidence the registration form
            will not be unlocked.
          </p>

          {(isPsras || !gate.category) && (
            <div>
              <label
                htmlFor="gate-pinNumber"
                className="block text-sm font-medium text-amber-900"
              >
                DSCC / PIN number {isPsras && <span className="text-red-600">(required for PSRAS)</span>}
              </label>
              <input
                id="gate-pinNumber"
                name="pinNumber"
                type="text"
                value={gate.pinNumber}
                onChange={(e) => setGate((p) => ({ ...p, pinNumber: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
              />
              <p className="mt-1 text-xs text-amber-800">Never shown publicly.</p>
            </div>
          )}

          {(isSolicitorOrDuty || !gate.category) && (
            <div>
              <label
                htmlFor="gate-sraNumber"
                className="block text-sm font-medium text-amber-900"
              >
                SRA number{' '}
                {isSolicitorOrDuty && (
                  <span className="text-red-600">(required for solicitors / duty solicitors)</span>
                )}
              </label>
              <input
                id="gate-sraNumber"
                name="sraNumber"
                type="text"
                value={gate.sraNumber}
                onChange={(e) => setGate((p) => ({ ...p, sraNumber: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
              />
              <p className="mt-1 text-xs text-amber-800">
                Used for verification only — not shown publicly.
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="gate-proofUrl"
              className="block text-sm font-medium text-amber-900"
            >
              Proof-of-accreditation URL (optional alternative)
            </label>
            <input
              id="gate-proofUrl"
              name="proofUrl"
              type="url"
              placeholder="https://your-firm.com/team/your-name"
              value={gate.proofUrl}
              onChange={(e) => setGate((p) => ({ ...p, proofUrl: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
            />
            <p className="mt-1 text-xs text-amber-800">
              A public page on your firm&rsquo;s site, the Law Society, or LinkedIn that confirms
              your accreditation.
            </p>
          </div>
        </fieldset>

        {turnstileSiteKey && (
          <div>
            <p className="text-xs text-[var(--muted)]">Bot-protection check (Cloudflare):</p>
            <TurnstileWidget siteKey={turnstileSiteKey} onToken={handleTurnstileToken} />
          </div>
        )}

        {requireEmailCode && (
          <div className="rounded-lg border border-[var(--border)] bg-white p-4">
            <p className="text-sm font-medium text-[var(--foreground)]">
              Verify your email address
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              We send a one-time 6-digit code to the address above. Enter the code below to
              confirm you can be contacted there.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSendCode}
                disabled={codeStatus === 'sending'}
                className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--navy)] hover:bg-slate-50 disabled:opacity-60"
              >
                {codeStatus === 'sending'
                  ? 'Sending…'
                  : codeStatus === 'sent'
                    ? 'Resend code'
                    : 'Send verification code'}
              </button>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                value={gate.emailCode}
                maxLength={6}
                onChange={(e) =>
                  setGate((p) => ({
                    ...p,
                    emailCode: e.target.value.replace(/\D+/g, '').slice(0, 6),
                  }))
                }
                className="w-32 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-base tracking-[0.3em] sm:text-sm"
              />
            </div>
            {codeStatus === 'sent' && (
              <p className="mt-2 text-xs text-emerald-700">
                Code sent. Check your inbox (and spam folder). The code expires in 15 minutes.
              </p>
            )}
            {codeStatus === 'error' && codeError && (
              <p className="mt-2 text-xs text-red-700">{codeError}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full min-h-[44px] rounded-lg bg-[var(--accent)] px-6 py-3 font-bold text-[var(--navy)] shadow-sm hover:bg-[var(--accent-hover)] disabled:opacity-70"
        >
          {status === 'sending' ? 'Checking eligibility…' : 'Verify eligibility & continue'}
        </button>

        <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
          The full registration form only unlocks if your details pass our automatic checks. By
          continuing you consent to PoliceStationRepUK verification checks and acknowledge our{' '}
          <Link href="/Privacy" className="underline">
            privacy policy
          </Link>
          .
        </p>
      </form>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stage 2 — full form (only mounted after the gate passes)                  */
/* -------------------------------------------------------------------------- */

function FullForm({
  gatePass,
  form,
  setForm,
  turnstileSiteKey,
  onSuccess,
  onTokenExpired,
}: {
  gatePass: GatePassPayload;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  turnstileSiteKey: string | null;
  onSuccess: (s: SuccessResult) => void;
  onTokenExpired: () => void;
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [hp, setHp] = useState('');

  // Turnstile is optional at stage 2 — the gate already cleared a bot check.
  // We still render the widget when configured so the second submission gets
  // a fresh token; the API route does not require it but it's a useful extra
  // signal in the access logs.
  const [turnstileToken, setTurnstileToken] = useState('');
  const handleTurnstileToken = useCallback((t: string) => setTurnstileToken(t), []);
  void turnstileToken; // currently unused server-side at stage 2 — kept for future use.
  void turnstileSiteKey;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorDetail(null);
    if (hp) return;

    if (!form.fullName.trim() || !form.mobile.trim()) {
      setStatus('error');
      setErrorDetail('Please provide your full name and mobile number.');
      return;
    }
    if (!form.confirmAccredited || !form.confirmAccurate) {
      setStatus('error');
      setErrorDetail(
        'Please confirm your accreditation and that the details you provide are accurate.',
      );
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateToken: gatePass.gateToken,
          fullName: form.fullName.trim(),
          email: gatePass.email,
          mobile: form.mobile.trim(),
          category: gatePass.category,
          counties: form.counties.trim(),
          stations: form.stations.trim(),
          coverageAreas: form.coverageAreas.trim(),
          availability: form.availability.trim(),
          publicNotes: form.publicNotes.trim(),
          pinNumber: gatePass.pinNumber,
          sraNumber: gatePass.sraNumber,
          proofUrl: gatePass.proofUrl,
          firmName: form.firmName.trim(),
          firmAddress: form.firmAddress.trim(),
          firmEmail: form.firmEmail.trim().toLowerCase(),
          websiteUrl: form.websiteUrl.trim(),
          whatsappLink: form.whatsappLink.trim(),
          professionalProfileUrl: form.professionalProfileUrl.trim(),
          languages: form.languages.trim(),
          specialisms: form.specialisms.trim(),
          yearsExperience: form.yearsExperience.trim(),
          fullPostalAddress: form.fullPostalAddress.trim(),
          confirmAccredited: form.confirmAccredited,
          confirmAccurate: form.confirmAccurate,
          consentPublic: form.consentPublic,
          _hp: hp,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        published?: boolean;
        profileUrl?: string | null;
        error?: string;
        requiresGate?: boolean;
      };
      if (res.ok && body.ok) {
        onSuccess({
          published: Boolean(body.published),
          profileUrl: body.profileUrl ?? null,
        });
        return;
      }
      if (res.status === 403 && body.requiresGate) {
        // Token expired — bounce back to stage 1.
        setStatus('error');
        setErrorDetail(
          body.error ||
            'Your eligibility token has expired. Please redo the eligibility check.',
        );
        onTokenExpired();
        return;
      }
      setStatus('error');
      setErrorDetail(body.error || 'Something went wrong. Please try again.');
    } catch {
      setStatus('error');
      setErrorDetail('Something went wrong. Please try again.');
    }
  }

  return (
    <>
      <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-900">
          Step 2 of 2 — full profile
        </p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900">
          Eligibility check passed. The form below is private and only visible to you. Submit it
          to publish your free listing. Verified, low-risk profiles go live immediately.
        </p>
        <dl className="mt-3 grid gap-1 text-xs text-emerald-900 sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Verified email</dt>
            <dd className="break-all">{gatePass.email}</dd>
          </div>
          <div>
            <dt className="font-semibold">Verified category</dt>
            <dd>{APPLICANT_CATEGORY_LABELS[gatePass.category]}</dd>
          </div>
          {gatePass.pinNumber && (
            <div>
              <dt className="font-semibold">PIN supplied</dt>
              <dd>Yes (kept private)</dd>
            </div>
          )}
          {gatePass.sraNumber && (
            <div>
              <dt className="font-semibold">SRA supplied</dt>
              <dd>Yes (kept private)</dd>
            </div>
          )}
        </dl>
      </div>

      {status === 'error' && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
        >
          <p className="font-semibold">We couldn&rsquo;t save your registration</p>
          {errorDetail && <p className="mt-2 text-sm">{errorDetail}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Honeypot — must remain empty */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            height: 0,
            width: 0,
            overflow: 'hidden',
            opacity: 0,
          }}
        >
          <label htmlFor="reg-website">Website</label>
          <input
            id="reg-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="nope"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
          />
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">
            About you
          </legend>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-[var(--foreground)]">
              Full name <span className="text-red-600">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              autoComplete="name"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-[var(--foreground)]">
              Mobile number <span className="text-red-600">*</span>
            </label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              required
              inputMode="tel"
              autoComplete="tel"
              value={form.mobile}
              onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">
            Firm / practice (optional but recommended)
          </legend>

          <div>
            <label htmlFor="firmName" className="block text-sm font-medium text-[var(--foreground)]">
              Firm or practice name
            </label>
            <input
              id="firmName"
              name="firmName"
              type="text"
              value={form.firmName}
              onChange={(e) => setForm((p) => ({ ...p, firmName: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firmAddress" className="block text-sm font-medium text-[var(--foreground)]">
                Firm address
              </label>
              <input
                id="firmAddress"
                name="firmAddress"
                type="text"
                value={form.firmAddress}
                onChange={(e) => setForm((p) => ({ ...p, firmAddress: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="firmEmail" className="block text-sm font-medium text-[var(--foreground)]">
                Firm email
              </label>
              <input
                id="firmEmail"
                name="firmEmail"
                type="email"
                value={form.firmEmail}
                onChange={(e) => setForm((p) => ({ ...p, firmEmail: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="websiteUrl" className="block text-sm font-medium text-[var(--foreground)]">
                Website (public)
              </label>
              <input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                placeholder="https://"
                value={form.websiteUrl}
                onChange={(e) => setForm((p) => ({ ...p, websiteUrl: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="professionalProfileUrl"
                className="block text-sm font-medium text-[var(--foreground)]"
              >
                Professional profile / LinkedIn
              </label>
              <input
                id="professionalProfileUrl"
                name="professionalProfileUrl"
                type="url"
                placeholder="https://"
                value={form.professionalProfileUrl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, professionalProfileUrl: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">
            Coverage
          </legend>

          <div>
            <label htmlFor="counties" className="block text-sm font-medium text-[var(--foreground)]">
              Counties covered
            </label>
            <input
              id="counties"
              name="counties"
              type="text"
              placeholder="e.g. Kent, Greater London, Essex"
              value={form.counties}
              onChange={(e) => setForm((p) => ({ ...p, counties: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">Comma-separated.</p>
          </div>

          <div>
            <label htmlFor="stations" className="block text-sm font-medium text-[var(--foreground)]">
              Police stations covered
            </label>
            <textarea
              id="stations"
              name="stations"
              rows={3}
              placeholder="e.g. Bromley, Lewisham, Croydon, Walworth"
              value={form.stations}
              onChange={(e) => setForm((p) => ({ ...p, stations: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="coverageAreas"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Towns / boroughs / extra coverage notes
            </label>
            <input
              id="coverageAreas"
              name="coverageAreas"
              type="text"
              placeholder="e.g. South-east London boroughs"
              value={form.coverageAreas}
              onChange={(e) => setForm((p) => ({ ...p, coverageAreas: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="availability"
                className="block text-sm font-medium text-[var(--foreground)]"
              >
                Availability
              </label>
              <input
                id="availability"
                name="availability"
                type="text"
                placeholder="e.g. 24/7, evenings & weekends"
                value={form.availability}
                onChange={(e) => setForm((p) => ({ ...p, availability: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="yearsExperience"
                className="block text-sm font-medium text-[var(--foreground)]"
              >
                Years of experience
              </label>
              <input
                id="yearsExperience"
                name="yearsExperience"
                type="number"
                min={0}
                max={60}
                value={form.yearsExperience}
                onChange={(e) => setForm((p) => ({ ...p, yearsExperience: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="languages" className="block text-sm font-medium text-[var(--foreground)]">
                Languages spoken
              </label>
              <input
                id="languages"
                name="languages"
                type="text"
                placeholder="e.g. English, Punjabi"
                value={form.languages}
                onChange={(e) => setForm((p) => ({ ...p, languages: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="specialisms" className="block text-sm font-medium text-[var(--foreground)]">
                Specialisms
              </label>
              <input
                id="specialisms"
                name="specialisms"
                type="text"
                placeholder="e.g. youth, terrorism, fraud"
                value={form.specialisms}
                onChange={(e) => setForm((p) => ({ ...p, specialisms: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="whatsappLink" className="block text-sm font-medium text-[var(--foreground)]">
              WhatsApp link (optional)
            </label>
            <input
              id="whatsappLink"
              name="whatsappLink"
              type="url"
              placeholder="https://wa.me/447…"
              value={form.whatsappLink}
              onChange={(e) => setForm((p) => ({ ...p, whatsappLink: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">
            Public profile notes (optional)
          </legend>
          <textarea
            id="publicNotes"
            name="publicNotes"
            rows={4}
            maxLength={PUBLIC_NOTES_MAX}
            placeholder="A short summary that will appear on your public profile. Avoid PIN / SRA numbers or addresses here."
            value={form.publicNotes}
            onChange={(e) =>
              setForm((p) => ({ ...p, publicNotes: e.target.value.slice(0, PUBLIC_NOTES_MAX) }))
            }
            className="w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
          />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">
            Private &mdash; verification only
          </legend>
          <div>
            <label
              htmlFor="fullPostalAddress"
              className="block text-sm font-medium text-[var(--foreground)]"
            >
              Full postal address (never displayed publicly)
            </label>
            <textarea
              id="fullPostalAddress"
              name="fullPostalAddress"
              rows={2}
              value={form.fullPostalAddress}
              onChange={(e) => setForm((p) => ({ ...p, fullPostalAddress: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Used for verification only. Sole-trader home postcodes will not be displayed.
            </p>
          </div>
        </fieldset>

        <fieldset className="space-y-3 rounded-lg border border-[var(--card-border)] bg-[var(--gold-pale)] p-4">
          <legend className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">
            Declarations <span className="text-red-600">*</span>
          </legend>

          <label className="flex items-start gap-3 text-sm text-[var(--foreground)]">
            <input
              type="checkbox"
              checked={form.confirmAccredited}
              onChange={(e) => setForm((p) => ({ ...p, confirmAccredited: e.target.checked }))}
              className="mt-0.5"
              required
            />
            <span className="leading-snug">
              I confirm I am fully accredited or otherwise professionally entitled to be listed in
              the category I selected. I understand that probationary representatives, trainees
              and unaccredited applicants are not eligible.
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm text-[var(--foreground)]">
            <input
              type="checkbox"
              checked={form.confirmAccurate}
              onChange={(e) => setForm((p) => ({ ...p, confirmAccurate: e.target.checked }))}
              className="mt-0.5"
              required
            />
            <span className="leading-snug">
              I confirm the details above are accurate and I consent to PoliceStationRepUK using
              them to verify my identity and accreditation. I will keep them up to date.
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm text-[var(--foreground)]">
            <input
              type="checkbox"
              checked={form.consentPublic}
              onChange={(e) => setForm((p) => ({ ...p, consentPublic: e.target.checked }))}
              className="mt-0.5"
            />
            <span className="leading-snug">
              I consent to my <strong>public</strong> profile (name, category, coverage,
              availability, public phone/email, public website) appearing in the directory.
            </span>
          </label>
        </fieldset>

        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full min-h-[44px] rounded-lg bg-[var(--accent)] px-6 py-3 font-bold text-[var(--navy)] shadow-sm hover:bg-[var(--accent-hover)] disabled:opacity-70"
        >
          {status === 'sending' ? 'Submitting…' : 'Submit registration'}
        </button>

        <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
          Registration is free. Verified, low-risk profiles go live immediately; anything
          borderline is held for manual admin review. By submitting you consent to
          PoliceStationRepUK verification checks and acknowledge our{' '}
          <Link href="/Privacy" className="underline">
            privacy policy
          </Link>
          .
        </p>

        {/* Render the turnstile widget hook so that an existing widget instance on the page
            can be reused if needed; it is mounted invisibly so the second submission can
            attach a fresh token in future iterations without extra work. */}
        {turnstileSiteKey && (
          <div hidden>
            <TurnstileWidget siteKey={turnstileSiteKey} onToken={handleTurnstileToken} />
          </div>
        )}
      </form>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stage 3 — blocked panel                                                    */
/* -------------------------------------------------------------------------- */

function BlockedPanel({ info, onRetry }: { info: BlockedInfo; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-900"
    >
      <p className="text-base font-bold">We couldn&rsquo;t verify you automatically</p>
      <p className="mt-2 text-sm leading-relaxed">{info.message}</p>
      <p className="mt-3 text-sm leading-relaxed">
        Please{' '}
        <Link href="/Contact" className="font-semibold text-amber-900 underline">
          contact the directory team
        </Link>{' '}
        — we&rsquo;ll review your accreditation manually and either invite you back to the
        registration flow or add your listing directly. Your details have already been forwarded
        to the admin.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center rounded-lg border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-900 shadow-sm hover:bg-amber-100"
      >
        Try the eligibility check again
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stage 4 — success panel                                                    */
/* -------------------------------------------------------------------------- */

function SuccessPanel({ success }: { success: SuccessResult }) {
  return (
    <div role="alert" className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
      {success.published ? (
        <>
          <p className="text-base font-bold">Your profile is live</p>
          <p className="mt-2 text-sm leading-relaxed">
            Thanks for registering. Your profile passed our automatic verification checks and is{' '}
            <strong>now live</strong> in the public directory.
          </p>
          {success.profileUrl && (
            <p className="mt-3 text-sm">
              <a href={success.profileUrl} className="font-semibold text-emerald-900 underline">
                View your public profile &rarr;
              </a>
            </p>
          )}
          <p className="mt-3 text-xs leading-relaxed">
            You can sign in to your account at any time to edit your details or upgrade to a
            Featured listing.
          </p>
        </>
      ) : (
        <>
          <p className="text-base font-bold">Application received — under review</p>
          <p className="mt-2 text-sm leading-relaxed">
            Thanks for registering. Because some of your details need a quick manual check, your
            profile isn&rsquo;t live yet. The admin team has been alerted and will normally
            approve or come back to you within 24 hours.
          </p>
          <p className="mt-3 text-xs leading-relaxed">
            You&rsquo;ll get an email as soon as a decision is made. If we need more evidence
            (e.g. a copy of your PSRAS accreditation), we&rsquo;ll ask for it by email.
          </p>
        </>
      )}
    </div>
  );
}
