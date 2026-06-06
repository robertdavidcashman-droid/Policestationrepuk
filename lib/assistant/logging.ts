import type { AssistantResponseMode } from '@/lib/assistant/types';

export type AssistantLogEntry = {
  messagePreview: string;
  mode?: AssistantResponseMode;
  refused: boolean;
  sourceIds?: string[];
  validationFailed?: boolean;
  validationCode?: string;
  faqOnlyTopic?: string;
};

const MAX_PREVIEW = 120;

/** Structured log for production sampling — no full user text or API keys. */
export function logAssistantQuery(entry: AssistantLogEntry): void {
  const payload = {
    scope: 'assistant',
    ts: new Date().toISOString(),
    messagePreview: entry.messagePreview.slice(0, MAX_PREVIEW),
    mode: entry.mode ?? null,
    refused: entry.refused,
    sourceIds: entry.sourceIds ?? [],
    validationFailed: entry.validationFailed ?? false,
    validationCode: entry.validationCode ?? null,
    faqOnlyTopic: entry.faqOnlyTopic ?? null,
  };

  console.info('[assistant]', JSON.stringify(payload));
}
