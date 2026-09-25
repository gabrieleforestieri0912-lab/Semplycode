import { NextRequest, NextResponse } from 'next/server';
import { createShareLink } from '@/lib/supabase/db';

export async function POST(req: NextRequest) {
  try {
    const body: { payload?: unknown; days?: number; userId?: string } = await req.json();
    const { payload, days = 7, userId } = body;
    if (!payload) {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }

    const doc = await createShareLink({ payload, userId, days });
    const forwardedHost = req.headers.get('x-forwarded-host');
    const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
    const base = forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
          ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
          : 'https://semplycode.vercel.app');
    const url = `${base}/share/${doc.token}`;
    return NextResponse.json({ url, token: doc.token });
  } catch (e) {
    console.error('Share create error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
