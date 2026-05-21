'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  APPLICANT_CATEGORY_LABELS,
  APPLICANT_CATEGORY_VALUES,
  type ApplicantCategory,
} from '@/lib/rep-status';
import { ENGLISH_COUNTIES } from '@/lib/english-counties';
import { TurnstileWidget } from '@/components/TurnstileWidget';

interface FormState {
  fullLegalName: string;
  publicDisplayName: string;
  mobile: string;
  fullPostalAddress: string;
  firmName: string;
  firmAddress: string;
  firmEmail: string;
  sraNumber: string;
  pinNumber: string;
  accreditationProofFile: string;
  professionalProfileUrl: string;
  category: ApplicantCategory | '';
  countiesCovered: Set<string>;
  townsCovered: string;
  stationsCovered: string;
  availability: string;
  travelRadius: string;
  overnightAvailability: boolean;
  weekendAvailability: boolean;
  languages: string;
  publicProfileNotes: string;
  acceptsDirectFirmInstructions: boolean;
  publicPhoneConsent: boolean;
  publicEmailConsent: boolean;
  publicPhone: string;
  publicEmail: string;
  /** consents */
  c1: boolean;
  c2: boolean;
  c3: boolean;
  c4: boolean;
  c5: boolean;
  c6: boolean;
  c7: boolean;
}

const EMPTY: FormState = {
  fullLegalName: '',
  publicDisplayName: '',
  mobile: '',
  fullPostalAddress: '',
  firmName: '',
  firmAddress: '',
  firmEmail: '',
  sraNumber: '',
  pinNumber: '',
  accreditationProofFile: '',
  professionalProfileUrl: '',
  category: '',
  countiesCovered: new Set<string>(),
  townsCovered: '',
  stationsCovered: '',
  availability: '',
  travelRadius: '',
  overnightAvailability: false,
  weekendAvailability: false,
  languages: '',
  publicProfileNotes: '',
  acceptsDirectFirmInstructions: false,
  publicPhoneConsent: false,
  publicEmailConsent: false,
  publicPhone: '',
  publicEmail: '',
  c1: false,
  c2: false,
  c3: false,
  c4: false,
  c5: false,
  c6: false,
  c7: false,
};

