import { NextResponse } from 'next/server';
import { getKV } from '@/lib/kv';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function hasKvCreds(): boolean {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim() || '';
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim() || '';
  return Boolean(url && token);
}

export async function GET() {
  const checks = {
    kvConfigured: hasKvCreds(),
    cronSecretConfigured: Boolean(process.env.CRON_SECRET?.trim()),
    resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    bufferConfigured: Boolean(process.env.BUFFER_API_KEY?.trim()),
    serperConfigured: Boolean(process.env.SERPER_API_KEY?.trim()),
  };

  let kvPing = false;
  if (checks.kvConfigured) {
    try {
      const kv = getKV();
      if (kv) {
        await kv.ping();
        kvPing = true;
      }
    } catch {
      kvPing = false;
    }
  }

  const ready =
    checks.kvConfigured &&
    kvPing &&
    checks.cronSecretConfigured &&
    checks.resendConfigured;

  return NextResponse.json(
    {
      ok: ready,
      checks: { ...checks, kvPing },
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
}
