'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Representative } from '@/lib/types';
import { phoneToTelHref } from '@/lib/phone';
import { RepTrustBadges } from '@/components/RepTrustBadges';

function getAvailabilityBadge(raw: string): { label: string; color: string; live?: boolean } {
  const lower = raw.toLowerCase().trim();
  if (/24\s*[\/\s]?\s*7|24\s*hour|all\s*hour|anytime|any\s*time|full\s*time|mon-sun\s*24/i.test(lower))
    return { label: '24/7', color: 'bg-emerald-500/15 text-emerald-800 border-emerald-400/40', live: true };
  if (/evening|night|after\s*(5|6|7|8)|out\s*of\s*hours|pm\s*onwards/i.test(lower))
    return { label: 'Evenings / nights', color: 'bg-indigo-500/15 text-indigo-900 border-indigo-400/35' };
  if (/weekend|sat.*sun/i.test(lower))
    return { label: 'Weekends', color: 'bg-violet-500/15 text-violet-900 border-violet-400/35' };
  if (/day(time|s)|morning|afternoon|mon.*fri|9.*5|8.*6/i.test(lower))
    return { label: 'Daytime', color: 'bg-sky-500/15 text-sky-900 border-sky-400/35' };
  if (/flexi|arrangement|please\s*call|usually|general/i.test(lower))
    return { label: 'Flexible', color: 'bg-amber-500/12 text-amber-950 border-amber-400/35' };
  if (!raw || lower === 'any' || lower === 'all' || lower === 'most')
    return { label: 'Available', color: 'bg-emerald-500/15 text-emerald-800 border-emerald-400/40', live: true };
  return {
    label: raw.length > 22 ? raw.slice(0, 20) + '\u2026' : raw,
    color: 'bg-slate-100 text-slate-800 border-slate-300/60',
  };
}

function websiteLinkLabel(url: string): string {
  const raw = (url || '').trim();
  if (!raw) return 'Website';
  try {
    const u = new URL(raw.includes('://') ? raw : `https://${raw}`);
    return u.hostname.replace(/^www\./i, '');
  } catch {
    return 'Website';
  }
}

export type MatchHighlight = 'top' | 'runner' | null;

export interface DirectoryCardProps {
  rep: Representative;
  matchHighlight?: MatchHighlight;
  compact?: boolean;
}

