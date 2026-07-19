import {
  getBufferApiKey,
  getBufferChannels,
  getBufferOrganizationId,
} from '@/lib/buffer/config';
import type { ErrorCategory, HealthIssue } from './types';
import { buildIncidentFingerprint } from './notifications';

const BUFFER_API_URL = 'https://api.buffer.com';

export interface BufferCredentialProbe {
  ok: boolean;
  apiKeyPresent: boolean;
  apiKeyMalformed: boolean;
  authenticated: boolean;
  organizationAccessible: boolean;
  channelsConfigured: number;
  channelsAccessible: number;
  missingChannelIds: string[];
  disconnectedChannelIds: string[];
  issues: HealthIssue[];
  accountEmail?: string;
  limitation?: string;
}

function issue(partial: Omit<HealthIssue, 'fingerprint' | 'id'> & { id?: string }): HealthIssue {
  const fingerprint = buildIncidentFingerprint({
    jobName: partial.jobName,
    category: partial.category,
    accountOrDestination: 'buffer',
  });
  return {
    id: partial.id ?? fingerprint,
    fingerprint,
    ...partial,
  };
}

/** Read-only Buffer credential + channel accessibility probe (no test posts). */
export async function probeBufferCredentials(): Promise<BufferCredentialProbe> {
  const apiKey = getBufferApiKey();
  const organizationId = getBufferOrganizationId();
  let channels: ReturnType<typeof getBufferChannels> = [];
  try {
    channels = getBufferChannels();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      apiKeyPresent: Boolean(apiKey),
      apiKeyMalformed: false,
      authenticated: false,
      organizationAccessible: false,
      channelsConfigured: 0,
      channelsAccessible: 0,
      missingChannelIds: [],
      disconnectedChannelIds: [],
      issues: [
        issue({
          jobName: 'buffer-blog-posts',
          category: 'config',
          severity: 'critical',
          summary: 'Buffer channel configuration invalid',
          details: message,
          recoverable: false,
          requiresHumanAction: true,
        }),
      ],
    };
  }

  const issues: HealthIssue[] = [];

  if (!apiKey) {
    issues.push(
      issue({
        jobName: 'buffer-blog-posts',
        category: 'config',
        severity: 'critical',
        summary: 'BUFFER_API_KEY missing',
        recoverable: false,
        requiresHumanAction: true,
      }),
    );
    return {
      ok: false,
      apiKeyPresent: false,
      apiKeyMalformed: false,
      authenticated: false,
      organizationAccessible: false,
      channelsConfigured: channels.length,
      channelsAccessible: 0,
      missingChannelIds: channels.map((c) => c.id),
      disconnectedChannelIds: [],
      issues,
    };
  }

  const malformed = apiKey.length < 20 || /\s/.test(apiKey);
  if (malformed) {
    issues.push(
      issue({
        jobName: 'buffer-blog-posts',
        category: 'config',
        severity: 'critical',
        summary: 'BUFFER_API_KEY appears malformed',
        recoverable: false,
        requiresHumanAction: true,
      }),
    );
  }

  try {
    const res = await fetch(BUFFER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: `query AutomationProbe($organizationId: OrganizationId!) {
          account {
            email
            timezone
            organizations { id name }
          }
          channels(input: { organizationId: $organizationId }) {
            id
            name
            service
            isDisconnected
          }
        }`,
        variables: { organizationId },
      }),
    });

    const json = (await res.json()) as {
      data?: {
        account?: {
          email: string;
          organizations?: Array<{ id: string; name: string }>;
        };
        channels?: Array<{
          id: string;
          name: string;
          service: string;
          isDisconnected: boolean;
        }>;
      };
      errors?: Array<{ message: string }>;
    };

    if (json.errors?.length) {
      const message = json.errors.map((e) => e.message).join('; ');
      const category: ErrorCategory = /unauthor/i.test(message)
        ? 'auth'
        : /missing|not configured|invalid/i.test(message)
          ? 'config'
          : 'unknown';
      issues.push(
        issue({
          jobName: 'buffer-blog-posts',
          category,
          severity: 'critical',
          summary: 'Buffer authentication or API probe failed',
          details: message,
          recoverable: category === 'unknown',
          requiresHumanAction: category === 'auth' || category === 'config',
        }),
      );
      return {
        ok: false,
        apiKeyPresent: true,
        apiKeyMalformed: malformed,
        authenticated: false,
        organizationAccessible: false,
        channelsConfigured: channels.length,
        channelsAccessible: 0,
        missingChannelIds: channels.map((c) => c.id),
        disconnectedChannelIds: [],
        issues,
      };
    }

    const orgs = json.data?.account?.organizations ?? [];
    const organizationAccessible = orgs.some((o) => o.id === organizationId);
    if (!organizationAccessible) {
      issues.push(
        issue({
          jobName: 'buffer-blog-posts',
          category: 'config',
          severity: 'critical',
          summary: 'Configured Buffer organization is not accessible',
          details: `organizationId=${organizationId}`,
          recoverable: false,
          requiresHumanAction: true,
        }),
      );
    }

    const live = json.data?.channels ?? [];
    const missingChannelIds = channels
      .filter((c) => !live.some((l) => l.id === c.id))
      .map((c) => c.id);
    const disconnectedChannelIds = channels
      .map((c) => live.find((l) => l.id === c.id))
      .filter((l): l is NonNullable<typeof l> => Boolean(l?.isDisconnected))
      .map((l) => l.id);

    if (missingChannelIds.length) {
      issues.push(
        issue({
          jobName: 'buffer-blog-posts',
          category: 'config',
          severity: 'critical',
          summary: 'Configured Buffer channels not found in organization',
          details: missingChannelIds.join(', '),
          recoverable: false,
          requiresHumanAction: true,
        }),
      );
    }
    if (disconnectedChannelIds.length) {
      issues.push(
        issue({
          jobName: 'buffer-blog-posts',
          category: 'auth',
          severity: 'critical',
          summary: 'One or more Buffer channels are disconnected',
          details: disconnectedChannelIds.join(', '),
          recoverable: false,
          requiresHumanAction: true,
        }),
      );
    }

    return {
      ok: issues.length === 0,
      apiKeyPresent: true,
      apiKeyMalformed: malformed,
      authenticated: true,
      organizationAccessible,
      channelsConfigured: channels.length,
      channelsAccessible: channels.length - missingChannelIds.length - disconnectedChannelIds.length,
      missingChannelIds,
      disconnectedChannelIds,
      issues,
      accountEmail: json.data?.account?.email,
      limitation:
        'Buffer GraphQL smoke probe validates account/org/channels only; individual update status uses list/status queries elsewhere.',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    issues.push(
      issue({
        jobName: 'buffer-blog-posts',
        category: 'network',
        severity: 'error',
        summary: 'Buffer API network failure during credential probe',
        details: message,
        recoverable: true,
        requiresHumanAction: false,
      }),
    );
    return {
      ok: false,
      apiKeyPresent: true,
      apiKeyMalformed: malformed,
      authenticated: false,
      organizationAccessible: false,
      channelsConfigured: channels.length,
      channelsAccessible: 0,
      missingChannelIds: [],
      disconnectedChannelIds: [],
      issues,
    };
  }
}
