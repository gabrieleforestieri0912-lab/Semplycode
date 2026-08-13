import { getServiceClient } from '@/lib/supabase/service';
import type {
  Note,
  Category,
  LearningPath,
  NoteSummary,
  NoteWithRelations,
} from '@/lib/supabase/types';

// ─── NOTE ─────────────────────────────────────────────────

export interface CreateNoteInput {
  title?: string;
  snippet_code: string;
  explanation: string;
  language?: string;
  source_type?: 'webapp' | 'extension';
  source_url?: string | null;
  source_ref?: string | null;
}

export interface ListNotesOptions {
  categoryId?: string;
  q?: string;
  status?: 'pending' | 'ready' | 'all';
  dueOnly?: boolean;
  limit?: number;
  offset?: number;
}

export async function createNote(userId: string, input: CreateNoteInput): Promise<Note> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title: input.title || defaultTitle(input.snippet_code),
      snippet_code: input.snippet_code,
      explanation: input.explanation,
      language: input.language || 'javascript',
      source_type: input.source_type || 'webapp',
      source_url: input.source_url || null,
      source_ref: input.source_ref || null,
    })
    .select()
    .single();
  if (error) throw new Error(`createNote: ${error.message}`);
  return data as Note;
}

function defaultTitle(snippet: string): string {
  const firstLine = snippet
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('#')) || '';
  const cleaned = firstLine.replace(/^[^A-Za-z0-9_$]+/, '').slice(0, 60);
  return cleaned || 'Nota di codice';
}

export async function getNote(userId: string, noteId: string): Promise<NoteWithRelations | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw new Error(`getNote: ${error.message}`);
  if (!data) return null;
  return enrichNote(data as Note, userId);
}

export async function updateNote(
  userId: string,
  noteId: string,
  updates: Partial<Pick<Note, 'title' | 'snippet_code' | 'explanation' | 'language' | 'status' | 'leitner_box' | 'next_review_at'>>,
): Promise<Note> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('notes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(`updateNote: ${error.message}`);
  return data as Note;
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId);
  if (error) throw new Error(`deleteNote: ${error.message}`);
}

export async function listNotes(
  userId: string,
  options: ListNotesOptions = {},
): Promise<NoteWithRelations[]> {
  const supabase = getServiceClient();
  const { categoryId, q, status = 'all', dueOnly, limit = 50, offset = 0 } = options;

  let query = supabase.from('notes').select('*').eq('user_id', userId);

  if (status !== 'all') query = query.eq('status', status);
  if (dueOnly) {
    query = query
      .gt('leitner_box', 0)
      .lte('next_review_at', new Date().toISOString());
  }
  if (q && q.trim()) {
    query = query.or(`title.ilike.%${q.trim()}%,explanation.ilike.%${q.trim()}%,snippet_code.ilike.%${q.trim()}%`);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw new Error(`listNotes: ${error.message}`);

  const notes = (data || []) as Note[];

  // Categorie per tutte le note (una query in blocco)
  const ids = notes.map((n) => n.id);
  const categoriesByNote = await fetchCategoriesForNotes(userId, ids);

  return notes.map((n) => {
    const related = buildRelatedCandidates(n, notes, categoriesByNote);
    return {
      ...n,
      categories: categoriesByNote.get(n.id) || [],
      paths: [],
      related,
      due: Boolean(
        n.leitner_box > 0 && n.next_review_at && new Date(n.next_review_at) <= new Date(),
      ),
    };
  });
}

export async function getDueReviews(userId: string, limit = 20): Promise<NoteWithRelations[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .gt('leitner_box', 0)
    .lte('next_review_at', new Date().toISOString())
    .order('next_review_at', { ascending: true })
    .limit(limit);
  if (error) throw new Error(`getDueReviews: ${error.message}`);

  const notes = (data || []) as Note[];
  const ids = notes.map((n) => n.id);
  const categoriesByNote = await fetchCategoriesForNotes(userId, ids);

  return notes.map((n) => ({
    ...n,
    categories: categoriesByNote.get(n.id) || [],
    paths: [],
    related: [],
    due: true,
  }));
}

export async function getPendingNotes(userId: string): Promise<Note[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw new Error(`getPendingNotes: ${error.message}`);
  return (data || []) as Note[];
}

// ─── CATEGORIE ───────────────────────────────────────────

export async function listCategories(userId: string): Promise<Category[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });
  if (error) throw new Error(`listCategories: ${error.message}`);
  return (data || []) as Category[];
}

