'use client';

import { useAssistantUiOptional } from '@/components/assistant/AssistantUiProvider';

type Props = {
  className?: string;
  children: React.ReactNode;
};

export function OpenAiAssistantButton({ className, children }: Props) {
  const ui = useAssistantUiOptional();

  return (
    <button
      type="button"
      onClick={() => ui?.openAssistant()}
      className={className}
      disabled={!ui}
    >
      {children}
    </button>
  );
}
