import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { getDueReviews } from '@/lib/notesDb';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const limit = Math.min(Number(new URL(req.url).searchParams.get('limit')) || 20, 50);
    const notes = await getDueReviews(user.email, limit);

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('GET /api/notes/due-reviews error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Errore del server' },
      { status: 500 },
    );
  }
}
