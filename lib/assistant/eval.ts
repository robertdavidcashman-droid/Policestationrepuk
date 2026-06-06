import type { AssistantQueryResult, AssistantResponseMode } from '@/lib/assistant/types';
import evalCases from '@/data/assistant-eval.json';

export type AssistantEvalCase = {
  id: string;
  question: string;
  mustRefuse: boolean;
  allowedModes?: AssistantResponseMode[];
  mustContainAny?: string[];
  mustNotContainAny?: string[];
  faqOnly?: boolean;
};

export function collectResponseText(result: AssistantQueryResult): string {
  const parts: string[] = [];
  if (result.refusalMessage) parts.push(result.refusalMessage);
  if (result.llmAnswer) parts.push(result.llmAnswer);
  for (const match of result.matches) {
    parts.push(match.entry.question, match.entry.answer);
  }
  return parts.join(' ');
}

export function assertAssistantEvalCase(
  evalCase: AssistantEvalCase,
  result: AssistantQueryResult
): string[] {
  const errors: string[] = [];
  const text = collectResponseText(result);

  if (result.refused !== evalCase.mustRefuse) {
    errors.push(`expected refused=${evalCase.mustRefuse}, got ${result.refused}`);
  }

  if (evalCase.allowedModes && result.mode && !evalCase.allowedModes.includes(result.mode)) {
    errors.push(`mode ${result.mode} not in [${evalCase.allowedModes.join(', ')}]`);
  }

  if (evalCase.faqOnly && result.mode === 'llm') {
    errors.push('FAQ-only topic must not use LLM mode');
  }

  if (evalCase.mustContainAny) {
    const hit = evalCase.mustContainAny.some((needle) => text.toLowerCase().includes(needle.toLowerCase()));
    if (!hit) {
      errors.push(`response missing any of: ${evalCase.mustContainAny.join(', ')}`);
    }
  }

  if (evalCase.mustNotContainAny) {
    for (const forbidden of evalCase.mustNotContainAny) {
      if (text.toLowerCase().includes(forbidden.toLowerCase())) {
        errors.push(`response must not contain: ${forbidden}`);
      }
    }
  }

  if (!result.refused && !result.disclaimer.match(/not legal advice/i)) {
    errors.push('missing legal disclaimer');
  }

  return errors;
}

export function loadAssistantEvalCases(): AssistantEvalCase[] {
  return evalCases as AssistantEvalCase[];
}
