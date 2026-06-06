import { describe, expect, it } from 'vitest';
import { queryAssistant } from '@/lib/assistant/match';

/**
 * Regression spot-checks: answers must stay aligned with published guide content.
 * These do not call OpenAI — they validate the FAQ corpus only.
 */
describe('assistant content accuracy (corpus)', () => {
  it('registration answers mention free listing or register', () => {
    const result = queryAssistant('How do I register on the directory for free?');
    expect(result.refused).toBe(false);
    expect(
      result.matches.some(
        (m) =>
          m.entry.href === '/register' ||
          /\bfree\b/i.test(m.entry.answer) ||
          /register/i.test(m.entry.answer)
      )
    ).toBe(true);
  });

  it('station phone answers point to the stations directory', () => {
    const result = queryAssistant('Where can I find police station telephone numbers?');
    expect(result.refused).toBe(false);
    expect(result.matches.some((m) => m.entry.href === '/StationsDirectory')).toBe(true);
  });

  it('PSRAS portfolio answer cites nine cases', () => {
    const result = queryAssistant('PSRAS portfolio how many cases');
    expect(result.refused).toBe(false);
    expect(result.matches.some((m) => m.entry.answer.includes('Nine'))).toBe(true);
  });

  it('WhatsApp intent links to /WhatsApp or mentions WhatsApp', () => {
    const result = queryAssistant('join whatsapp group for reps');
    expect(result.refused).toBe(false);
    expect(
      result.matches.some(
        (m) => m.entry.href === '/WhatsApp' || /whatsapp/i.test(m.entry.answer)
      )
    ).toBe(true);
  });

  it('DSCC PIN questions match DSCC-related corpus entries', () => {
    const result = queryAssistant('Do I need a DSCC PIN number?');
    expect(result.refused).toBe(false);
    expect(result.matches.some((m) => /dscc/i.test(m.entry.question))).toBe(true);
  });

  it('every successful response includes the legal disclaimer', () => {
    const queries = [
      'How do I register?',
      'PSRAS portfolio how many cases',
      'join whatsapp group for reps',
    ];
    for (const message of queries) {
      const result = queryAssistant(message);
      expect(result.disclaimer).toMatch(/not legal advice/i);
    }
  });
});
