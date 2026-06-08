import { describe, expect, it } from 'vitest';
import { CONTACT_WHATSAPP_HREF } from '@/lib/contact-constants';
import {
  enrichCoverRouting,
  isCoverRequestIntent,
  isJoinGroupIntent,
  isNoteSoftwareIntent,
  isPsaCoverPageContext,
} from '@/lib/assistant/cover-routing';
import { queryAssistant } from '@/lib/assistant/match';
import { ASSISTANT_DISCLAIMER } from '@/lib/assistant/guardrails';

describe('assistant cover routing', () => {
  it('detects join group vs cover intent separately', () => {
    expect(isJoinGroupIntent('join whatsapp group for reps')).toBe(true);
    expect(isCoverRequestIntent('join whatsapp group for reps')).toBe(false);
    expect(isCoverRequestIntent('I need cover at Maidstone police station')).toBe(true);
  });

  it('Kent cover request suggests WhatsApp', () => {
    const result = queryAssistant('I need cover at Maidstone police station');
    expect(result.refused).toBe(false);
    expect(result.primaryMatch?.entry.id).toBe('site-kent-cover');
    expect(result.suggestedLinks.some((l) => l.href === CONTACT_WHATSAPP_HREF)).toBe(true);
  });

  it('Manchester cover request points to directory only', () => {
    const result = queryAssistant('I need a rep for Manchester police station');
    expect(result.refused).toBe(false);
    expect(result.primaryMatch?.entry.id).toBe('site-find-rep');
    expect(result.suggestedLinks.some((l) => l.href.includes('wa.me'))).toBe(false);
    expect(result.suggestedLinks.some((l) => l.href === '/directory')).toBe(true);
  });

  it('enrichCoverRouting leaves join-group responses unchanged', () => {
    const base = queryAssistant('join whatsapp group for reps');
    const enriched = enrichCoverRouting('join whatsapp group for reps', base);
    expect(enriched.primaryMatch?.entry.href).toBe('/WhatsApp');
  });
});

describe('custody note intent', () => {
  it('matches Custody Note not station numbers', () => {
    const result = queryAssistant('tell me about custody note');
    expect(result.refused).toBe(false);
    expect(result.primaryMatch?.entry.id).toBe('site-custody-note');
    expect(result.primaryMatch?.entry.href).toBe('/CustodyNote');
  });

  it('detects note software intent', () => {
    expect(isNoteSoftwareIntent('custody note software')).toBe(true);
    expect(isNoteSoftwareIntent('find station phone numbers')).toBe(false);
  });
});

describe('PSA page context for Contact tab', () => {
  it('includes Kent and homepage paths', () => {
    expect(isPsaCoverPageContext('/')).toBe(true);
    expect(isPsaCoverPageContext('/police-station-rep-kent')).toBe(true);
    expect(isPsaCoverPageContext('/FAQ')).toBe(false);
  });
});

describe('cover routing preserves disclaimer', () => {
  it('includes disclaimer on routed cover answers', () => {
    const result = queryAssistant('Need cover at Medway custody suite');
    expect(result.disclaimer).toBe(ASSISTANT_DISCLAIMER);
  });
});
