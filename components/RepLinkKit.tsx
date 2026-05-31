'use client';

import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  repEmailSignature,
  repQrDownloadFilename,
  repShareBlurb,
} from '@/lib/rep-link-kit';

type RepLinkKitProps = {
  name: string;
  slug: string;
  profileUrl: string;
  county?: string | null;
};

function CopyFieldButton({
  label,
  value,
  copiedLabel,
}: {
  label: string;
  value: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-[var(--navy)] transition-colors hover:border-[var(--gold)]/50 hover:bg-[var(--gold-pale)]"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

export function RepLinkKit({ name, slug, profileUrl, county }: RepLinkKitProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const shareText = repShareBlurb(name, county);
  const emailSignature = repEmailSignature(name, profileUrl, county);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(profileUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [profileUrl]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name} — police station rep`,
          text: shareText,
          url: profileUrl,
        });
        return;
      } catch {
        /* fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${profileUrl}`);
    } catch {
      /* ignore */
    }
  }, [name, profileUrl, shareText]);

  const handleDownloadQr = useCallback(() => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = repQrDownloadFilename(slug);
    a.click();
  }, [qrDataUrl, slug]);

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[var(--card-shadow)]">
      <h2 className="text-lg font-bold text-[var(--navy)]">Link kit</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        Use on business cards, email signatures, and firm intranets. Your listing URL stays the same
        when you update contact details.
      </p>

      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Profile URL</p>
        <p className="mt-1 break-all rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800">
          {profileUrl}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[var(--gold)]/40 bg-[var(--gold-pale)] px-4 py-2 text-sm font-semibold text-[var(--navy)] transition-colors hover:border-[var(--gold)]"
        >
          Share profile
        </button>
        <CopyFieldButton label="Copy profile link" value={profileUrl} copiedLabel="Link copied!" />
        <CopyFieldButton
          label="Copy email signature"
          value={emailSignature}
          copiedLabel="Signature copied!"
        />
      </div>

      <div className="mt-5 border-t border-slate-100 pt-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">QR code</p>
        <p className="mt-1 text-xs text-slate-600">Scan to open this profile — print on cards or posters.</p>
        <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL from qrcode library
            <img
              src={qrDataUrl}
              alt={`QR code linking to ${name} on PoliceStationRepUK`}
              width={220}
              height={220}
              className="h-auto max-w-full rounded-lg border border-slate-200 bg-white p-2"
              style={{ width: 'min(220px, 100%)' }}
            />
          ) : (
            <div
              className="flex h-[220px] w-[220px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500"
              aria-hidden
            >
              Generating…
            </div>
          )}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[140px]">
            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={!qrDataUrl}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download PNG
            </button>
          </div>
        </div>
      </div>

      <details className="mt-4 text-xs text-slate-600">
        <summary className="cursor-pointer font-semibold text-[var(--navy)]">Preview email signature</summary>
        <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-3 font-sans text-xs leading-relaxed text-slate-700">
          {emailSignature}
        </pre>
      </details>
    </section>
  );
}
