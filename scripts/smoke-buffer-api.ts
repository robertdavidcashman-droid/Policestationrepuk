#!/usr/bin/env npx tsx
/**
 * Read-only Buffer API smoke test — verifies key, org, and channel IDs.
 * Usage: npm run buffer:smoke
 */
import {
  getBufferApiKey,
  getBufferChannels,
  getBufferOrganizationId,
} from '../lib/buffer/config';

const BUFFER_API_URL = 'https://api.buffer.com';

async function main() {
  const apiKey = getBufferApiKey();
  if (!apiKey) {
    console.error('BUFFER_API_KEY is not set');
    process.exit(1);
  }

  const organizationId = getBufferOrganizationId();

  const res = await fetch(BUFFER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: `query SmokeAccount($organizationId: OrganizationId!) {
        account {
          email
          timezone
          organizations {
            id
            name
          }
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
      account?: { email: string; timezone: string | null };
      channels?: Array<{ id: string; name: string; service: string; isDisconnected: boolean }>;
    };
    errors?: Array<{ message: string }>;
  };

  if (json.errors?.length) {
    console.error('Buffer API errors:', json.errors);
    process.exit(1);
  }

  const configured = getBufferChannels();
  const live = json.data?.channels ?? [];
  const missing = configured.filter((c) => !live.some((l) => l.id === c.id));
  const disconnected = configured
    .map((c) => live.find((l) => l.id === c.id))
    .filter((l) => l?.isDisconnected);

  console.log(
    JSON.stringify(
      {
        ok: missing.length === 0 && disconnected.length === 0,
        account: json.data?.account?.email,
        timezone: json.data?.account?.timezone,
        organizationId,
        configuredChannels: configured,
        liveChannels: live.map((c) => ({ id: c.id, service: c.service, name: c.name })),
        missingChannelIds: missing.map((c) => c.id),
        disconnectedChannels: disconnected.map((c) => c?.name),
      },
      null,
      2,
    ),
  );

  if (missing.length || disconnected.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
