'use client';

import Link from 'next/link';
import type { Representative } from '@/lib/types';
import { DirectoryCard } from '@/components/DirectoryCard';
import { JoinCTA } from '@/components/directory/JoinCTA';
import { CustodyNoteInlineCTA } from '@/components/CustodyNoteInlineCTA';
import { SidebarKentAgentPromo, SidebarWhatsAppPromo } from '@/components/directory/SidebarCrossPromos';
import { AdvertisementLabel } from '@/components/AdvertisementLabel';

interface RightPanelProps {
  featuredReps: Representative[];
  totalReps: number;
}

const QUICK_LINKS = [
  { href: '/Map', label: 'Station map', icon: '\uD83D\uDCCD' },
  { href: '/Forces', label: 'Browse by force', icon: '\uD83D\uDEE1\uFE0F' },
  { href: '/StationsDirectory', label: 'Stations directory', icon: '\uD83C\uDFDB\uFE0F' },
  { href: '/directory/counties', label: 'Browse counties', icon: '\uD83D\uDDFA\uFE0F' },
];

export function RightPanel({ featuredReps, totalReps }: RightPanelProps) {
  const topFeatured = featuredReps.slice(0, 2);

  return (
    <div className="space-y-4">
      {/* Trust banner */}
      <div className="rounded-xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--navy)]/10">
            <svg className="h-5 w-5 text-[var(--navy)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--navy)]">Trusted by solicitor firms</p>
            <p className="text-xs text-slate-500">
              {totalReps} experienced reps across England &amp; Wales
            </p>
          </div>
        </div>
      </div>

      <CustodyNoteInlineCTA variant="compact" />

      <SidebarKentAgentPromo />

      <SidebarWhatsAppPromo />

      {/* Featured spotlight */}
      {topFeatured.length > 0 && (
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <AdvertisementLabel label="Featured listings (paid placement)" className="mb-2" />
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--navy)]">Featured reps</h3>
            <Link
              href="/GoFeatured"
              className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold-link)] no-underline hover:text-[var(--gold)]"
            >
              Go Featured
            </Link>
          </div>
          <div className="space-y-3">
            {topFeatured.map((rep) => (
              <DirectoryCard key={rep.id} rep={rep} matchHighlight="runner" compact />
            ))}
          </div>
        </div>
      )}

      {/* Join CTA */}
      <JoinCTA variant="sidebar" totalReps={totalReps} />

      {/* Quick navigation */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-[var(--navy)]">Explore</h3>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-xs font-semibold text-[var(--navy)] no-underline transition-all hover:border-[var(--gold)]/40 hover:bg-[var(--gold-pale)] hover:shadow-sm"
            >
              <span aria-hidden>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
