export interface ChatMessage {
  role: string;
  content: string;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  remainingTokens?: number;
}

export async function postChat(messages: ChatMessage[]): Promise<Record<string, unknown>> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, stream: false }),
  });

  const data = await response.json();

  if (!response.ok) {
    const err = new Error(data.error || 'Errore API') as ApiError;
    err.status = response.status;
    err.code = data.code;
    err.remainingTokens = data.remainingTokens;
    throw err;
  }

  return data;
}

export async function postChatStream(
  messages: ChatMessage[],
  onChunk: (content: string) => void,
  onDone: (fullContent: string) => void,
  onError: (error: string) => void,
): Promise<AbortController> {
  const controller = new AbortController();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, stream: true }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      onError(data.error || `Errore ${response.status}`);
      return controller;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream') || !response.body) {
      // Non-streaming fallback
      const data = await response.json();
      const content = data.message?.content || JSON.stringify(data);
      onChunk(content);
      onDone(content);
      return controller;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.done) {
            onDone(fullContent);
            return controller;
          }
          if (parsed.content) {
            fullContent += parsed.content;
            onChunk(parsed.content);
          }
        } catch {}
      }
    }

    onDone(fullContent);
  } catch (err) {
    if ((err as Error).name === 'AbortError') return controller;
    onError((err as Error).message || 'Errore di streaming');
  }

  return controller;
}

export function formatApiError(error: ApiError): string {
  if (error?.status === 429) {
    return error.message;
  }
  if (error?.code === 'GEMINI_ERROR' || error?.code === 'AI_ERROR' || error?.status === 500) {
    return 'Motore AI non disponibile. Verifica la configurazione o riprova.';
  }
  if (error?.status === 401) {
    return 'Sessione scaduta. Ricarica la pagina.';
  }
  return error?.message || "Errore di comunicazione con l'AI.";
}
