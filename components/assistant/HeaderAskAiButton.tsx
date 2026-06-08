'use client';

import { useAssistantUi } from '@/components/assistant/AssistantUiProvider';

type Props = {
  className?: string;
  onNavigate?: () => void;
};

export function HeaderAskAiButton({ className, onNavigate }: Props) {
  const { openAssistant } = useAssistantUi();

  return (
    <button
      type="button"
      onClick={() => {
        openAssistant();
        onNavigate?.();
      }}
      className={className}
    >
      Ask AI
    </button>
  );
}
