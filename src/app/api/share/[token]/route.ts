import { NextRequest, NextResponse } from 'next/server';
import { findShareLinkByToken } from '@/lib/supabase/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const doc = await findShareLinkByToken(token);
    if (!doc) {
      return NextResponse.json({ error: 'Not found or expired' }, { status: 404 });
    }

    return NextResponse.json({ payload: doc.payload, createdAt: doc.created_at });
  } catch (e) {
    console.error('Share get error', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
