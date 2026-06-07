import { describe, expect, it } from 'vitest';
import { checkAssistantGuardrails } from '@/lib/assistant/guardrails';
import { POLICESTATIONAGENT_HOME_HREF } from '@/lib/policestationagent-promo';

describe('assistant Kent-only policestationagent promo', () => {
  it('suggests policestationagent when the query mentions Kent', () => {
    const result = checkAssistantGuardrails('My son was arrested in Kent — what should he say?');
    expect(result.refused).toBe(true);
    if (!result.refused) return;
    expect(result.suggestedLinks.some((l) => l.href === POLICESTATIONAGENT_HOME_HREF)).toBe(true);
  });

  it('does not suggest policestationagent for arrests outside Kent area', () => {
    const result = checkAssistantGuardrails('My client was arrested in Manchester — what should they say?');
    expect(result.refused).toBe(true);
    if (!result.refused) return;
    expect(result.suggestedLinks.some((l) => l.href === POLICESTATIONAGENT_HOME_HREF)).toBe(false);
  });
});
