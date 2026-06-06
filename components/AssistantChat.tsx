'use client';

import Link from 'next/link';
import { useCallback, useId, useRef, useState } from 'react';
import { ASSISTANT_STARTER_PROMPTS } from '@/lib/assistant/corpus';
import type { AssistantQueryResult } from '@/lib/assistant/types';

type AssistantChatProps = {
  compact?: boolean;
  className?: string;
};

export function AssistantChat({ compact = false, className = '' }: AssistantChatProps) {
  const formId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssistantQueryResult | null>(null);

  const submit = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/assistant/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = (await res.json()) as AssistantQueryResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setResult(data);
    } catch {
      setError('Unable to reach the assistant. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit(message);
  };

  const onPromptClick = (prompt: string) => {
    setMessage(prompt);
    void submit(prompt);
  };

  return (
    <div className={className}>
      <p
        className={`rounded-lg border border-[var(--gold)]/30 bg-[var(--gold-pale)]/80 text-[var(--navy)] ${
          compact ? 'px-3 py-2 text-[11px] leading-snug' : 'px-4 py-3 text-xs leading-relaxed'
        }`}
      >
        {result?.disclaimer ??
          'General information from our published guides only — not legal advice. For custody emergencies, instruct a criminal defence solicitor.'}
      </p>

      <div className={`flex flex-wrap gap-2 ${compact ? 'mt-3' : 'mt-4'}`}>
        {ASSISTANT_STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={loading}
            onClick={() => onPromptClick(prompt)}
            className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium text-[var(--navy)] transition-colors hover:border-[var(--gold)]/50 hover:bg-[var(--gold-pale)] disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className={`flex gap-2 ${compact ? 'mt-3' : 'mt-4'}`}>
        <label htmlFor={formId} className="sr-only">
          Ask a question
        </label>
        <input
          ref={inputRef}
          id={formId}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          placeholder="Ask about registration, station numbers, PSRAS…"
          disabled={loading}
          className={`min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--navy)] outline-none ring-[var(--gold)] focus:border-[var(--gold)] focus:ring-2 ${
            compact ? 'py-2' : 'py-2.5'
          }`}
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--navy-light)] disabled:opacity-50"
        >
          {loading ? '…' : 'Ask'}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div aria-live="polite" aria-atomic="false" className={compact ? 'mt-3 space-y-3' : 'mt-5 space-y-4'}>
        {result?.refused && result.refusalMessage && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p>{result.refusalMessage}</p>
            {result.suggestedLinks.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {result.suggestedLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-semibold text-[var(--navy)] underline-offset-2 hover:underline"
                    >
                      {link.label} →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!result?.refused && result?.refusalMessage && result.matches.length === 0 && (
          <p className="text-sm text-[var(--muted)]">{result.refusalMessage}</p>
        )}

        {result?.matches.map(({ entry, score }) => (
          <article
            key={entry.id}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">{entry.category}</p>
            <h3 className="mt-1 text-sm font-bold text-[var(--navy)]">{entry.question}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{entry.answer}</p>
            {entry.href && (
              <Link
                href={entry.href}
                className="mt-2 inline-block text-xs font-semibold text-[var(--gold-link)] no-underline hover:underline"
              >
                Read more on this topic →
              </Link>
            )}
            {!compact && (
              <p className="mt-2 text-[10px] text-[var(--muted)]">Match confidence: {Math.round(score * 100)}%</p>
            )}
          </article>
        ))}

        {!result?.refused && result && result.matches.length === 0 && result.suggestedLinks.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {result.suggestedLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