export function DirectoryCard({ rep, matchHighlight, compact }: DirectoryCardProps) {
  const [quickOpen, setQuickOpen] = useState(false);
  const avail = getAvailabilityBadge(rep.availability || '');
  const phoneHref = rep.phone ? phoneToTelHref(rep.phone) : null;
  const excerpt = (rep.bio || rep.notes || '').trim();
  const stationCount = (rep.stations || []).length;
  const accLabel = (rep.accreditation || '').includes('Duty')
    ? 'Duty solicitor'
    : (rep.accreditation || '').toLowerCase().includes('solicitor')
      ? 'Solicitor'
      : 'Verified rep';

  const isFeatured = rep.featured;

  const ringClass =
    matchHighlight === 'top'
      ? 'ring-2 ring-[var(--gold)]/70 shadow-lg shadow-[var(--navy)]/10'
      : matchHighlight === 'runner'
        ? 'ring-1 ring-[var(--gold)]/35'
        : '';

  const featuredBorder = isFeatured
    ? 'border-[var(--gold)]/50 bg-gradient-to-b from-[var(--gold-pale)]/40 to-white'
    : 'border-slate-200/90 bg-white';

  if (compact) {
    return (
      <Link
        href={`/rep/${rep.slug}`}
        className="group flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3 no-underline transition-all hover:border-[var(--gold)]/40 hover:bg-white hover:shadow-sm"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-xs font-bold text-white">
          {(rep.name || '?')[0]}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[var(--navy)] group-hover:text-[var(--gold-link)]">
            {rep.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{rep.county || 'England & Wales'}</p>
          <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${avail.color}`}>
            {avail.label}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-xl border ${featuredBorder} shadow-[0_4px_24px_-4px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--navy)]/25 hover:shadow-[0_12px_40px_-8px_rgba(30,58,138,0.18)] ${ringClass}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--navy)] via-[var(--navy-mid)] to-[var(--gold)] opacity-90" />

      {isFeatured && (
        <div className="absolute left-3 top-4 z-10 flex items-center gap-1 rounded-full border border-[var(--gold)]/60 bg-[var(--gold)] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[var(--ink)] shadow-sm">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Featured
        </div>
      )}

      {matchHighlight === 'top' && !isFeatured && (
        <div className="absolute right-3 top-4 z-10 rounded-full bg-[var(--gold)] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[var(--ink)] shadow-sm">
          Top match
        </div>
      )}
      {matchHighlight === 'runner' && !isFeatured && (
        <div className="absolute right-3 top-4 z-10 rounded-full border border-[var(--gold)]/50 bg-white/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--navy)]">
          Strong match
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 pt-6 sm:p-6">
        {/* Badges row */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${avail.color}`}
          >
            {avail.live && (
              <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            )}
            {avail.label}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--navy)]">
            {accLabel}
          </span>
          {stationCount > 0 && (
            <span className="text-[11px] font-medium text-slate-500">
              Covers {stationCount} station{stationCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="text-xl font-bold tracking-tight text-[var(--navy)] sm:text-[1.35rem]">{rep.name}</h3>

        {/* County + experience */}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-[var(--muted)]">
          <span className="font-medium text-slate-700">{rep.county?.trim() || 'Coverage on profile'}</span>
          {rep.yearsExperience != null && rep.yearsExperience > 0 && (
            <>
              <span className="text-slate-300" aria-hidden>&middot;</span>
              <span>{rep.yearsExperience}+ yrs experience</span>
            </>
          )}
          {phoneHref && (
            <>
              <span className="text-slate-300" aria-hidden>&middot;</span>
              <span className="text-emerald-700">Fast response</span>
            </>
          )}
        </p>

        {/* Trust badges */}
        <div className="mt-3">
          <RepTrustBadges rep={rep} variant="card" />
        </div>

        {/* Bio excerpt */}
        {excerpt ? (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">{excerpt}</p>
        ) : null}

        {/* Stations */}
        <div className="mt-3">
          <div className="flex flex-wrap gap-1.5">
            {(rep.stations || []).slice(0, 3).map((station) => (
              <span
                key={station}
                className="max-w-full truncate rounded-md bg-[var(--gold-pale)] px-2 py-0.5 text-[11px] font-medium text-[var(--navy)] ring-1 ring-[var(--gold)]/25"
                title={station}
              >
                {station}
              </span>
            ))}
            {stationCount > 3 && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                +{stationCount - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="flex-1" />

        {/* Quick contact panel */}
        {quickOpen && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4">
            <div className="grid gap-3 text-sm">
              {phoneHref && (
                <a
                  href={phoneHref}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 font-semibold text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)]/40 hover:bg-[var(--gold-pale)]"
                >
                  <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  {rep.phone}
                </a>
              )}
              {rep.email && (
                <a
                  href={`mailto:${rep.email}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 font-semibold text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)]/40 hover:bg-[var(--gold-pale)]"
                >
                  <svg className="h-4 w-4 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  {rep.email}
                </a>
              )}
              {rep.websiteUrl && (
                <a
                  href={rep.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 font-semibold text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)]/40 hover:bg-[var(--gold-pale)]"
                >
                  <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                  {websiteLinkLabel(rep.websiteUrl)}
                </a>
              )}
              {rep.whatsappLink && (
                <a
                  href={rep.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 font-semibold text-emerald-900 no-underline transition-colors hover:bg-emerald-100"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.917.918l4.462-1.496A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 01-5.39-1.583l-.386-.232-3.01 1.01 1.01-3.01-.232-.387A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                  </svg>
                  WhatsApp
                </a>
              )}
              {!rep.phone && !rep.email && (
                <p className="text-center text-sm text-[var(--muted)]">Contact details on full profile</p>
              )}
            </div>
            <Link
              href={`/rep/${rep.slug}`}
              className="mt-3 block text-center text-xs font-semibold text-[var(--gold-link)] no-underline hover:text-[var(--gold)]"
            >
              View full profile &rarr;
            </Link>
          </div>
        )}

        {/* CTA row — always visible */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex gap-2">
            {phoneHref ? (
              <a
                href={phoneHref}
                className="btn-gold flex flex-1 items-center justify-center gap-2 !min-h-[44px] text-center text-sm font-bold no-underline"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                Call
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => setQuickOpen((o) => !o)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                quickOpen
                  ? 'border-[var(--gold)] bg-[var(--gold-pale)] text-[var(--navy)]'
                  : 'border-slate-200 bg-white text-[var(--navy)] hover:border-[var(--gold)]/40 hover:bg-slate-50'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              {quickOpen ? 'Close' : 'Quick contact'}
            </button>
            <Link
              href={`/rep/${rep.slug}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)]/40 hover:bg-slate-50"
            >
              Profile
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
