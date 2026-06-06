'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ASSISTANT_STARTER_PROMPTS } from '@/lib/assistant/corpus';
import type { AssistantQueryResult } from '@/lib/assistant/types';
import {
  AssistantMessageList,
  type ChatTurn,
} from '@/components/assistant/AssistantMessageList';

const DEFAULT_DISCLAIMER =
  'General information from our published guides only — not legal advice. For custody emergencies, instruct a criminal defence solicitor.';

type AssistantChatProps = {
  compact?: boolean;
  className?: string;
};

function nextTurnId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AssistantChat({ compact = false, className = '' }: AssistantChatProps) {
  const formId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [disclaimer, setDisclaimer] = useState(DEFAULT_DISCLAIMER);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [turns, loading, scrollToBottom]);

  const submit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setMessage('');
      setLoading(true);
      setError(null);
      setTurns((prev) => [...prev, { id: nextTurnId(), role: 'user', text: trimmed }]);

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
        if (data.disclaimer) setDisclaimer(data.disclaimer);
        setTurns((prev) => [...prev, { id: nextTurnId(), role: 'assistant', result: data }]);
      } catch {
        setError('Unable to reach the assistant. Check your connection and try again.');
      } finally {
        setLoading(false);
        textareaRef.current?.focus();
      }
    },
    [loading],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit(message);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit(message);
    }
  };

  const onPromptClick = (prompt: string) => {
    void submit(prompt);
  };

  const isEmpty = turns.length === 0 && !loading;

  return (
    <div
      className={`flex min-h-0 flex-col ${compact ? 'h-full' : 'min-h-[22rem]'} ${className}`}
    >
      <div
        ref={scrollRef}
        className={`min-h-0 flex-1 overflow-y-auto ${compact ? 'px-0.5 pb-2' : 'pb-3'}`}
      >
        {isEmpty ? (
          <p className={`text-[var(--muted)] ${compact ? 'text-xs' : 'text-sm'}`}>
            Ask about directory registration, station phone numbers, PSRAS career routes, or how
            this site works.
          </p>
        ) : (
          <AssistantMessageList turns={turns} loading={loading} compact={compact} />
        )}
      </div>

      {error && (
        <p className="mb-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {isEmpty && (
        <div className={`flex flex-wrap gap-2 ${compact ? 'mb-2' : 'mb-3'}`}>
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
      )}

      <form onSubmit={onSubmit} className="mt-auto flex shrink-0 items-end gap-2 border-t border-[var(--border)] pt-3">
        <label htmlFor={formId} className="sr-only">
          Ask a question
        </label>
        <textarea
          ref={textareaRef}
          id={formId}
          rows={compact ? 2 : 2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={500}
          placeholder="Ask about registration, station numbers, PSRAS…"
          disabled={loading}
          className={`min-h-[2.75rem] min-w-0 flex-1 resize-none rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--navy)] outline-none ring-[var(--gold)] focus:border-[var(--gold)] focus:ring-2 ${
            compact ? 'text-sm' : ''
          }`}
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          aria-label="Send"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[var(--navy)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--navy-light)] disabled:opacity-50"
        >
          {loading ? '…' : 'Send'}
        </button>
      </form>

      <p className={`mt-2 text-center text-[var(--muted)] ${compact ? 'text-[10px]' : 'text-xs'}`}>
        {disclaimer}
      </p>
    </div>
  );
}
