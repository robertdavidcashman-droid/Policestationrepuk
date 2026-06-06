import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ASSISTANT_CORPUS } from '@/lib/assistant/corpus';
import { checkAssistantGuardrails } from '@/lib/assistant/guardrails';
import {
  matchAssistantCorpus,
  queryAssistant,
  queryAssistantWithLlm,
  retrieveAssistantContext,
} from '@/lib/assistant/match';

vi.mock('@/lib/assistant/llm', () => ({
  isAssistantLlmEnabled: vi.fn(() => true),
  generateAssistantLlmAnswer: vi.fn(async () => 'Mock LLM answer grounded in site guides.'),
}));

import { generateAssistantLlmAnswer, isAssistantLlmEnabled } from '@/lib/assistant/llm';

describe('assistant guardrails', () => {
  it('refuses case-specific questions', () => {
    const result = checkAssistantGuardrails('My client wants to no comment — what should I advise?');
    expect(result.refused).toBe(true);
    if (result.refused) {
      expect(result.suggestedLinks.some((l) => l.href === '/free-legal-advice-police-station')).toBe(true);
    }
  });

  it('allows directory questions', () => {
    expect(checkAssistantGuardrails('How do I register on the directory?').refused).toBe(false);
  });

  it('refuses first-person arrest questions', () => {
    expect(checkAssistantGuardrails('I was arrested — what should I say?').refused).toBe(true);
  });

  it('refuses third-party arrest questions', () => {
    expect(checkAssistantGuardrails('My son was arrested last night').refused).toBe(true);
  });

  it('refuses empty input', () => {
    const result = checkAssistantGuardrails('   ');
    expect(result.refused).toBe(true);
    if (result.refused) {
      expect(result.suggestedLinks.some((l) => l.href === '/FAQ')).toBe(true);
    }
  });
});

describe('assistant matcher', () => {
  it('has a non-empty corpus', () => {
    expect(ASSISTANT_CORPUS.length).toBeGreaterThan(50);
  });

  it('matches registration questions', () => {
    const matches = matchAssistantCorpus('How do I register on the directory for free?');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]?.entry.answer.toLowerCase()).toMatch(/free|register/);
  });

  it('matches DSCC PIN questions', () => {
    const result = queryAssistant('Do I need a DSCC PIN number?');
    expect(result.refused).toBe(false);
    expect(result.matches.some((m) => m.entry.question.toLowerCase().includes('dscc'))).toBe(true);
  });

  it('matches station phone number questions', () => {
    const result = queryAssistant('Where can I find police station telephone numbers?');
    expect(result.refused).toBe(false);
    expect(result.matches.some((m) => m.entry.href === '/StationsDirectory')).toBe(true);
  });

  it('matches PSRAS portfolio case count', () => {
    const result = queryAssistant('PSRAS portfolio how many cases');
    expect(result.refused).toBe(false);
    expect(result.matches.some((m) => m.entry.answer.includes('Nine'))).toBe(true);
  });

  it('matches WhatsApp join intent', () => {
    const result = queryAssistant('join whatsapp group for reps');
    expect(result.refused).toBe(false);
    expect(
      result.matches.some(
        (m) => m.entry.href === '/WhatsApp' || m.entry.answer.toLowerCase().includes('whatsapp')
      )
    ).toBe(true);
  });

  it('returns suggested links on low confidence', () => {
    const result = queryAssistant('xyzzy plugh completely unrelated gibberish query');
    expect(result.refused).toBe(false);
    expect(result.matches).toHaveLength(0);
    expect(result.suggestedLinks.length).toBeGreaterThan(0);
    expect(result.mode).toBe('fallback');
  });

  it('includes disclaimer on every response', () => {
    const result = queryAssistant('How do I register?');
    expect(result.disclaimer.length).toBeGreaterThan(20);
  });

  it('sets primaryMatch on FAQ responses', () => {
    const result = queryAssistant('How do I register on the directory for free?');
    expect(result.primaryMatch).toBeDefined();
    expect(result.primaryMatch?.entry.id).toBe(result.matches[0]?.entry.id);
  });

  it('retrieves RAG context for partial queries', () => {
    const context = retrieveAssistantContext('register directory free listing');
    expect(context.length).toBeGreaterThan(0);
    expect(context[0]?.score).toBeGreaterThan(0);
  });
});

describe('assistant LLM layer', () => {
  beforeEach(() => {
    vi.mocked(isAssistantLlmEnabled).mockReturnValue(true);
    vi.mocked(generateAssistantLlmAnswer).mockResolvedValue('Mock LLM answer grounded in site guides.');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('uses FAQ mode for high-confidence matches without calling the LLM', async () => {
    const result = await queryAssistantWithLlm('How do I register on the directory for free?');
    expect(result.mode).toBe('faq');
    expect(result.matches.length).toBeGreaterThan(0);
    expect(generateAssistantLlmAnswer).not.toHaveBeenCalled();
  });

  it('calls the LLM for low-confidence queries', async () => {
    const result = await queryAssistantWithLlm('tell me about becoming a rep after working in another field');
    expect(generateAssistantLlmAnswer).toHaveBeenCalled();
    expect(result.mode).toBe('llm');
    expect(result.llmAnswer).toContain('Mock LLM answer');
  });

  it('falls back when the LLM is disabled', async () => {
    vi.mocked(isAssistantLlmEnabled).mockReturnValue(false);
    const result = await queryAssistantWithLlm('xyzzy plugh completely unrelated gibberish query');
    expect(result.mode).toBe('fallback');
    expect(result.llmAnswer).toBeUndefined();
    expect(generateAssistantLlmAnswer).not.toHaveBeenCalled();
  });

  it('falls back when the LLM throws', async () => {
    vi.mocked(generateAssistantLlmAnswer).mockRejectedValue(new Error('OpenAI unavailable'));
    const result = await queryAssistantWithLlm('xyzzy plugh completely unrelated gibberish query');
    expect(result.llmAnswer).toBeUndefined();
    expect(result.mode).toBe('fallback');
  });

  it('falls back when the LLM returns empty content', async () => {
    vi.mocked(generateAssistantLlmAnswer).mockResolvedValue(null);
    const result = await queryAssistantWithLlm('xyzzy plugh completely unrelated gibberish query');
    expect(result.llmAnswer).toBeUndefined();
    expect(result.mode).toBe('fallback');
  });

  it('falls back when LLM output fails validation', async () => {
    vi.mocked(generateAssistantLlmAnswer).mockResolvedValue('You should no comment in interview.');
    const result = await queryAssistantWithLlm('tell me about becoming a rep after working in another field');
    expect(result.llmAnswer).toBeUndefined();
    expect(result.refusalMessage).toMatch(/couldn't verify/i);
    expect(result.mode).toBe('fallback');
  });

  it('skips LLM for FAQ-only portfolio topics', async () => {
    const result = await queryAssistantWithLlm('PSRAS portfolio how many cases');
    expect(result.mode).not.toBe('llm');
    expect(generateAssistantLlmAnswer).not.toHaveBeenCalled();
  });
});
