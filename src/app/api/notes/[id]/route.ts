import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { getNote, updateNote, deleteNote } from '@/lib/notesDb';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const note = await getNote(user.email, id);
    if (!note) return NextResponse.json({ error: 'Nota non trovata' }, { status: 404 });

    return NextResponse.json({ note });
  } catch (error) {
    console.error('GET /api/notes/:id error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Errore del server' },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const body = await req.json();

    const updates: Record<string, string> = {};
    if (typeof body.title === 'string') updates.title = body.title.slice(0, 200);
    if (typeof body.language === 'string') updates.language = body.language.slice(0, 30);
    if (typeof body.snippet_code === 'string' && body.snippet_code.trim()) {
      updates.snippet_code = body.snippet_code.trim();
    }
    if (typeof body.explanation === 'string' && body.explanation.trim()) {
      updates.explanation = body.explanation.trim();
    }

    const note = await updateNote(user.email, id, updates);
    return NextResponse.json({ note });
  } catch (error) {
    console.error('PATCH /api/notes/:id error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Errore del server' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    await deleteNote(user.email, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/notes/:id error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Errore del server' },
      { status: 500 },
    );
  }
}
