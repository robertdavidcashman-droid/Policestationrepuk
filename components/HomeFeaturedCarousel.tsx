'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Representative } from '@/lib/types';
import { phoneToTelHref } from '@/lib/phone';
import { AdvertisementLabel } from './AdvertisementLabel';

export function HomeFeaturedCarousel({ featuredReps }: { featuredReps: Representative[] }) {
  const [current, setCurrent] = useState(0);
  const [showContact, setShowContact] = useState<Record<number, boolean>>({});

  if (!featuredReps || featuredReps.length === 0) return null;

  const rep = featuredReps[current];
  const quote = rep.bio || rep.notes || '';
  const website = rep.websiteUrl || '';

  const toggleContact = (idx: number) => {
    setShowContact((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <section className="section-pad bg-[var(--navy)]" aria-label="Sponsored representative listings">
      <div className="page-container !py-0">
        <div className="text-center">
          <AdvertisementLabel variant="dark" label="Promoted Listings" />
          <h2 className="text-h2 mt-3 text-white">Featured Police Station Representatives</h2>
          <p className="mt-2 text-sm text-white/80">
            These are promoted listings. Firms and reps should verify accreditation and credentials independently.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl">
          <div className="rounded-[var(--radius-lg)] border-2 border-[var(--gold)] bg-[var(--navy-light)] p-6 shadow-xl sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="rounded-full bg-[var(--gold)] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[var(--ink)]">
                  Featured
                </span>
                <h3 className="mt-3 text-xl font-bold text-white">{rep.name}</h3>
                <p className="mt-1 text-sm text-white/75">{rep.county || 'England & Wales'}</p>
              </div>
              {rep.availability && (
                <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white">
                  {rep.availability}
                </span>
              )}
            </div>
            {(rep.stations || []).length > 0 && (
              <p className="mt-3 text-sm text-white/75">
                <span className="font-semibold text-white">Stations covered:</span>{' '}
                {(rep.stations || []).slice(0, 3).join(', ')}
                {(rep.stations || []).length > 3 ? ` +${(rep.stations || []).length - 3} more` : ''}
              </p>
            )}
            {quote ? (
              <blockquote className="mt-4 border-l-4 border-[var(--gold)] pl-4 text-sm italic leading-relaxed text-white">
                &ldquo;{quote}&rdquo;
              </blockquote>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => toggleContact(current)}
                className="btn-gold !min-h-[40px] !px-4 !py-2 !text-sm"
              >
                {showContact[current] ? 'Hide Contact Details' : 'Show Contact Details'}
              </button>
              <Link href={`/rep/${rep.slug}`} className="btn-outline !min-h-[40px] !border-slate-500 !px-4 !py-2 !text-sm !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)]">
                View Full Profile
              </Link>
              {website ? (
                <Link href={website} target="_blank" rel="noopener noreferrer" className="btn-outline !min-h-[40px] !border-slate-500 !px-4 !py-2 !text-sm !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)]">
                  Visit Website
                </Link>
              ) : null}
            </div>

            {showContact[current] && (
              <div className="mt-4 rounded-lg border border-white bg-[var(--navy)] p-4 text-sm text-white">
                {rep.phone ? (
                  <a href={phoneToTelHref(rep.phone)} className="block font-medium text-white no-underline hover:text-[var(--gold)]">
                    📞 {rep.phone}
                  </a>
                ) : null}
                {rep.email ? (
                  <a href={`mailto:${rep.email}`} className="mt-2 block font-medium text-white no-underline hover:text-[var(--gold)]">
                    ✉️ {rep.email}
                  </a>
                ) : null}
                {rep.whatsappLink ? (
                  <a
                    href={rep.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block font-medium text-white no-underline hover:text-[var(--gold)]"
                  >
                    💬 WhatsApp
                  </a>
                ) : null}
                {!rep.phone && !rep.email ? (
                  <p>View the full profile for contact details →</p>
                ) : null}
                <Link href={`/rep/${rep.slug}`} className="mt-2 inline-block font-semibold text-[var(--gold)] no-underline hover:text-[var(--gold-hover)]">
                  Go to profile
                </Link>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrent((c) => (c - 1 + featuredReps.length) % featuredReps.length)}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-white transition-colors hover:bg-white hover:text-[var(--navy)]"
              aria-label="Previous spotlight rep"
            >
              ←
            </button>
            <div className="flex items-center gap-1">
              {featuredReps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  aria-label={`Go to spotlight ${i + 1} of ${featuredReps.length}`}
                >
                  <span
                    className={`block rounded-full transition-all ${i === current ? 'h-2.5 w-6 bg-[var(--gold)]' : 'h-2.5 w-2.5 bg-white hover:bg-[var(--gold-light)]'}`}
                    aria-hidden
                  />
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrent((c) => (c + 1) % featuredReps.length)}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-white transition-colors hover:bg-white hover:text-[var(--navy)]"
              aria-label="Next spotlight rep"
            >
              →
            </button>
          </div>

          <p className="mt-6 text-center">
            <Link href="/directory" className="text-sm font-semibold text-white underline decoration-white/40 underline-offset-2 hover:decoration-white">
              View all representatives →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
