import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AssistantMatch } from '@/lib/assistant/types';

const createMock = vi.fn();

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = {
      completions: {
        create: createMock,
      },
    };
  },
}));

const sampleContext: AssistantMatch[] = [
  {
    score: 0.5,
    entry: {
      id: 'test-1',
      question: 'How do I register?',
      answer: 'Register free at the registration page.',
      category: 'Directory',
      href: '/register',
    },
  },
];

async function loadLlmModule() {
  vi.resetModules();
  return import('@/lib/assistant/llm');
}

describe('assistant LLM module', () => {
  beforeEach(() => {
    createMock.mockReset();
    vi.unstubAllEnvs();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('isAssistantLlmEnabled is false without OPENAI_API_KEY', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const { isAssistantLlmEnabled } = await loadLlmModule();
    expect(isAssistantLlmEnabled()).toBe(false);
  });

  it('isAssistantLlmEnabled is true with OPENAI_API_KEY', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-key');
    const { isAssistantLlmEnabled } = await loadLlmModule();
    expect(isAssistantLlmEnabled()).toBe(true);
  });

  it('generateAssistantLlmAnswer returns null without a key', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const { generateAssistantLlmAnswer } = await loadLlmModule();
    await expect(generateAssistantLlmAnswer('How do I register?', sampleContext)).resolves.toBeNull();
    expect(createMock).not.toHaveBeenCalled();
  });

  it('generateAssistantLlmAnswer returns trimmed content from OpenAI', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-key');
    createMock.mockResolvedValue({
      choices: [{ message: { content: '  Register free on /register.  ' } }],
    });
    const { generateAssistantLlmAnswer } = await loadLlmModule();
    await expect(generateAssistantLlmAnswer('How do I register?', sampleContext)).resolves.toBe(
      'Register free on /register.'
    );
    expect(createMock).toHaveBeenCalledOnce();
  });

  it('generateAssistantLlmAnswer returns null for empty OpenAI content', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-key');
    createMock.mockResolvedValue({
      choices: [{ message: { content: '   ' } }],
    });
    const { generateAssistantLlmAnswer } = await loadLlmModule();
    await expect(generateAssistantLlmAnswer('How do I register?', sampleContext)).resolves.toBeNull();
  });

  it('generateAssistantLlmAnswer propagates OpenAI errors', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-key');
    createMock.mockRejectedValue(new Error('rate limit exceeded'));
    const { generateAssistantLlmAnswer } = await loadLlmModule();
    await expect(generateAssistantLlmAnswer('How do I register?', sampleContext)).rejects.toThrow(
      /rate limit exceeded/
    );
  });
});
