'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LEGAL_DIRECTORY_CATEGORIES } from '@/lib/legal-directory/categories';
import { ENGLISH_COUNTIES } from '@/lib/english-counties';
import { UK_REGIONS, LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';

const inputClass =
  'mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]';

export function DirectorySubmissionForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [startedAt] = useState(() => Date.now());

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    fd.forEach((v, k) => {
      if (k === 'consentAuthority' || k === 'consentGdpr' || k === 'availability24Hour') {
        body[k] = v === 'on' || v === 'true';
      } else {
        body[k] = v;
      }
    });
    body._startedAt = startedAt;

    try {
      const res = await fetch('/api/legal-directory/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setStatus('error');
        setMessage(data.error ?? 'Submission failed. Please try again.');
        return;
      }
      setStatus('done');
      setMessage(
        data.message ??
          'Thank you. Your listing is now live on the Legal Services Directory.',
      );
      e.currentTarget.reset();
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }

  if (status === 'done') {
    return (
      <div className="card-surface border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="text-h3 text-emerald-900">Listing received</h2>
        <p className="mt-3 text-sm leading-relaxed text-emerald-800">{message}</p>
        <Link href={LEGAL_DIRECTORY_BASE} className="btn-gold mt-6 inline-block no-underline">
          Back to directory
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card-surface space-y-6 p-6 sm:p-8">
      {/* Honeypot — hidden from users */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label>
          Company website
          <input type="text" name="_hp" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-[var(--navy)]">Business / organisation name *</span>
          <input name="businessName" required className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Type of provider / category *</span>
          <select name="categorySlug" required className={inputClass}>
            <option value="">Select…</option>
            {LEGAL_DIRECTORY_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Contact person *</span>
          <input name="contactPerson" required className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Email address *</span>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Phone number *</span>
          <input name="phone" type="tel" required className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Emergency contact number</span>
          <input name="emergencyPhone" type="tel" className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-[var(--navy)]">Website URL</span>
          <input name="websiteUrl" type="url" className={inputClass} placeholder="https://" />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-[var(--navy)]">Address line 1</span>
          <input name="addressLine1" className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-[var(--navy)]">Address line 2</span>
          <input name="addressLine2" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Town / city *</span>
          <input name="town" required className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">County *</span>
          <select name="county" required className={inputClass}>
            <option value="">Select…</option>
            {ENGLISH_COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Postcode</span>
          <input name="postcode" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Region</span>
          <select name="region" className={inputClass}>
            <option value="">Select…</option>
            {UK_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-[var(--navy)]">Areas covered *</span>
          <textarea name="areasCovered" required rows={3} className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-[var(--navy)]">Police stations covered (if relevant)</span>
          <textarea name="policeStationsCovered" rows={2} className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-[var(--navy)]">Courts covered (if relevant)</span>
          <textarea name="courtsCovered" rows={2} className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-[var(--navy)]">Description of services * (min. 80 characters)</span>
          <textarea name="description" required minLength={80} rows={6} className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-[var(--navy)]">Criminal law specialisms</span>
          <textarea name="specialisms" rows={2} className={inputClass} placeholder="Comma-separated" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Legal Aid work?</span>
          <select name="legalAidStatus" className={inputClass}>
            <option value="not_applicable">Not applicable</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="flex items-center gap-2 pt-6">
          <input type="checkbox" name="availability24Hour" className="h-4 w-4" />
          <span className="text-sm text-[var(--navy)]">24-hour availability</span>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Professional accreditation / regulatory body</span>
          <input name="regulatoryBody" className={inputClass} placeholder="e.g. SRA, BSB" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">SRA / BSB / other regulatory number</span>
          <input name="regulatoryNumber" className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-semibold text-[var(--navy)]">Accreditation details</span>
          <textarea name="accreditationDetails" rows={2} className={inputClass} />
        </label>
      </div>

      <label className="flex gap-2 text-sm text-[var(--muted)]">
        <input type="checkbox" name="consentAuthority" required className="mt-1 h-4 w-4 shrink-0" />
        <span>
          I confirm I have authority to submit this listing on behalf of the organisation named above.
        </span>
      </label>
      <label className="flex gap-2 text-sm text-[var(--muted)]">
        <input type="checkbox" name="consentGdpr" required className="mt-1 h-4 w-4 shrink-0" />
        <span>
          I agree to the processing of this data in accordance with the site privacy policy for directory
          administration and moderation.
        </span>
      </label>

      {status === 'error' && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {message}
        </p>
      )}

      <button type="submit" className="btn-gold" disabled={status === 'loading'}>
        {status === 'loading' ? 'Submitting…' : 'Publish listing'}
      </button>
    </form>
  );
}
