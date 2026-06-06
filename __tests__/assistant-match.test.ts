import { describe, expect, it } from 'vitest';
import { ASSISTANT_CORPUS } from '@/lib/assistant/corpus';
import { checkAssistantGuardrails } from '@/lib/assistant/guardrails';
import { matchAssistantCorpus, queryAssistant } from '@/lib/assistant/match';

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
  });

  it('includes disclaimer on every response', () => {
    const result = queryAssistant('How do I register?');
    expect(result.disclaimer.length).toBeGreaterThan(20);
  });
});
