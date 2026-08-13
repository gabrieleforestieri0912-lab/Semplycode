import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { signLinkCode } from '@/lib/linkCode';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const code = signLinkCode(user.email);
    return NextResponse.json({ code, expiresInSeconds: 120 });
  } catch (error) {
    console.error('POST /api/auth/link-code/create error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
