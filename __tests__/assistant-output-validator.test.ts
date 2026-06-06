import { describe, expect, it } from 'vitest';
import { validateAssistantLlmOutput } from '@/lib/assistant/output-validator';
import type { AssistantMatch } from '@/lib/assistant/types';

const portfolioContext: AssistantMatch[] = [
  {
    score: 0.6,
    entry: {
      id: 'portfolio-1',
      question: 'How many cases for PSRAS portfolio?',
      answer: 'You need Nine cases in your portfolio.',
      category: 'PSRAS Portfolio',
      href: '/BuildPortfolioGuide',
    },
  },
];

describe('assistant LLM output validator', () => {
  it('accepts grounded safe answers', () => {
    const result = validateAssistantLlmOutput(
      'See our portfolio guide. You need Nine cases as explained on /BuildPortfolioGuide.',
      portfolioContext
    );
    expect(result.valid).toBe(true);
  });

  it('rejects empty answers', () => {
    const result = validateAssistantLlmOutput('   ', portfolioContext);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('EMPTY');
  });

  it('rejects interview advice', () => {
    const result = validateAssistantLlmOutput('You should no comment in interview.', portfolioContext);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('INTERVIEW_ADVICE');
  });

  it('rejects guilt predictions', () => {
    const result = validateAssistantLlmOutput('You will go to prison if convicted.', portfolioContext);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('GUILT_PREDICTION');
  });

  it('rejects ungrounded phone numbers', () => {
    const result = validateAssistantLlmOutput('Call 0161 123 4567 for help.', portfolioContext);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('UNGROUNDED_PHONE');
  });

  it('rejects ungrounded fees', () => {
    const result = validateAssistantLlmOutput('The exam costs £500.', portfolioContext);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('UNGROUNDED_FEE');
  });

  it('rejects ungrounded case counts', () => {
    const result = validateAssistantLlmOutput('You need twelve cases in your portfolio.', portfolioContext);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('UNGROUNDED_CASE_COUNT');
  });

  it('allows phone numbers present in context', () => {
    const context: AssistantMatch[] = [
      {
        score: 0.5,
        entry: {
          id: 'phone-1',
          question: 'Station phone',
          answer: 'Main line: 0161 872 5050',
          category: 'Directory',
        },
      },
    ];
    const result = validateAssistantLlmOutput('The main line is 0161 872 5050.', context);
    expect(result.valid).toBe(true);
  });
});
