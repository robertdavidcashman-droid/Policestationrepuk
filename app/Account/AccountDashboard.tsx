'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FeaturedListingAdvert } from '@/components/FeaturedListingAdvert';

interface FeaturedInfo {
  featured: boolean;
  activatedAt: string | null;
  source: 'static' | 'upgraded' | null;
  status: 'active' | 'cancelled' | 'expired' | 'grandfathered' | 'legacy' | null;
  expiresAt: string | null;
  renewsAt: string | null;
  tier: string | null;
}

const PRICING_TIERS = [
  { id: 'monthly', price: '£4.99', period: '/month', savings: null, badge: null },
  { id: '3month', price: '£12.72', period: '/3 months', savings: '15% off', badge: null },
  { id: '6month', price: '£22.46', period: '/6 months', savings: '25% off', badge: 'Popular' },
  { id: 'yearly', price: '£35.93', period: '/year', savings: '40% off', badge: 'Best value' },
] as const;

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  accreditation: string;
  availability: string;
  postcode: string;
  counties: string;
  stations_covered: string;
  notes: string;
  website_url: string;
  whatsapp_link: string;
  dscc_pin: string;
  holiday_availability: string;
  languages: string;
  specialisms: string;
  years_experience: string;
}

const EMPTY_PROFILE: ProfileData = {
  name: '',
  email: '',
  phone: '',
  accreditation: '',
  availability: '',
  postcode: '',
  counties: '',
  stations_covered: '',
  notes: '',
  website_url: '',
  whatsapp_link: '',
  dscc_pin: '',
  holiday_availability: '',
  languages: '',
  specialisms: '',
  years_experience: '',
};

type Status = 'loading' | 'ready' | 'not-found' | 'saving' | 'saved' | 'error';

