'use client';

import { useCallback, useState } from 'react';

type CopyLinkButtonProps = {
  url: string;
  label?: string;
  copiedLabel?: string;
  shareTitle?: string;
  shareText?: string;
  className?: string;
};

export function CopyLinkButton({
  url,
  label = 'Copy link',
  copiedLabel = 'Link copied!',
  shareTitle,
  shareText,
  className = '',
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    const text = shareText ? `${shareText}\n${url}` : url;
    if (navigator.share && shareTitle) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url });
        return;
      } catch {
        /* fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  }, [url, shareTitle, shareText]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ||
        'inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-[var(--navy)] transition-colors hover:border-[var(--gold)]/50 hover:bg-[var(--gold-pale)]'
      }
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
