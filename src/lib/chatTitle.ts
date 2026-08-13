const MAX_TITLE_LENGTH = 56;

export function fallbackChatTitle(firstMessage: string): string {
  if (!firstMessage || typeof firstMessage !== 'string') {
    return 'Nuova chat';
  }

  const cleaned = firstMessage.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Nuova chat';

  const firstSentence = cleaned.split(/[.!?\n]/)[0]?.trim() || cleaned;
  const base = firstSentence.length >= 8 ? firstSentence : cleaned;

  if (base.length <= MAX_TITLE_LENGTH) return base;
  return `${base.slice(0, MAX_TITLE_LENGTH - 3).trim()}...`;
}

function normalizeAiTitle(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  let title = raw
    .trim()
    .replace(/^["'«»]+|["'«»]+$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[.!?:;]+$/g, '');

  if (!title) return null;
  if (title.length > MAX_TITLE_LENGTH) {
    title = `${title.slice(0, MAX_TITLE_LENGTH - 3).trim()}...`;
  }
  return title;
}

export async function generateChatTitleWithAI(firstMessage: string): Promise<string> {
  const fallback = fallbackChatTitle(firstMessage);
  if (!firstMessage?.trim()) return fallback;

  try {
    const { chatWithAI } = await import('@/lib/ai-provider');
    const result = await chatWithAI({
      messages: [
        {
          role: 'system',
          content:
            "Sei un assistente che crea titoli per conversazioni. Dato il primo messaggio dell'utente, rispondi SOLO con un titolo breve in italiano (massimo 6 parole) che riassuma l'argomento. Niente virgolette, niente spiegazioni.",
        },
        {
          role: 'user',
          content: firstMessage.trim().slice(0, 600),
        },
      ],
    });
    return normalizeAiTitle(result.content) || fallback;
  } catch {
    return fallback;
  }
}
