import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { listCategories } from '@/lib/notesDb';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const categories = await listCategories(user.email);
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Errore del server' },
      { status: 500 },
    );
  }
}
