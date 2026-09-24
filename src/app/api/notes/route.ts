import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { createNote, listNotes, type CreateNoteInput } from '@/lib/notesDb';
import { findUserByEmail } from '@/lib/supabase/db';
import { getPlanLimits } from '@/lib/planLimits';
import { getServiceClient } from '@/lib/supabase/service';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('category') || undefined;
    const q = searchParams.get('q') || undefined;
    const statusParam = searchParams.get('status');
    const status = statusParam === 'pending' || statusParam === 'ready' ? statusParam : 'all';
    const dueOnly = searchParams.get('due') === 'true';
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
    const offset = Number(searchParams.get('offset')) || 0;

    const notes = await listNotes(user.email, { categoryId, q, status, dueOnly, limit, offset });

    const filtered = categoryId
      ? notes.filter((n) => n.categories.some((c) => c.id === categoryId))
      : notes;

    return NextResponse.json({ notes: filtered });
  } catch (error) {
    console.error('GET /api/notes error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Errore del server' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    if (!body || typeof body.snippet_code !== 'string' || !body.snippet_code.trim()) {
      return NextResponse.json({ error: 'snippet_code è obbligatorio' }, { status: 400 });
    }
    if (typeof body.explanation !== 'string' || !body.explanation.trim()) {
      return NextResponse.json({ error: 'explanation è obbligatoria' }, { status: 400 });
    }
    if (body.snippet_code.length > 60000 || body.explanation.length > 60000) {
      return NextResponse.json({ error: 'Contenuto troppo lungo' }, { status: 400 });
    }

    const dbUser = await findUserByEmail(user.email).catch(() => null);
    const limits = getPlanLimits(dbUser?.plan || 'free');
    if (limits.maxNotes !== null) {
      const supabase = getServiceClient();
      const { count } = await supabase.from('notes').select('*', { count: 'exact', head: true }).eq('user_id', dbUser?.id || user.email);
      if ((count || 0) >= limits.maxNotes) {
        return NextResponse.json({ error: `Hai raggiunto il limite di ${limits.maxNotes} note per il piano ${dbUser?.plan || 'free'}. Passa a un piano superiore.` }, { status: 403 });
      }
    }

    const input: CreateNoteInput = {
      title: typeof body.title === 'string' ? body.title.slice(0, 200) : undefined,
      snippet_code: body.snippet_code.trim(),
      explanation: body.explanation.trim(),
      language: typeof body.language === 'string' ? body.language.slice(0, 30) : 'javascript',
      source_type: body.source_type === 'extension' ? 'extension' : 'webapp',
      source_url: typeof body.source_url === 'string' ? body.source_url.slice(0, 1000) : null,
      source_ref: typeof body.source_ref === 'string' ? body.source_ref.slice(0, 500) : null,
    };

    const note = await createNote(user.email, input);

    // Categorizzazione asincrona (non blocca il salvataggio): il client
    // la lancia dopo il successo; il batch al caricamento del cassetto
    // recupera le note rimaste in 'pending'.
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('POST /api/notes error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Errore del server' },
      { status: 500 },
    );
  }
}
