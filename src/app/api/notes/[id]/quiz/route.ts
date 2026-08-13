import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { getNote } from '@/lib/notesDb';
import { generateQuizForNote } from '@/lib/notesAI';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const note = await getNote(user.email, id);
    if (!note) return NextResponse.json({ error: 'Nota non trovata' }, { status: 404 });

    const quiz = await generateQuizForNote(user.email, note);
    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('POST /api/notes/:id/quiz error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Errore del server' },
      { status: 500 },
    );
  }
}
