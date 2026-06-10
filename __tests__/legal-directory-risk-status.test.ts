import { describe, expect, it } from 'vitest';
import { statusFromRisk, scoreLegalDirectorySubmission } from '@/lib/legal-directory/risk';

describe('legal directory statusFromRisk', () => {
  it('approves low-risk submissions', () => {
    const risk = scoreLegalDirectorySubmission({
      businessName: 'Smith & Co Solicitors LLP',
      email: 'info@smithco.example',
      description: 'Crime and prison law firm covering Kent.',
      websiteUrl: 'https://smithco.example',
      regulatoryNumber: '123456',
      regulatoryBody: 'SRA',
      category: 'criminal-solicitors',
    });
    expect(statusFromRisk(risk, false)).toBe('approved');
  });

  it('holds medium-risk submissions for review', () => {
    const risk = scoreLegalDirectorySubmission({
      businessName: 'AB',
      email: 'test@mailinator.com',
      description: 'Services.',
      websiteUrl: 'https://bit.ly/x',
      regulatoryNumber: '',
      regulatoryBody: '',
      category: 'other',
    });
    expect(risk.riskScore).toBeGreaterThanOrEqual(21);
    expect(statusFromRisk(risk, false)).toBe('flagged_for_review');
  });

  it('rejects honeypot', () => {
    const risk = scoreLegalDirectorySubmission({
      businessName: 'Spam',
      email: 'spam@example.com',
      description: 'x',
      websiteUrl: '',
      regulatoryNumber: '',
      regulatoryBody: '',
      category: 'other',
      honeypotFilled: true,
    });
    expect(statusFromRisk(risk, true)).toBe('rejected_spam');
  });
});