/**
 * Ottiene (o crea) le categorie per nome, normalizzate case-insensitive
 * rispetto a quelle già presenti nell'account.
 */
export async function getOrCreateCategories(
  userId: string,
  names: string[],
): Promise<Category[]> {
  if (!names.length) return [];
  const normalized = Array.from(
    new Set(names.map((n) => n.trim().replace(/\s+/g, ' ')).filter(Boolean)),
  );
  if (!normalized.length) return [];

  const supabase = getServiceClient();

  // 1. Legge tutte le categorie dell'utente e fa il match case-insensitive in JS
  const all = await listCategories(userId);
  const found: Category[] = [];
  const foundLower = new Set<string>();
  for (const name of normalized) {
    const match = all.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (match && !foundLower.has(match.id)) {
      found.push(match);
      foundLower.add(match.id);
    }
  }

  // 2. Crea le mancanti
  const matchedNames = new Set(found.map((c) => c.name.toLowerCase()));
  const toCreate = normalized.filter((n) => !matchedNames.has(n.toLowerCase()));
  const created: Category[] = [];
  if (toCreate.length) {
    const { data: inserted, error: insErr } = await supabase
      .from('categories')
      .insert(toCreate.map((name) => ({ user_id: userId, name })))
      .select();
    if (insErr) throw new Error(`getOrCreateCategories(insert): ${insErr.message}`);
    created.push(...((inserted || []) as Category[]));
  }

  return [...found, ...created];
}

/** Imposta le categorie di una nota (sostituzione completa). */
export async function setNoteCategories(
  userId: string,
  noteId: string,
  categoryIds: string[],
): Promise<void> {
  const supabase = getServiceClient();

  // 1. Rimuove le associazioni esistenti non più desiderate
  const { data: existingLinks } = await supabase
    .from('note_categories')
    .select('category_id')
    .eq('note_id', noteId);
  const currentIds = new Set(
    ((existingLinks || []) as { category_id: string }[]).map((l) => l.category_id),
  );
  const targetIds = new Set(categoryIds);

  const toRemove = [...currentIds].filter((id) => !targetIds.has(id));
  for (const category_id of toRemove) {
    const { error } = await supabase
      .from('note_categories')
      .delete()
      .eq('note_id', noteId)
      .eq('category_id', category_id);
    if (error) throw new Error(`setNoteCategories(delete): ${error.message}`);
  }

  // 2. Aggiunge le nuove
  const toAdd = categoryIds.filter((id) => !currentIds.has(id));
  if (toAdd.length) {
    const { error: insErr } = await supabase
      .from('note_categories')
      .insert(toAdd.map((category_id) => ({ note_id: noteId, category_id })));
    if (insErr) throw new Error(`setNoteCategories(insert): ${insErr.message}`);
  }
}

async function fetchCategoriesForNotes(
  userId: string,
  noteIds: string[],
): Promise<Map<string, Category[]>> {
  const map = new Map<string, Category[]>();
  if (!noteIds.length) return map;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('note_categories')
    .select('note_id, categories(*)')
    .in('note_id', noteIds);
  if (error) throw new Error(`fetchCategoriesForNotes: ${error.message}`);

  for (const row of data || []) {
    const typed = row as unknown as { note_id: string; categories: Category | null };
    if (!typed.categories) continue;
    const list = map.get(typed.note_id) || [];
    list.push(typed.categories);
    map.set(typed.note_id, list);
  }
  return map;
}

// ─── PERCORSI DI APPRENDIMENTO ───────────────────────────

