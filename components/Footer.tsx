'use client';

import Link from 'next/link';
import {
  CUSTODYNOTE_ANYWHERE_HREF,
  CUSTODYNOTE_ANYWHERE_NAME,
  CUSTODYNOTE_ANYWHERE_NOTE,
  CUSTODYNOTE_BRAND_NAME,
  CUSTODYNOTE_DISCOUNT_CODE,
  CUSTODYNOTE_MEMBER_PRICE_GBP,
  CUSTODYNOTE_PLATFORM_LINE,
  CUSTODYNOTE_PRICE_GBP,
  CUSTODYNOTE_TRIAL_HREF,
} from '@/lib/custodynote-promo';
import { PSRTRAIN_CTA, PSRTRAIN_FREE_TESTING_NOTE, PSRTRAIN_NAME, PSRTRAIN_TRAINING_HREF } from '@/lib/psrtrain-promo';
import { SUPPORT_EMAIL, SUPPORT_MAILTO_HREF } from '@/lib/site-contact';
import {
  FOOTER_COLUMN_TITLES,
  FOOTER_COMMUNITY,
  FOOTER_DIRECTORIES,
  FOOTER_FOR_REPRESENTATIVES,
  FOOTER_LEGAL,
  FOOTER_REGULATORY_BODY,
  FOOTER_REGULATORY_TITLE,
  FOOTER_ADVERTISING_DISCLOSURE,
  FOOTER_SPOTLIGHT_KENT_BODY,
  FOOTER_SPOTLIGHT_KENT_TITLE,
  FOOTER_SPOTLIGHT_TRAINING_BODY,
  FOOTER_SPOTLIGHT_TRAINING_TITLE,
  FOOTER_TOOLS,
  WHATSAPP_JOIN_PHONE,
  FOOTER_UTILITY_COOKIE_SETTINGS,
  FOOTER_UTILITY_RSS_HREF,
  FOOTER_UTILITY_RSS_LABEL,
  FOOTER_UTILITY_SITEMAP_HREF,
  FOOTER_UTILITY_SITEMAP_LABEL,
  type FooterLink,
} from '@/lib/site-navigation';

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="min-w-0">
      <h3 className="break-words text-xs font-bold uppercase leading-snug tracking-widest text-[var(--gold)]">
        {title}
      </h3>
      <ul className="mt-4 space-y-1.5">
        {links.map((link, i) => (
          <li key={`${link.href}-${link.label}-${i}`}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center py-1 text-sm !text-[var(--footer-link)] no-underline transition-colors hover:!text-[var(--footer-link-hover)]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="inline-flex min-h-[44px] items-center py-1 text-sm !text-[var(--footer-link)] no-underline transition-colors hover:!text-[var(--footer-link-hover)]"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--navy-light)] bg-[var(--navy)]">
      <div className="mx-auto max-w-[var(--container-max)] px-[var(--container-gutter)] py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <h2 className="sr-only">Site footer and links</h2>

        <div className="mb-10 rounded-xl border border-[var(--gold)]/35 bg-gradient-to-r from-[#152e6e] to-[var(--navy)] p-5 sm:p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
            Tools for Police Station Reps
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-white/15 bg-black/20 p-4">
              <p className="text-sm font-bold text-white">{CUSTODYNOTE_BRAND_NAME} — at the station</p>
              <p className="mt-1 text-xs text-slate-300">
                Structured custody notes, offline-first, PDF + LAA billing. 30-day free trial · £
                {CUSTODYNOTE_PRICE_GBP}/mo · PSR UK readers £{CUSTODYNOTE_MEMBER_PRICE_GBP}/mo with code{' '}
                <span className="rounded bg-[var(--gold)]/20 px-1.5 py-0.5 font-mono font-bold text-[var(--gold)]">
                  {CUSTODYNOTE_DISCOUNT_CODE}
                </span>
                · {CUSTODYNOTE_PLATFORM_LINE}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={CUSTODYNOTE_TRIAL_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[var(--gold)] px-4 py-2 text-xs font-bold text-[var(--navy)] no-underline hover:bg-[var(--gold-hover)]"
                >
                  Start free trial
                </a>
                <Link
                  href="/CustodyNote"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-white/30 px-4 py-2 text-xs font-semibold text-white no-underline hover:bg-white/10"
                >
                  About {CUSTODYNOTE_BRAND_NAME}
                </Link>
              </div>
              <p className="mt-3 border-t border-white/10 pt-3 text-[11px] text-slate-300">
                {CUSTODYNOTE_ANYWHERE_NOTE}{' '}
                <a
                  href={CUSTODYNOTE_ANYWHERE_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--gold)] underline-offset-2 hover:underline"
                >
                  Learn about {CUSTODYNOTE_ANYWHERE_NAME} →
                </a>
              </p>
            </div>
            <div className="rounded-lg border border-white/15 bg-black/20 p-4">
              <p className="text-sm font-bold text-white">{PSRTRAIN_NAME} — before accreditation</p>
              <p className="mt-1 text-xs text-slate-300">
                Timed MCQs, PACE modules, and CIT-style scenarios. {PSRTRAIN_FREE_TESTING_NOTE}.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={PSRTRAIN_TRAINING_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-white/15 px-4 py-2 text-xs font-bold text-white no-underline hover:bg-white/25"
                >
                  {PSRTRAIN_CTA}
                </a>
                <Link
                  href="/PrepareForCIT"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-white/30 px-4 py-2 text-xs font-semibold text-white no-underline hover:bg-white/10"
                >
                  CIT guide
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-y-10 gap-x-8 sm:grid-cols-2 lg:grid-cols-5">
          <FooterColumn title={FOOTER_COLUMN_TITLES.directories} links={FOOTER_DIRECTORIES} />
          <FooterColumn
            title={FOOTER_COLUMN_TITLES.forRepresentatives}
            links={FOOTER_FOR_REPRESENTATIVES}
          />
          <FooterColumn title={FOOTER_COLUMN_TITLES.tools} links={FOOTER_TOOLS} />
          <FooterColumn title={FOOTER_COLUMN_TITLES.community} links={FOOTER_COMMUNITY} />
          <FooterColumn title={FOOTER_COLUMN_TITLES.legal} links={FOOTER_LEGAL} />
        </div>

        {/* Mid-footer spotlight — CustodyNote, Kent agent, WhatsApp, training */}
        <div className="mt-10 grid gap-8 border-t border-[var(--navy-light)] pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 className="text-sm font-bold text-white">{FOOTER_SPOTLIGHT_KENT_TITLE}</h4>
            <p className="mt-1 text-xs text-white">{FOOTER_SPOTLIGHT_KENT_BODY}</p>
            <Link
              href="/directory/kent"
              className="mt-2 inline-block text-xs font-semibold !text-[var(--gold)] no-underline hover:!text-white"
            >
              Kent reps hub →
            </Link>
            <span className="mx-1 text-xs text-slate-500">·</span>
            <a
              href="https://www.policestationagent.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-semibold !text-[var(--gold)] no-underline hover:!text-white"
            >
              Police station agent (Kent) →
            </a>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{CUSTODYNOTE_BRAND_NAME} — PACE attendance note software</h4>
            <p className="mt-1 text-xs text-white">
              PACE-aligned notes, offline-first, PDF + LAA billing, AES-256 encryption. £
              {CUSTODYNOTE_PRICE_GBP}/mo after a 30-day free trial. PSR UK readers £
              {CUSTODYNOTE_MEMBER_PRICE_GBP}/mo with code{' '}
              <span className="rounded bg-[var(--gold)]/20 px-1.5 py-0.5 font-mono font-bold text-[var(--gold)]">
                {CUSTODYNOTE_DISCOUNT_CODE}
              </span>
              .
            </p>
            <a
              href={CUSTODYNOTE_TRIAL_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-semibold !text-[var(--gold)] no-underline hover:!text-white"
            >
              Start free trial →
            </a>
            <span className="mx-1 text-xs text-slate-500">·</span>
            <Link
              href="/CustodyNote"
              className="mt-2 inline-block text-xs font-semibold !text-[var(--gold)] no-underline hover:!text-white"
            >
              About {CUSTODYNOTE_BRAND_NAME} →
            </Link>
            <span className="mx-1 text-xs text-slate-500">·</span>
            <a
              href={CUSTODYNOTE_ANYWHERE_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-semibold !text-[var(--gold)] no-underline hover:!text-white"
            >
              {CUSTODYNOTE_ANYWHERE_NAME} (browser/PWA) →
            </a>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">WhatsApp — reps &amp; firms</h4>
            <p className="mt-1 text-xs text-white">
              One community group for cover requests and networking. Text {WHATSAPP_JOIN_PHONE} to join — verification
              required.
            </p>
            <Link
              href="/WhatsApp"
              className="mt-2 inline-block text-xs font-semibold !text-[var(--gold)] no-underline hover:!text-white"
            >
              How to join →
            </Link>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{FOOTER_SPOTLIGHT_TRAINING_TITLE}</h4>
            <p className="mt-1 text-xs text-white">{FOOTER_SPOTLIGHT_TRAINING_BODY}</p>
            <Link
              href="/Wiki"
              className="mt-2 inline-block text-xs font-semibold !text-[var(--gold)] no-underline hover:!text-white"
            >
              Training &amp; resources →
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--navy-light)] pt-8">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
            {FOOTER_REGULATORY_TITLE}
          </h4>
          <p className="mt-3 max-w-4xl text-xs leading-relaxed text-white">{FOOTER_REGULATORY_BODY}</p>

          <h4 className="mt-6 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
            Advertising Disclosure
          </h4>
          <p className="mt-2 max-w-4xl text-xs leading-relaxed text-white">{FOOTER_ADVERTISING_DISCLOSURE}</p>

          <p className="mt-4 text-xs text-white/70">
            <span className="font-semibold text-white/90">Support:</span>{' '}
            <a
              href={SUPPORT_MAILTO_HREF}
              className="break-all font-medium text-[var(--gold)] underline-offset-2 hover:text-white hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
            {' · '}
            <Link href="/Contact" className="font-medium text-white/90 underline-offset-2 hover:text-[var(--gold)] hover:underline">
              Contact form
            </Link>
          </p>
          <p className="mt-2 text-xs text-white/70">
            &copy; {year} PoliceStationRepUK — operated by Defence Legal Services Ltd. All rights reserved.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-[var(--navy-light)] pt-6 sm:gap-x-4">
          <Link
            href={FOOTER_UTILITY_SITEMAP_HREF}
            className="inline-flex min-h-[44px] items-center px-2 text-xs !text-[var(--footer-link)] no-underline hover:!text-[var(--footer-link-hover)]"
          >
            {FOOTER_UTILITY_SITEMAP_LABEL}
          </Link>
          <Link
            href={FOOTER_UTILITY_RSS_HREF}
            className="inline-flex min-h-[44px] items-center px-2 text-xs !text-[var(--footer-link)] no-underline hover:!text-[var(--footer-link-hover)]"
          >
            {FOOTER_UTILITY_RSS_LABEL}
          </Link>
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center px-2 text-xs font-medium !text-[var(--footer-link)] transition-colors hover:!text-[var(--footer-link-hover)]"
            onClick={() => {
              localStorage.removeItem('cookies-accepted');
              window.location.reload();
            }}
          >
            {FOOTER_UTILITY_COOKIE_SETTINGS}
          </button>
        </div>
      </div>
    </footer>
  );
}
