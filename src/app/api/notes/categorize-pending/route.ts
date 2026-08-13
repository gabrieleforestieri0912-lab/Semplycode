import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { getPendingNotes } from '@/lib/notesDb';
import { categorizeNoteWithAI } from '@/lib/notesAI';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const pending = await getPendingNotes(user.email);
    if (!pending.length) {
      return NextResponse.json({ processed: 0, categories: [] });
    }

    const results: { note_id: string; category_ids: string[] }[] = [];
    // Max 5 per batch per non bruciare troppi token in una volta.
    for (const note of pending.slice(0, 5)) {
      const categories = await categorizeNoteWithAI(user.email, note);
      results.push({ note_id: note.id, category_ids: categories.map((c) => c.id) });
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error) {
    console.error('POST /api/notes/categorize-pending error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Errore del server' },
      { status: 500 },
    );
  }
}
