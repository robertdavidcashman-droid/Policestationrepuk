import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'policestationrepuk',
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    timestamp: new Date().toISOString(),
  });
}
