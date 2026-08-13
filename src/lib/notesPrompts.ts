export interface ExistingCategory {
  id: string;
  name: string;
}

export interface CategorizationResult {
  category_ids: string[];
  new_categories: string[];
}

export interface QuizResult {
  question: string;
  options: string[];
  correct: number; // indice dell'opzione corretta
  explanation: string;
}

/**
 * Prompt per la categorizzazione automatica.
 * Riceve codice + spiegazione e l'elenco delle categorie già esistenti
 * dell'utente, per riusare gli id e non generare duplicati.
 */
export function buildCategorizationPrompt(params: {
  code: string;
  explanation: string;
  language: string;
  existingCategories: ExistingCategory[];
}): string {
  const { code, explanation, language, existingCategories } = params;

  const existingJson = existingCategories.length
    ? JSON.stringify(existingCategories)
    : '[]';

  return `Sei un esperto di programmazione e devi assegnare delle categorie a una nota di apprendimento.

Queste sono le categorie GIÀ esistenti nell'account dell'utente (riusa SEMPRE gli id quando una categoria calza):
${existingJson}

Codice (linguaggio: ${language}):
\`\`\`
${code.slice(0, 6000)}
\`\`\`

Spiegazione associata:
${explanation.slice(0, 6000)}

Regole:
- Assegna 1-3 categorie tra quelle esistenti (usa i loro "id").
- Se nessuna categoria esistente calza bene, proponi al massimo 1 NUOVA categoria con nome breve, singolare/neutro e normalizzato (es. "async/await", "regex", "React hooks", "gestione stato"). Niente nomi troppo specifici o con maiuscole.
- NON inventare id: per le nuove categorie lascia "category_ids" vuoto e metti il nome in "new_categories".
- Rispondi SOLO con un JSON valido, senza markdown, nella forma:
{"category_ids": ["<id esistente>", ...], "new_categories": ["<nome nuova categoria>"]}`;
}

/** Prompt per generare un mini-quiz (ripasso) a partire da una nota. */
export function buildQuizPrompt(params: {
  title: string;
  code: string;
  explanation: string;
  language: string;
}): string {
  const { title, code, explanation, language } = params;

  return `Sei un tutor di programmazione. Crea un mini-quiz a scelta multipla sulla nota di apprendimento seguente.

Titolo: ${title}
Codice (linguaggio: ${language}):
\`\`\`
${code.slice(0, 6000)}
\`\`\`

Spiegazione:
${explanation.slice(0, 6000)}

Regole:
- 1 domanda che verifichi la comprensione del concetto chiave (non banale, non troppo difficile).
- 4 opzioni di risposta di cui UNA sola corretta.
- Spiega brevemente la risposta corretta.
- Rispondi SOLO con un JSON valido, senza markdown, nella forma:
{"question": "...", "options": ["...", "...", "...", "..."], "correct": 2, "explanation": "..."}
dove "correct" è l'indice (0-3) dell'opzione corretta.`;
}

/** Prompt per trovare note correlate semanticamente (oltre le categorie). */
export function buildRelatedPrompt(params: {
  title: string;
  explanation: string;
  candidates: { id: string; title: string; explanation: string }[];
}): string {
  const { title, explanation, candidates } = params;

  const candidatesJson = JSON.stringify(
    candidates.map((c) => ({ id: c.id, title: c.title, excerpt: c.explanation.slice(0, 500) })),
  );

  return `Sei un tutor di programmazione. Data la nota seguente:

Titolo: ${title}
Contenuto: ${explanation.slice(0, 3000)}

Trova al massimo 3 note correlate semanticamente tra queste (stesso concetto, argomento o competenza):

${candidatesJson}

Rispondi SOLO con un JSON valido, senza markdown, nella forma:
{"related_ids": ["<id>", ...]}`;
}

/**
 * Estrae il primo oggetto JSON da una risposta AI tollerando fenced blocks
 * (```json ... ```) e testo circostante.
 */
export function extractJson<T>(raw: string): T | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : trimmed;

  try {
    return JSON.parse(candidate) as T;
  } catch {
    // Prova a estrarre il primo blocco {...}
    const match = candidate.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}
