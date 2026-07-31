/**
 * Email provider abstraction — keeps Resend details out of queue/business logic.
 * Secrets must never be exposed to the browser.
 */

export interface EmailMessage {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
  attachments?: Array<{ filename: string; content: Buffer | string }>;
  /** Provider-level idempotency when supported. */
  idempotencyKey?: string;
}

export interface EmailSendResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
  statusCode?: number;
  retryable?: boolean;
}

export interface EmailProviderConfigStatus {
  configured: boolean;
  provider: string;
  errors: string[];
}

export interface ParsedWebhookEvent {
  type: string;
  providerMessageId?: string;
  email?: string;
  at?: string;
  rawType?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<EmailSendResult>;
  validateConfiguration(): Promise<EmailProviderConfigStatus>;
  parseWebhook?(
    body: unknown,
    headers: Headers,
  ): Promise<{ ok: boolean; events: ParsedWebhookEvent[]; error?: string }>;
  getMessageStatus?(providerMessageId: string): Promise<{ status?: string; error?: string }>;
}

import { Resend } from 'resend';
import { isRetryableProviderError } from '@robertcashman/firm-outreach-core';

let cached: Resend | null = null;

function getResendClient(): Resend | null {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  cached = new Resend(key);
  return cached;
}

export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';

  async validateConfiguration(): Promise<EmailProviderConfigStatus> {
    const errors: string[] = [];
    if (!process.env.RESEND_API_KEY?.trim()) {
      errors.push('RESEND_API_KEY missing');
    }
    return { configured: errors.length === 0, provider: this.name, errors };
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const client = getResendClient();
    if (!client) {
      return { ok: false, error: 'no_resend', retryable: false, statusCode: 401 };
    }

    try {
      const result = await client.emails.send({
        from: message.from,
        to: message.to,
        replyTo: message.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
        attachments: message.attachments,
        headers: message.headers,
      });

      if (result.error) {
        const msg =
          typeof result.error === 'object' && result.error && 'message' in result.error
            ? String((result.error as { message: string }).message)
            : String(result.error);
        const statusCode =
          typeof result.error === 'object' &&
          result.error &&
          'statusCode' in result.error &&
          typeof (result.error as { statusCode?: unknown }).statusCode === 'number'
            ? (result.error as { statusCode: number }).statusCode
            : undefined;
        return {
          ok: false,
          error: msg,
          statusCode,
          retryable: isRetryableProviderError(msg, statusCode),
        };
      }

      const providerMessageId = result.data?.id ? String(result.data.id) : undefined;
      if (!providerMessageId) {
        return { ok: false, error: 'no_message_id_from_resend', retryable: false };
      }
      return { ok: true, providerMessageId };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        error: msg,
        retryable: isRetryableProviderError(msg),
      };
    }
  }
}

let defaultProvider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!defaultProvider) defaultProvider = new ResendEmailProvider();
  return defaultProvider;
}

/** Test helper — inject a mock provider. */
export function setEmailProviderForTests(provider: EmailProvider | null): void {
  defaultProvider = provider;
}
