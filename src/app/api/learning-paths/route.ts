import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';
import { createLearningPath, listLearningPaths } from '@/lib/notesDb';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const paths = await listLearningPaths(user.email);
    return NextResponse.json({ paths });
  } catch (error) {
    console.error('GET /api/learning-paths error:', error);
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
    if (!body || typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'title è obbligatorio' }, { status: 400 });
    }
    const noteIds: string[] = Array.isArray(body.noteIds)
      ? body.noteIds.filter((n: unknown) => typeof n === 'string').slice(0, 50)
      : [];

    const path = await createLearningPath(user.email, body.title, noteIds);
    return NextResponse.json({ path }, { status: 201 });
  } catch (error) {
    console.error('POST /api/learning-paths error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Errore del server' },
      { status: 500 },
    );
  }
}
