import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { assertAssistantEvalCase, loadAssistantEvalCases } from '@/lib/assistant/eval';
import { queryAssistant, queryAssistantWithLlm } from '@/lib/assistant/match';

vi.mock('@/lib/assistant/llm', () => ({
  isAssistantLlmEnabled: vi.fn(() => false),
  generateAssistantLlmAnswer: vi.fn(async () => null),
}));

import { isAssistantLlmEnabled } from '@/lib/assistant/llm';

describe('assistant golden eval set', () => {
  const cases = loadAssistantEvalCases();

  it('loads eval cases from data/assistant-eval.json', () => {
    expect(cases.length).toBeGreaterThanOrEqual(25);
  });

  it.each(cases.map((c) => [c.id, c] as const))('eval case %s passes FAQ/guardrail checks', (_id, evalCase) => {
    const result = queryAssistant(evalCase.question);
    const errors = assertAssistantEvalCase(evalCase, result);
    expect(errors, errors.join('; ')).toEqual([]);
  });
});

describe('assistant golden eval — FAQ-only never uses LLM', () => {
  beforeEach(() => {
    vi.mocked(isAssistantLlmEnabled).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    'PSRAS portfolio how many cases',
    'Do I need a DSCC PIN number?',
    'How do I prepare for the PSRAS written exam?',
  ])('FAQ-only topic skips LLM: %s', async (question) => {
    const { generateAssistantLlmAnswer } = await import('@/lib/assistant/llm');
    const result = await queryAssistantWithLlm(question);
    expect(result.mode).not.toBe('llm');
    expect(generateAssistantLlmAnswer).not.toHaveBeenCalled();
  });
});
