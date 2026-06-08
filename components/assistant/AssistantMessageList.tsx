'use client';

import Link from 'next/link';
import type { AssistantMatch, AssistantQueryResult } from '@/lib/assistant/types';

export type ChatTurn =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; result: AssistantQueryResult };

type Props = {
  turns: ChatTurn[];
  loading?: boolean;
  compact?: boolean;
};

function SuggestedLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className: string;
}) {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function UserBubble({ text, compact }: { text: string; compact?: boolean }) {
  return (
    <div className="flex justify-end">
      <div
        className={`max-w-[88%] rounded-2xl rounded-br-md bg-[var(--navy)] text-white ${
          compact ? 'px-3 py-2 text-sm' : 'px-4 py-2.5 text-sm'
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function AssistantBubbleShell({
  children,
  tone = 'default',
  compact,
}: {
  children: React.ReactNode;
  tone?: 'default' | 'refusal';
  compact?: boolean;
}) {
  const toneClass =
    tone === 'refusal'
      ? 'border-amber-200 bg-amber-50 text-amber-950'
      : 'border-[var(--card-border)] bg-slate-50 text-[var(--navy)]';

  return (
    <div className="flex justify-start">
      <div
        className={`max-w-[92%] rounded-2xl rounded-bl-md border shadow-sm ${toneClass} ${
          compact ? 'px-3 py-2.5 text-sm' : 'px-4 py-3 text-sm'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function FaqAssistantContent({
  result,
  compact,
}: {
  result: AssistantQueryResult;
  compact?: boolean;
}) {
  const primary = result.primaryMatch ?? result.matches[0];
  const related = primary ? result.matches.filter((m) => m.entry.id !== primary.entry.id) : [];

  if (!primary) {
    return (
      <>
        {result.refusalMessage && <p>{result.refusalMessage}</p>}
        {result.suggestedLinks.length > 0 && (
          <ul className={`mt-2 flex flex-wrap gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
            {result.suggestedLinks.map((link) => (
              <li key={link.href}>
                <SuggestedLink
                  href={link.href}
                  label={link.label}
                  className="inline-flex rounded-full border border-[var(--border)] bg-white px-2.5 py-1 font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold)]"
                />
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  return (
    <>
      <p className={`font-semibold text-[var(--gold-link)] ${compact ? 'text-[10px]' : 'text-xs'}`}>
        {primary.entry.category}
      </p>
      <p className={`mt-1 leading-relaxed text-[var(--muted)] ${compact ? 'text-sm' : ''}`}>
        {primary.entry.answer}
      </p>
      {primary.entry.href && (
        <Link
          href={primary.entry.href}
          className={`mt-2 inline-block font-semibold text-[var(--gold-link)] no-underline hover:underline ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          Read more: {primary.entry.question} →
        </Link>
      )}
      {related.length > 0 && (
        <div className="mt-3 border-t border-[var(--border)] pt-2">
          <p className={`font-semibold text-[var(--navy)] ${compact ? 'text-[10px]' : 'text-xs'}`}>
            Related
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {related.map(({ entry }) => (
              <li key={entry.id}>
                {entry.href ? (
                  <SuggestedLink
                    href={entry.href}
                    label={entry.question}
                    className="inline-flex rounded-full border border-[var(--border)] bg-white px-2.5 py-0.5 text-xs font-medium text-[var(--navy)] no-underline hover:border-[var(--gold)]"
                  />
                ) : (
                  <span className="text-xs text-[var(--muted)]">{entry.question}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.suggestedLinks.length > 0 && (
        <div className="mt-3 border-t border-[var(--border)] pt-2">
          <p className={`font-semibold text-[var(--navy)] ${compact ? 'text-[10px]' : 'text-xs'}`}>
            Quick links
          </p>
          <ul className={`mt-1.5 flex flex-wrap gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
            {result.suggestedLinks.map((link) => (
              <li key={link.href}>
                <SuggestedLink
                  href={link.href}
                  label={link.label}
                  className="inline-flex rounded-full border border-[var(--border)] bg-white px-2.5 py-1 font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold)]"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function LlmAssistantContent({
  result,
  compact,
}: {
  result: AssistantQueryResult;
  compact?: boolean;
}) {
  if (!result.llmAnswer) return null;

  return (
    <>
      <p className={`font-semibold uppercase tracking-wide text-[var(--gold)] ${compact ? 'text-[10px]' : 'text-xs'}`}>
        AI answer
      </p>
      <div className={`mt-1.5 space-y-2 leading-relaxed text-[var(--muted)] ${compact ? 'text-sm' : ''}`}>
        {result.llmAnswer.split(/\n\n+/).map((paragraph) => (
          <p key={paragraph.slice(0, 48)}>{paragraph}</p>
        ))}
      </div>
      {result.sources && result.sources.length > 0 && (
        <div className="mt-3 border-t border-[var(--border)] pt-2">
          <p className={`font-semibold text-[var(--navy)] ${compact ? 'text-[10px]' : 'text-xs'}`}>
            Based on our published guides
          </p>
          <ul className="mt-1.5 space-y-1">
            {result.sources.map(({ entry }) => (
              <li key={entry.id}>
                {entry.href ? (
                  <Link
                    href={entry.href}
                    className="text-xs font-semibold text-[var(--gold-link)] no-underline hover:underline"
                  >
                    {entry.question} →
                  </Link>
                ) : (
                  <span className="text-xs text-[var(--muted)]">{entry.question}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function AssistantTurnBubble({
  result,
  compact,
}: {
  result: AssistantQueryResult;
  compact?: boolean;
}) {
  if (result.refused && result.refusalMessage) {
    return (
      <AssistantBubbleShell tone="refusal" compact={compact}>
        <p>{result.refusalMessage}</p>
        {result.suggestedLinks.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {result.suggestedLinks.map((link) => (
              <li key={link.href}>
                <SuggestedLink
                  href={link.href}
                  label={link.label}
                  className="font-semibold text-[var(--navy)] underline-offset-2 hover:underline"
                />
              </li>
            ))}
          </ul>
        )}
      </AssistantBubbleShell>
    );
  }

  if (result.llmAnswer) {
    return (
      <AssistantBubbleShell compact={compact}>
        <LlmAssistantContent result={result} compact={compact} />
      </AssistantBubbleShell>
    );
  }

  return (
    <AssistantBubbleShell compact={compact}>
      <FaqAssistantContent result={result} compact={compact} />
    </AssistantBubbleShell>
  );
}

function TypingIndicator({ compact }: { compact?: boolean }) {
  return (
    <AssistantBubbleShell compact={compact}>
      <span className="inline-flex items-center gap-1 text-[var(--muted)]" aria-label="Assistant is typing">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:300ms]" />
      </span>
    </AssistantBubbleShell>
  );
}

export function AssistantMessageList({ turns, loading, compact }: Props) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className={`flex flex-col ${compact ? 'gap-2.5' : 'gap-3'}`}
    >
      {turns.map((turn) =>
        turn.role === 'user' ? (
          <UserBubble key={turn.id} text={turn.text} compact={compact} />
        ) : (
          <AssistantTurnBubble key={turn.id} result={turn.result} compact={compact} />
        ),
      )}
      {loading && <TypingIndicator compact={compact} />}
    </div>
  );
}
