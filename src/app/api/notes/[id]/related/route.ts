import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { getNote, listNotes } from '@/lib/notesDb';
import { findRelatedNotesWithAI } from '@/lib/notesAI';
import type { NoteSummary } from '@/lib/supabase/types';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const note = await getNote(user.email, id);
    if (!note) return NextResponse.json({ error: 'Nota non trovata' }, { status: 404 });

    // Correlate per categoria condivisa (senza chiamata AI)
    return NextResponse.json({ related: note.related || [] });
  } catch (error) {
    console.error('GET /api/notes/:id/related error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Errore del server' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const note = await getNote(user.email, id);
    if (!note) return NextResponse.json({ error: 'Nota non trovata' }, { status: 404 });

    const all = await listNotes(user.email, { limit: 50 });
    const candidates = all.filter((n) => n.id !== id);
    const relatedIds = await findRelatedNotesWithAI(user.email, note, candidates);

    const related: NoteSummary[] = candidates
      .filter((c) => relatedIds.includes(c.id))
      .map((c) => ({
        id: c.id,
        title: c.title,
        language: c.language,
        source_type: c.source_type,
        status: c.status,
        leitner_box: c.leitner_box,
        next_review_at: c.next_review_at,
        created_at: c.created_at,
        snippet_excerpt: c.snippet_code.replace(/\s+/g, ' ').slice(0, 200),
        categories: c.categories,
      }));

    return NextResponse.json({ related });
  } catch (error) {
    console.error('POST /api/notes/:id/related error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Errore del server' },
      { status: 500 },
    );
  }
}