export function AccountDashboard({ userEmail, isAdmin = false }: { userEmail: string; isAdmin?: boolean }) {
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [original, setOriginal] = useState<ProfileData>(EMPTY_PROFILE);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [repSlug, setRepSlug] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [featuredInfo, setFeaturedInfo] = useState<FeaturedInfo | null>(null);
  const [upgradeStatus, setUpgradeStatus] = useState<'idle' | 'selecting' | 'redirecting' | 'success' | 'error'>('idle');
  const [selectedTier, setSelectedTier] = useState<string>('6month');
  const [showRemoveListing, setShowRemoveListing] = useState(false);
  const [removeConfirmText, setRemoveConfirmText] = useState('');
  const [removeDeleting, setRemoveDeleting] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/account/profile');
      if (res.status === 404) {
        setStatus('not-found');
        return;
      }
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      const p: ProfileData = {
        name: data.name ?? '',
        email: data.email ?? userEmail,
        phone: data.phone ?? '',
        accreditation: data.accreditation ?? '',
        availability: data.availability ?? '',
        postcode: data.postcode ?? '',
        counties: Array.isArray(data.counties)
          ? data.counties.join(', ')
          : data.counties ?? '',
        stations_covered: Array.isArray(data.stations_covered)
          ? data.stations_covered.join(', ')
          : data.stations_covered ?? '',
        notes: data.notes ?? '',
        website_url: data.website_url ?? '',
        whatsapp_link: data.whatsapp_link ?? '',
        dscc_pin: data.dscc_pin ?? '',
        holiday_availability: Array.isArray(data.holiday_availability)
          ? data.holiday_availability.join(', ')
          : data.holiday_availability ?? '',
        languages: Array.isArray(data.languages)
          ? data.languages.join(', ')
          : data.languages ?? '',
        specialisms: Array.isArray(data.specialisms)
          ? data.specialisms.join(', ')
          : data.specialisms ?? '',
        years_experience: data.years_experience != null ? String(data.years_experience) : '',
      };
      setProfile(p);
      setOriginal(p);
      setRepSlug(data.slug ?? '');
      setUpdatedAt(data.updated_at ?? null);
      setStatus('ready');
    } catch {
      setStatus('error');
      setErrorMsg('Could not load your profile. Please try again.');
    }
  }, [userEmail]);

  const loadFeatured = useCallback(async () => {
    try {
      const res = await fetch('/api/account/featured');
      if (res.ok) {
        const data = await res.json();
        setFeaturedInfo(data);
      } else {
        console.warn('[Account] featured status unavailable:', res.status);
      }
    } catch (err) {
      console.warn('[Account] could not load featured status:', err);
    }
  }, []);

  useEffect(() => { loadProfile(); loadFeatured(); }, [loadProfile, loadFeatured]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('featured') === 'success') {
      setUpgradeStatus('success');
      loadFeatured();
      window.history.replaceState({}, '', '/Account');
    }
  }, [loadFeatured]);

  function set(field: keyof ProfileData, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(original);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');
    try {
      const payload: Record<string, unknown> = {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        accreditation: profile.accreditation.trim(),
        availability: profile.availability.trim(),
        postcode: profile.postcode.trim(),
        counties: profile.counties
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        stations_covered: profile.stations_covered
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        notes: profile.notes.trim(),
        website_url: profile.website_url.trim(),
        whatsapp_link: profile.whatsapp_link.trim(),
        dscc_pin: profile.dscc_pin.trim(),
        holiday_availability: profile.holiday_availability
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        languages: profile.languages
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        specialisms: profile.specialisms
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        years_experience: profile.years_experience.trim()
          ? parseInt(profile.years_experience.trim(), 10) || null
          : null,
      };

      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Save failed');
      }

      const saved = await res.json();
      setUpdatedAt(saved.updated_at ?? new Date().toISOString());
      setOriginal(profile);
      setStatus('saved');
      setTimeout(() => setStatus('ready'), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed');
      setStatus('error');
      setTimeout(() => setStatus('ready'), 4000);
    }
  }

  async function handleCheckout() {
    setUpgradeStatus('redirecting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/checkout/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: selectedTier }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to start checkout');
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Checkout failed');
      setUpgradeStatus('error');
      setTimeout(() => setUpgradeStatus('idle'), 4000);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  }

  async function handleRemoveListing() {
    if (removeConfirmText.trim().toUpperCase() !== 'DELETE') return;
    setRemoveDeleting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/account/listing', { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || 'Could not remove listing');
      }
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not remove listing');
      setRemoveDeleting(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--muted)]">
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading your profile…
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8">
          <h2 className="text-lg font-bold text-[var(--navy)]">Listing not found</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            We couldn&rsquo;t find a directory listing for <strong>{userEmail}</strong>.
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            If you&rsquo;re already listed under a different email, contact us. Otherwise, register for a free profile.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn-gold !text-sm">Register free</Link>
            <Link href="/Contact" className="btn-outline !text-sm">Contact us</Link>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 text-sm font-medium text-[var(--gold-link)] hover:underline"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-[var(--navy)]">
            Welcome back, {profile.name || userEmail}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Signed in as {userEmail}
            {repSlug && (
              <>
                {' · '}
                <Link href={`/rep/${repSlug}`} className="font-medium text-[var(--gold-link)] hover:underline">
                  View public profile
                </Link>
              </>
            )}
            {isAdmin && (
              <>
                {' · '}
                <Link href="/admin" className="font-medium text-[var(--gold-link)] hover:underline">
                  Open admin
                </Link>
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="shrink-0 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:border-red-300 hover:text-red-600"
        >
          Sign out
        </button>
      </div>

      {updatedAt && (
        <p className="mt-2 text-xs text-[var(--muted)]">
          Last updated: {new Date(updatedAt).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      {/* Featured status section */}
      <FeaturedListingAdvert className="mt-6" />

      {/* Contribute custody numbers → free featured month */}
      <div className="mt-6 rounded-xl border border-[var(--border)] bg-gradient-to-r from-slate-50 to-white p-5">
        <h3 className="font-bold text-[var(--navy)]">Earn a free featured month</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          You dial custody desks every day. Confirm, correct or add the numbers for stations you
          cover — contribute five and earn a free featured month (and help every rep who comes after
          you).
        </p>
        <Link href="/contribute-custody-numbers" className="btn-gold mt-4 inline-block !text-sm">
          Contribute custody numbers
        </Link>
      </div>

      {upgradeStatus === 'success' && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-bold text-emerald-900">Payment Successful!</h3>
          </div>
          <p className="mt-2 text-sm text-emerald-800">
            Your featured listing is now active. It will appear in the spotlight section on the homepage and directory.
          </p>
        </div>
      )}

      {featuredInfo && (
        <div className="mt-6">
          {featuredInfo.featured ? (
            <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-5">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h3 className="font-bold text-amber-900">Featured Listing</h3>
                {(featuredInfo.status === 'grandfathered' || featuredInfo.status === 'legacy') && (
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800">Legacy</span>
                )}
              </div>
              <p className="mt-2 text-sm text-amber-800">
                {(featuredInfo.status === 'grandfathered' || featuredInfo.status === 'legacy')
                  ? 'You are currently a Featured Representative. As part of our early platform rollout, your featured status has been retained.'
                  : 'Your listing appears in the Featured Representatives section on the homepage and directory.'}
              </p>
              <p className="mt-2 text-sm font-semibold text-amber-900">
                Status: {(featuredInfo.status === 'grandfathered' || featuredInfo.status === 'legacy') ? 'Legacy' : 'Active'}
              </p>
              {featuredInfo.activatedAt && (
                <p className="mt-1 text-xs text-amber-600">
                  Activated: {new Date(featuredInfo.activatedAt).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              {featuredInfo.status === 'cancelled' && featuredInfo.expiresAt && (
                <p className="mt-1 text-xs text-amber-700">
                  Subscription cancelled — active until {new Date(featuredInfo.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {featuredInfo.renewsAt && featuredInfo.status === 'active' && (
                <p className="mt-1 text-xs text-amber-600">
                  Renews: {new Date(featuredInfo.renewsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[var(--navy)]">Featured Listing</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Status: <span className="font-semibold text-[var(--navy)]">Not Active</span>. Upgrade to increase your visibility.
                  </p>
                </div>
                <Link href="/GoFeatured" className="shrink-0 text-xs font-semibold text-[var(--gold-link)] hover:underline">
                  Learn more
                </Link>
              </div>

              {upgradeStatus === 'idle' && (
                <button
                  type="button"
                  onClick={() => setUpgradeStatus('selecting')}
                  className="btn-gold mt-4 !text-sm"
                >
                  Upgrade to Featured – £4.99/month
                </button>
              )}

              {upgradeStatus === 'selecting' && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-[var(--navy)]">Choose your plan:</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {PRICING_TIERS.map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedTier(tier.id)}
                        className={`relative rounded-lg border p-3 text-left transition-all ${
                          selectedTier === tier.id
                            ? 'border-[var(--gold)] bg-[var(--gold-pale)] ring-2 ring-[var(--gold)]/30'
                            : 'border-[var(--border)] hover:border-[var(--gold)]/50'
                        }`}
                      >
                        {tier.badge && (
                          <span className="absolute -top-2 right-2 rounded-full bg-[var(--navy)] px-2 py-0.5 text-[10px] font-bold text-white">
                            {tier.badge}
                          </span>
                        )}
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-[var(--navy)]">{tier.price}</span>
                          <span className="text-xs text-[var(--muted)]">{tier.period}</span>
                        </div>
                        {tier.savings && (
                          <span className="mt-1 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                            {tier.savings}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={handleCheckout}
                      className="btn-gold !text-sm"
                    >
                      Continue to payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpgradeStatus('idle')}
                      className="btn-outline !text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {upgradeStatus === 'redirecting' && (
                <div className="mt-4 flex items-center gap-2 text-sm text-[var(--muted)]">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Redirecting to secure checkout…
                </div>
              )}

              {upgradeStatus === 'error' && errorMsg && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                  {errorMsg}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="mt-6 space-y-8">
        {/* Identity */}
        <fieldset>
          <legend className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">Identity</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={profile.name} onChange={(v) => set('name', v)} required />
            <Field label="Accreditation" value={profile.accreditation} onChange={(v) => set('accreditation', v)} placeholder="e.g. Law Society Accredited" />
          </div>
        </fieldset>

        {/* Contact */}
        <fieldset>
          <legend className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">Contact</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Phone" type="tel" value={profile.phone} onChange={(v) => set('phone', v)} />
            <Field label="Email" type="email" value={profile.email} disabled note="Contact us to change your email" />
            <Field label="Website" type="url" value={profile.website_url} onChange={(v) => set('website_url', v)} placeholder="https://…" />
            <Field label="WhatsApp link" type="url" value={profile.whatsapp_link} onChange={(v) => set('whatsapp_link', v)} placeholder="https://wa.me/…" />
          </div>
        </fieldset>

        {/* Coverage */}
        <fieldset>
          <legend className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">Coverage &amp; availability</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Availability" value={profile.availability} onChange={(v) => set('availability', v)} placeholder="e.g. 24/7, Weekends only" />
            <Field label="Postcode" value={profile.postcode} onChange={(v) => set('postcode', v)} placeholder="e.g. SW1A 1AA" />
            <div className="sm:col-span-2">
              <Field
                label="Counties covered"
                value={profile.counties}
                onChange={(v) => set('counties', v)}
                placeholder="e.g. Kent, Sussex, Surrey"
                note="Comma-separated. These are the counties your profile will appear under in directory searches."
              />
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Stations covered"
                value={profile.stations_covered}
                onChange={(v) => set('stations_covered', v)}
                placeholder="Comma-separated station names"
                note="Separate with commas"
              />
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Holiday availability"
                value={profile.holiday_availability}
                onChange={(v) => set('holiday_availability', v)}
                placeholder="e.g. Christmas, Bank holidays"
                note="Comma-separated"
              />
            </div>
          </div>
        </fieldset>

        {/* Profile */}
        <fieldset>
          <legend className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">Profile</legend>
          <div className="mt-3 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--navy)]">Notes / bio</label>
              <textarea
                value={profile.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
                placeholder="Tell firms about your experience and areas of expertise…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Languages" value={profile.languages} onChange={(v) => set('languages', v)} placeholder="e.g. English, Welsh" note="Comma-separated" />
              <Field label="Specialisms" value={profile.specialisms} onChange={(v) => set('specialisms', v)} placeholder="e.g. Fraud, Drug offences" note="Comma-separated" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Years of experience" type="number" value={profile.years_experience} onChange={(v) => set('years_experience', v)} placeholder="e.g. 5" />
              <Field label="DSCC PIN" value={profile.dscc_pin} onChange={(v) => set('dscc_pin', v)} placeholder="Your DSCC PIN" />
            </div>
          </div>
        </fieldset>

        {/* Status bar */}
        {status === 'saved' && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Profile saved successfully.
          </div>
        )}
        {status === 'error' && errorMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center gap-4 border-t border-[var(--border)] pt-6">
          <button
            type="submit"
            disabled={!hasChanges || status === 'saving'}
            className="btn-gold !text-sm disabled:opacity-50"
          >
            {status === 'saving' ? 'Saving…' : 'Save changes'}
          </button>
          {hasChanges && (
            <span className="text-xs text-amber-600">You have unsaved changes</span>
          )}
        </div>
      </form>

      <section
        className="mt-10 rounded-2xl border border-red-200 bg-red-50/60 p-5 shadow-sm sm:p-6"
        aria-labelledby="remove-listing-heading"
      >
        <h3 id="remove-listing-heading" className="text-sm font-bold uppercase tracking-wide text-red-900">
          Remove from directory
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-red-950/90">
          You can delete your public listing completely. This removes your profile from search, county pages,
          and station pages. If you have a Featured subscription, cancel or manage billing in your Lemon Squeezy
          customer portal so you are not charged after you leave — directory removal does not automatically cancel
          a subscription.
        </p>
        {!showRemoveListing ? (
          <button
            type="button"
            onClick={() => {
              setShowRemoveListing(true);
              setRemoveConfirmText('');
            }}
            className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100"
          >
            Remove my listing permanently…
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-red-900">
              Type <span className="font-mono font-bold">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={removeConfirmText}
              onChange={(e) => setRemoveConfirmText(e.target.value)}
              autoComplete="off"
              className="w-full max-w-md rounded-[var(--radius)] border border-red-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
              placeholder="DELETE"
              aria-label="Type DELETE to confirm listing removal"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={removeConfirmText.trim().toUpperCase() !== 'DELETE' || removeDeleting}
                onClick={() => void handleRemoveListing()}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-50"
              >
                {removeDeleting ? 'Removing…' : 'Remove my listing'}
              </button>
              <button
                type="button"
                disabled={removeDeleting}
                onClick={() => {
                  setShowRemoveListing(false);
                  setRemoveConfirmText('');
                }}
                className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--muted)] hover:border-red-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  disabled,
  note,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  note?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--navy)]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20 disabled:bg-slate-50 disabled:text-[var(--muted)]"
      />
      {note && <p className="mt-1 text-xs text-[var(--muted)]">{note}</p>}
    </div>
  );
}
