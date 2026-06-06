import { describe, expect, it, vi, afterEach } from 'vitest';
import { logAssistantQuery } from '@/lib/assistant/logging';

describe('assistant logging', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs structured JSON without full message text', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    logAssistantQuery({
      messagePreview: 'How do I register on the directory for free listing today please',
      mode: 'faq',
      refused: false,
      sourceIds: ['site-register'],
    });

    expect(info).toHaveBeenCalledOnce();
    const payload = JSON.parse(String(info.mock.calls[0]?.[1]));
    expect(payload.scope).toBe('assistant');
    expect(payload.mode).toBe('faq');
    expect(payload.messagePreview.length).toBeLessThanOrEqual(120);
    expect(payload.refused).toBe(false);
    expect(payload.sourceIds).toEqual(['site-register']);
  });
});
