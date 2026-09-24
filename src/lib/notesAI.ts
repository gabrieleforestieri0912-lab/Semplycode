import { chatWithAI } from '@/lib/ai-provider';
import {
  buildCategorizationPrompt,
  buildQuizPrompt,
  buildRelatedPrompt,
  extractJson,
  type CategorizationResult,
  type QuizResult,
} from '@/lib/notesPrompts';
import {
  listCategories,
  getOrCreateCategories,
  setNoteCategories,
  updateNote,
  listNotes,
} from '@/lib/notesDb';
import type { Note, Category, NoteWithRelations } from '@/lib/supabase/types';

const CATEGORY_MODEL =
  process.env.NOTES_AI_MODEL || process.env.AI_MODEL || 'qwen/qwen3-coder-plus:free';

/**
 * Categorizza una nota in background: riusa le categorie esistenti
 * dell'account e crea solo quelle mancanti. Idempotente (sostituisce
 * le categorie della nota) e aggiorna lo status a 'ready'.
 * In caso di errore AI la nota resta salvata (status 'pending').
 */
export async function categorizeNoteWithAI(
  userId: string,
  note: Note,
): Promise<Category[]> {
  try {
    const existingCategories = await listCategories(userId);
    const prompt = buildCategorizationPrompt({
      code: note.snippet_code,
      explanation: note.explanation,
      language: note.language,
      existingCategories,
    });

    const result = await chatWithAI({
      messages: [
        { role: 'system', content: 'Sei un sistema di classificazione. Rispondi solo con JSON.' },
        { role: 'user', content: prompt },
      ],
      model: CATEGORY_MODEL,
    });

    const parsed = extractJson<CategorizationResult>(result.content);
    if (!parsed || !Array.isArray(parsed.category_ids)) {
      throw new Error('Categorizzazione: risposta AI non valida');
    }

    // Reconciliare i nomi nuovi contro l'esistente (case-insensitive)
    const newCategories = await getOrCreateCategories(userId, parsed.new_categories || []);
    const categoryIds = [
      ...(parsed.category_ids || []),
      ...newCategories.map((c) => c.id),
    ];

    await setNoteCategories(userId, note.id, categoryIds);
    await updateNote(userId, note.id, { status: 'ready' });

    const all = await listCategories(userId);
    return all.filter((c) => categoryIds.includes(c.id));
  } catch (error) {
    console.error('[notesAI] categorize failed:', error);
    // La nota resta salvata; il batch potrà ritentare.
    return [];
  }
}

/** Genera un mini-quiz a scelta multipla a partire dalla nota. */
export async function generateQuizForNote(userId: string, note: Note): Promise<QuizResult> {
  const prompt = buildQuizPrompt({
    title: note.title,
    code: note.snippet_code,
    explanation: note.explanation,
    language: note.language,
  });

  const result = await chatWithAI({
    messages: [
      { role: 'system', content: 'Sei un tutor di programmazione. Rispondi solo con JSON.' },
      { role: 'user', content: prompt },
    ],
    model: CATEGORY_MODEL,
  });

  const parsed = extractJson<QuizResult>(result.content);
  if (
    !parsed ||
    typeof parsed.question !== 'string' ||
    !Array.isArray(parsed.options) ||
    parsed.options.length !== 4 ||
    typeof parsed.correct !== 'number' ||
    parsed.correct < 0 ||
    parsed.correct > 3
  ) {
    throw new Error('Quiz: risposta AI non valida');
  }
  void userId;
  return {
    question: parsed.question,
    options: parsed.options,
    correct: parsed.correct,
    explanation: parsed.explanation || '',
  };
}

/**
 * Trova note correlate semanticamente usando l'AI.
 * Riceve le note candidate (già filtrate per utente) e restituisce gli id.
 */
export async function findRelatedNotesWithAI(
  userId: string,
  note: Note,
  candidates: NoteWithRelations[],
): Promise<string[]> {
  if (!candidates.length) return [];
  try {
    const prompt = buildRelatedPrompt({
      title: note.title,
      explanation: note.explanation,
      candidates: candidates.map((c) => ({ id: c.id, title: c.title, explanation: c.explanation })),
    });

    const result = await chatWithAI({
      messages: [
        { role: 'system', content: 'Sei un tutor di programmazione. Rispondi solo con JSON.' },
        { role: 'user', content: prompt },
      ],
      model: CATEGORY_MODEL,
    });

    const parsed = extractJson<{ related_ids: string[] }>(result.content);
    if (!parsed || !Array.isArray(parsed.related_ids)) return [];

    const ids = new Set(candidates.map((c) => c.id));
    return [...new Set(parsed.related_ids)].filter((id) => ids.has(id)).slice(0, 3);
  } catch (error) {
    console.error('[notesAI] related failed:', error);
    return [];
  }
}
