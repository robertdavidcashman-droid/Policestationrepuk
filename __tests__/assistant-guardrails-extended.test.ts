import { describe, expect, it } from 'vitest';
import {
  ASSISTANT_CASE_REFUSAL_FIXTURES,
  ASSISTANT_INJECTION_FIXTURES,
  checkAssistantGuardrails,
} from '@/lib/assistant/guardrails';
import { isFaqOnlyTopic } from '@/lib/assistant/faq-only-topics';

describe('assistant guardrails — refusal battery', () => {
  it.each(ASSISTANT_CASE_REFUSAL_FIXTURES)('refuses case-specific: %s', (question) => {
    const result = checkAssistantGuardrails(question);
    expect(result.refused).toBe(true);
    if (result.refused) {
      expect(result.code).toBe('CASE_SPECIFIC');
      expect(result.message).toMatch(/cannot give advice|solicitor/i);
    }
  });
});

describe('assistant guardrails — prompt injection battery', () => {
  it.each(ASSISTANT_INJECTION_FIXTURES)('blocks injection: %s', (question) => {
    const result = checkAssistantGuardrails(question);
    expect(result.refused).toBe(true);
    if (result.refused) {
      expect(result.code).toBe('PROMPT_INJECTION');
    }
  });
});

describe('assistant FAQ-only topics', () => {
  it('flags PSRAS portfolio topics', () => {
    expect(isFaqOnlyTopic('PSRAS portfolio how many cases')).toBe(true);
  });

  it('flags DSCC PIN topics', () => {
    expect(isFaqOnlyTopic('Do I need a DSCC PIN number?')).toBe(true);
  });

  it('does not flag general career questions', () => {
    expect(isFaqOnlyTopic('How do I find a rep on the directory?')).toBe(false);
  });
});
