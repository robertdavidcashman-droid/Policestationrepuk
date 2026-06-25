#!/usr/bin/env npx tsx
/**
 * Read-only Buffer API smoke test — verifies key, org, and channel IDs.
 * Usage: npm run buffer:smoke
 */
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import {
  getBufferApiKey,
  getBufferChannels,
  getBufferOrganizationId,
} from '../lib/buffer/config';

function loadEnvFile(filename: string) {
  const p = resolve(process.cwd(), filename);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env.vercel.production');

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
