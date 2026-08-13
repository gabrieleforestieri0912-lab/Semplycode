import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { applyReviewResult, getNote } from '@/lib/notesDb';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const body = await req.json();
    if (typeof body.correct !== 'boolean') {
      return NextResponse.json({ error: 'correct è obbligatorio (boolean)' }, { status: 400 });
    }

    const note = await getNote(user.email, id);
    if (!note) return NextResponse.json({ error: 'Nota non trovata' }, { status: 404 });

    const updated = await applyReviewResult(user.email, id, body.correct);
    return NextResponse.json({ note: updated });
  } catch (error) {
    console.error('POST /api/notes/:id/review error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Errore del server' },
      { status: 500 },
    );
  }
}
