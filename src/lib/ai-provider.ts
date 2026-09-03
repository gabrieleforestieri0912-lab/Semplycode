export interface ChatMessage {
  role: string;
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  model?: string;
}

export interface ChatResult {
  content: string;
}

function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.0-flash';
}

function getGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY || '';
}

function toGeminiContent(messages: ChatMessage[]): { role: string; parts: { text: string }[] }[] {
  const systemText = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n');

  const userMessages = messages.filter((m) => m.role !== 'system');

  if (systemText) {
    return [{ role: 'user', parts: [{ text: systemText }] }, ...userMessages.map(toPart)];
  }
  return userMessages.map(toPart);
}

function toPart(message: ChatMessage): { role: string; parts: { text: string }[] } {
  return { role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] };
}

export async function chatWithAI(options: ChatOptions): Promise<ChatResult> {
  const model = options.model || getGeminiModel();
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${getGeminiApiKey()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: toGeminiContent(options.messages),
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini error: ${response.statusText} ${errText}`);
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { content };
}

export async function chatWithAIStream(options: ChatOptions): Promise<Response> {
  const model = options.model || getGeminiModel();
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${getGeminiApiKey()}${'&alt=sse'}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: toGeminiContent(options.messages),
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini error: ${response.statusText} ${errText}`);
  }

  const encoder = new TextEncoder();
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      if (!reader) {
        controller.close();
        return;
      }

      try {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const trimmed = line.slice(6).trim();
            if (!trimmed) continue;

            try {
              const parsed = JSON.parse(trimmed);
              const delta = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
                || parsed?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
                || '';
              if (delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Gemini stream error:', err);
        }
      } finally {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    },
  });
}