export function SecureVerificationForm({
  token,
  email,
  turnstileSiteKey,
}: {
  token: string;
  email: string;
  turnstileSiteKey: string | null;
}) {
  const [data, setData] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const handleTurnstileToken = useCallback((t: string) => setTurnstileToken(t), []);

  const requiresPin = data.category === 'psras-accredited';
  const requiresSra = data.category === 'duty-solicitor' || data.category === 'solicitor';

  const allConsentsTicked = useMemo(
    () => data.c1 && data.c2 && data.c3 && data.c4 && data.c5 && data.c6 && data.c7,
    [data.c1, data.c2, data.c3, data.c4, data.c5, data.c6, data.c7],
  );

  function toggleCounty(name: string) {
    setData((p) => {
      const next = new Set(p.countiesCovered);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return { ...p, countiesCovered: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!data.category) {
      setStatus('error');
      setError('Please confirm your professional status.');
      return;
    }
    if (requiresPin && !data.pinNumber.trim()) {
      setStatus('error');
      setError('PSRAS accreditation requires a PIN / LAA police station representative number.');
      return;
    }
    if (requiresPin && !data.accreditationProofFile.trim()) {
      setStatus('error');
      setError('Please provide a URL or reference for your accreditation evidence.');
      return;
    }
    if (requiresSra && !data.sraNumber.trim()) {
      setStatus('error');
      setError(
        data.category === 'duty-solicitor'
          ? 'Duty solicitors must supply an SRA number.'
          : 'Solicitors must supply an SRA number.',
      );
      return;
    }
    if (!data.fullLegalName.trim() || !data.mobile.trim() || !data.fullPostalAddress.trim()) {
      setStatus('error');
      setError('Full legal name, mobile number and full postal address are required.');
      return;
    }
    if (!allConsentsTicked) {
      setStatus('error');
      setError('All declarations must be confirmed before submitting.');
      return;
    }
    if (turnstileSiteKey && !turnstileToken) {
      setStatus('error');
      setError('Please complete the bot-protection check before submitting.');
      return;
    }

    setStatus('submitting');
    try {
      const body = {
        token,
        turnstileToken,
        record: {
          fullLegalName: data.fullLegalName.trim(),
          publicDisplayName: data.publicDisplayName.trim() || data.fullLegalName.trim(),
          mobile: data.mobile.trim(),
          fullPostalAddress: data.fullPostalAddress.trim(),
          firmName: data.firmName.trim(),
          firmAddress: data.firmAddress.trim(),
          firmEmail: data.firmEmail.trim().toLowerCase(),
          sraNumber: data.sraNumber.trim(),
          pinNumber: data.pinNumber.trim(),
          accreditationProofFile: data.accreditationProofFile.trim(),
          professionalProfileUrl: data.professionalProfileUrl.trim(),
          category: data.category,
          countiesCovered: Array.from(data.countiesCovered),
          townsCovered: data.townsCovered.trim(),
          stationsCovered: data.stationsCovered
            .split(/[\n;,]+/)
            .map((s) => s.trim())
            .filter(Boolean),
          availability: data.availability.trim(),
          travelRadius: data.travelRadius.trim(),
          overnightAvailability: data.overnightAvailability,
          weekendAvailability: data.weekendAvailability,
          languages: data.languages.trim(),
          publicProfileNotes: data.publicProfileNotes.trim(),
          acceptsDirectFirmInstructions: data.acceptsDirectFirmInstructions,
          publicPhoneConsent: data.publicPhoneConsent,
          publicEmailConsent: data.publicEmailConsent,
          publicPhone: data.publicPhoneConsent ? data.publicPhone.trim() : '',
          publicEmail: data.publicEmailConsent ? data.publicEmail.trim() : '',
          consents: {
            confirmsAccurate: data.c1,
            confirmsEligible: data.c2,
            understandsIneligibility: data.c3,
            consentsToVerificationChecks: data.c4,
            understandsPrivacy: data.c5,
            willKeepDetailsCurrent: data.c6,
            understandsConsequencesOfFalseInfo: data.c7,
          },
        },
      };
      const res = await fetch('/api/secure-rep-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const out = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && out.ok) {
        setStatus('success');
        return;
      }
      setStatus('error');
      setError(out.error || 'Submission failed.');
    } catch {
      setStatus('error');
      setError('Submission failed. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div role="alert" className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        <p className="text-base font-bold">Verification submitted</p>
        <p className="mt-2 text-sm leading-relaxed">
          Thank you. Your verification has been submitted to the PoliceStationRepUK admin team
          for manual review. We&rsquo;ll contact you by email when the review is complete.
        </p>
        <p className="mt-2 text-xs leading-relaxed">
          Your full postal address, PIN number, SRA number, uploaded evidence and verification
          material will <strong>not</strong> be published in the public directory.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Identity */}
      <fieldset>
        <legend className="text-base font-bold text-[var(--navy)]">Identity</legend>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Use the same email ({email}) the admin issued this token to. Address &amp; PIN remain private.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Full legal name *"
            value={data.fullLegalName}
            onChange={(v) => setData((p) => ({ ...p, fullLegalName: v }))}
            required
          />
          <Field
            label="Public display name (if different)"
            value={data.publicDisplayName}
            onChange={(v) => setData((p) => ({ ...p, publicDisplayName: v }))}
          />
          <Field
            label="Mobile number *"
            value={data.mobile}
            onChange={(v) => setData((p) => ({ ...p, mobile: v }))}
            type="tel"
            required
          />
          <Field
            label="Professional profile / LinkedIn / firm page"
            value={data.professionalProfileUrl}
            onChange={(v) => setData((p) => ({ ...p, professionalProfileUrl: v }))}
            type="url"
            placeholder="https://"
          />
          <Field
            label="Full postal address *"
            value={data.fullPostalAddress}
            onChange={(v) => setData((p) => ({ ...p, fullPostalAddress: v }))}
            required
            kind="textarea"
            span={2}
          />
          <Field
            label="Firm name"
            value={data.firmName}
            onChange={(v) => setData((p) => ({ ...p, firmName: v }))}
          />
          <Field
            label="Firm email"
            value={data.firmEmail}
            onChange={(v) => setData((p) => ({ ...p, firmEmail: v }))}
            type="email"
          />
          <Field
            label="Firm address"
            value={data.firmAddress}
            onChange={(v) => setData((p) => ({ ...p, firmAddress: v }))}
            kind="textarea"
            span={2}
          />
        </div>
      </fieldset>

      {/* Status + PIN/SRA */}
      <fieldset>
        <legend className="text-base font-bold text-[var(--navy)]">Professional status</legend>
        <p className="mt-1 text-xs text-[var(--muted)]">
          PoliceStationRepUK only accepts these three categories. Selecting one triggers the
          mandatory accreditation evidence below.
        </p>
        <div className="mt-3 space-y-2">
          {APPLICANT_CATEGORY_VALUES.map((value) => (
            <label
              key={value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-sm transition-colors hover:border-[var(--gold)]/40"
            >
              <input
                type="radio"
                name="category"
                value={value}
                checked={data.category === value}
                onChange={() => setData((p) => ({ ...p, category: value }))}
                className="mt-0.5"
              />
              <span className="leading-snug text-[var(--foreground)]">
                {APPLICANT_CATEGORY_LABELS[value]}
              </span>
            </label>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label={requiresPin ? 'PIN / LAA police station representative number *' : 'PIN number (if held)'}
            value={data.pinNumber}
            onChange={(v) => setData((p) => ({ ...p, pinNumber: v }))}
            required={requiresPin}
          />
          <Field
            label={requiresSra ? 'SRA number *' : 'SRA number (if held)'}
            value={data.sraNumber}
            onChange={(v) => setData((p) => ({ ...p, sraNumber: v }))}
            required={requiresSra}
          />
          <Field
            label={
              requiresPin
                ? 'Proof of accreditation (URL or reference) *'
                : 'Supporting accreditation evidence (URL or reference)'
            }
            value={data.accreditationProofFile}
            onChange={(v) => setData((p) => ({ ...p, accreditationProofFile: v }))}
            placeholder="e.g. https://drive.../accreditation-letter.pdf"
            required={requiresPin}
            span={2}
          />
        </div>
      </fieldset>

      {/* Coverage */}
      <fieldset>
        <legend className="text-base font-bold text-[var(--navy)]">Coverage</legend>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Pick the counties you actually cover. Then list the police stations / custody suites,
          towns/boroughs and your travel radius.
        </p>
        <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-[var(--border)] bg-white p-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ENGLISH_COUNTIES.map((c) => (
              <label key={c} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.countiesCovered.has(c)}
                  onChange={() => toggleCounty(c)}
                  className="mt-0.5"
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Towns / boroughs covered"
            value={data.townsCovered}
            onChange={(v) => setData((p) => ({ ...p, townsCovered: v }))}
            kind="textarea"
            placeholder="e.g. Bromley, Croydon, Sutton, Kingston upon Thames"
            span={2}
          />
          <Field
            label="Police stations / custody suites covered"
            value={data.stationsCovered}
            onChange={(v) => setData((p) => ({ ...p, stationsCovered: v }))}
            kind="textarea"
            placeholder="Comma- or newline-separated list of stations"
            span={2}
          />
          <Field
            label="Travel radius"
            value={data.travelRadius}
            onChange={(v) => setData((p) => ({ ...p, travelRadius: v }))}
            placeholder="e.g. 25 miles from SW9"
          />
          <Field
            label="Availability summary"
            value={data.availability}
            onChange={(v) => setData((p) => ({ ...p, availability: v }))}
            placeholder="e.g. 24/7 on-call, Mon–Fri days, weekends only"
          />
          <Field
            label="Languages (if any)"
            value={data.languages}
            onChange={(v) => setData((p) => ({ ...p, languages: v }))}
            placeholder="e.g. English, Polish, Urdu"
            span={2}
          />
          <label className="flex items-center gap-2 text-sm sm:col-span-1">
            <input
              type="checkbox"
              checked={data.overnightAvailability}
              onChange={(e) => setData((p) => ({ ...p, overnightAvailability: e.target.checked }))}
            />
            <span>Overnight availability</span>
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-1">
            <input
              type="checkbox"
              checked={data.weekendAvailability}
              onChange={(e) => setData((p) => ({ ...p, weekendAvailability: e.target.checked }))}
            />
            <span>Weekend availability</span>
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={data.acceptsDirectFirmInstructions}
              onChange={(e) =>
                setData((p) => ({ ...p, acceptsDirectFirmInstructions: e.target.checked }))
              }
            />
            <span>I accept direct instructions from criminal defence firms.</span>
          </label>
          <Field
            label="Public profile notes (what firms see in the directory)"
            value={data.publicProfileNotes}
            onChange={(v) => setData((p) => ({ ...p, publicProfileNotes: v }))}
            kind="textarea"
            placeholder="Plain-language overview of your practice — do NOT include PIN numbers, addresses or sensitive material."
            span={2}
          />
        </div>
      </fieldset>

      {/* Public contact consents */}
      <fieldset>
        <legend className="text-base font-bold text-[var(--navy)]">Public contact (optional)</legend>
        <p className="mt-1 text-xs text-[var(--muted)]">
          By default, no contact details are published. If you would like firms to be able to call
          or email you directly, tick the appropriate consents and enter the public-facing details.
          Your private mobile / personal email remain hidden.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={data.publicPhoneConsent}
              onChange={(e) => setData((p) => ({ ...p, publicPhoneConsent: e.target.checked }))}
            />
            <span>I consent to a phone number being shown publicly.</span>
          </label>
          <Field
            label="Public-facing phone number"
            value={data.publicPhone}
            onChange={(v) => setData((p) => ({ ...p, publicPhone: v }))}
            disabled={!data.publicPhoneConsent}
            type="tel"
          />
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={data.publicEmailConsent}
              onChange={(e) => setData((p) => ({ ...p, publicEmailConsent: e.target.checked }))}
            />
            <span>I consent to an email being shown publicly.</span>
          </label>
          <Field
            label="Public-facing email"
            value={data.publicEmail}
            onChange={(v) => setData((p) => ({ ...p, publicEmail: v }))}
            disabled={!data.publicEmailConsent}
            type="email"
          />
        </div>
      </fieldset>

      {/* Consents */}
      <fieldset>
        <legend className="text-base font-bold text-[var(--navy)]">Consents and declarations</legend>
        <div className="mt-3 space-y-3 text-sm">
          {[
            { key: 'c1' as const, text: 'I confirm the information provided is true and accurate.' },
            {
              key: 'c2' as const,
              text:
                'I confirm I am fully accredited or otherwise professionally entitled to be listed in the category selected.',
            },
            {
              key: 'c3' as const,
              text:
                'I understand that probationary representatives, trainees and unaccredited applicants are not eligible for listing.',
            },
            { key: 'c4' as const, text: 'I consent to verification checks.' },
            {
              key: 'c5' as const,
              text:
                'I understand that my address, PIN number, uploaded documents and private verification details will not be published.',
            },
            {
              key: 'c6' as const,
              text:
                'I agree to update PoliceStationRepUK if my accreditation, employment, contact details or availability change.',
            },
            {
              key: 'c7' as const,
              text:
                'I understand that false or misleading information may lead to refusal, suspension or removal.',
            },
          ].map((row) => (
            <label
              key={row.key}
              className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-white px-4 py-3"
            >
              <input
                type="checkbox"
                checked={data[row.key]}
                onChange={(e) => setData((p) => ({ ...p, [row.key]: e.target.checked }))}
                className="mt-0.5"
                required
              />
              <span className="leading-snug">{row.text}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {turnstileSiteKey && (
        <div>
          <p className="text-xs text-[var(--muted)]">Bot-protection check (Cloudflare):</p>
          <TurnstileWidget siteKey={turnstileSiteKey} onToken={handleTurnstileToken} />
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--muted)]">
          Submitting this form does not create a public profile until the admin team has
          reviewed and approved your verification.
        </p>
        <button
          type="submit"
          disabled={status === 'submitting' || !allConsentsTicked}
          className="min-h-[44px] rounded-lg bg-[var(--navy)] px-6 py-3 font-bold text-white shadow-sm hover:bg-[var(--navy-light)] disabled:opacity-50"
        >
          {status === 'submitting' ? 'Submitting…' : 'Submit verification'}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  kind = 'input',
  disabled,
  span,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  kind?: 'input' | 'textarea';
  disabled?: boolean;
  span?: 1 | 2;
}) {
  const wrapperClass = span === 2 ? 'sm:col-span-2' : '';
  return (
    <label className={`block ${wrapperClass}`}>
      <span className="block text-xs font-semibold text-[var(--muted)]">{label}</span>
      {kind === 'textarea' ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm disabled:bg-slate-100"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm disabled:bg-slate-100"
        />
      )}
    </label>
  );
}