export async function createLearningPath(
  userId: string,
  title: string,
  noteIds: string[],
): Promise<LearningPath> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('learning_paths')
    .insert({ user_id: userId, title: title.trim() || 'Percorso di apprendimento' })
    .select()
    .single();
  if (error) throw new Error(`createLearningPath: ${error.message}`);

  if (noteIds.length) {
    const { error: linkErr } = await supabase
      .from('learning_path_notes')
      .insert(noteIds.map((note_id, position) => ({ path_id: data.id, note_id, position })));
    if (linkErr) throw new Error(`createLearningPath(links): ${linkErr.message}`);
  }

  return data as LearningPath;
}

export async function listLearningPaths(userId: string): Promise<LearningPath[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`listLearningPaths: ${error.message}`);
  return (data || []) as LearningPath[];
}

export async function getLearningPathsForNote(userId: string, noteId: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('learning_path_notes')
    .select('learning_paths(*)')
    .eq('note_id', noteId);
  if (error) throw new Error(`getLearningPathsForNote: ${error.message}`);
  return ((data || []) as unknown as { learning_paths: LearningPath | null }[])
    .map((r) => r.learning_paths)
    .filter(Boolean) as LearningPath[];
}

export async function deleteLearningPath(userId: string, pathId: string): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('learning_paths')
    .delete()
    .eq('id', pathId)
    .eq('user_id', userId);
  if (error) throw new Error(`deleteLearningPath: ${error.message}`);
}

// ─── RIPASSO (Leitner) ──────────────────────────────────

const REVIEW_INTERVALS_DAYS = [3, 7, 14, 30, 60];

export function computeNextReview(box: number, correct: boolean): { leitner_box: number; next_review_at: string | null } {
  if (correct) {
    const nextBox = Math.min(box + 1, 4);
    const days = REVIEW_INTERVALS_DAYS[nextBox - 1] ?? 60;
    return { leitner_box: nextBox, next_review_at: addDays(days) };
  }
  const nextBox = Math.max(box - 1, 1);
  return { leitner_box: nextBox, next_review_at: addDays(1) };
}

function addDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export async function applyReviewResult(
  userId: string,
  noteId: string,
  correct: boolean,
): Promise<Note> {
  const note = await getNote(userId, noteId);
  if (!note) throw new Error('Nota non trovata');
  const { leitner_box, next_review_at } = computeNextReview(note.leitner_box, correct);
  return updateNote(userId, noteId, { leitner_box, next_review_at });
}

// ─── HELPER ─────────────────────────────────────────────

async function enrichNote(note: Note, userId: string): Promise<NoteWithRelations> {
  const categories = (await fetchCategoriesForNotes(userId, [note.id])).get(note.id) || [];
  const paths = await getLearningPathsForNote(userId, note.id);
  return {
    ...note,
    categories,
    paths,
    due: Boolean(note.leitner_box > 0 && note.next_review_at && new Date(note.next_review_at) <= new Date()),
  };
}

/** Note correlate in base alle categorie condivise (esclude se stessa). */
function buildRelatedCandidates(
  note: Note,
  allNotes: Note[],
  categoriesByNote: Map<string, Category[]>,
): NoteSummary[] {
  const myCatIds = new Set((categoriesByNote.get(note.id) || []).map((c) => c.id));
  if (!myCatIds.size) return [];

  return allNotes
    .filter((n) => n.id !== note.id)
    .map((n) => {
      const cats = categoriesByNote.get(n.id) || [];
      const shared = cats.filter((c) => myCatIds.has(c.id)).length;
      return { n, cats, shared };
    })
    .filter((r) => r.shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, 5)
    .map(({ n, cats }) => toSummary(n, cats));
}

function toSummary(note: Note, categories: Category[]): NoteSummary {
  return {
    id: note.id,
    title: note.title,
    language: note.language,
    source_type: note.source_type,
    status: note.status,
    leitner_box: note.leitner_box,
    next_review_at: note.next_review_at,
    created_at: note.created_at,
    snippet_excerpt: note.snippet_code.replace(/\s+/g, ' ').slice(0, 200),
    categories,
  };
}
