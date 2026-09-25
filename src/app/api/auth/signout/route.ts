import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getBaseUrl(req: NextRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && !envUrl.includes('localhost')) return envUrl.replace(/\/$/, '');
  return 'https://semplycode.vercel.app';
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', getBaseUrl(req)));
}
