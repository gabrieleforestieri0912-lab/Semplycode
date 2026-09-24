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

function getAIBaseUrl(): string {
  const url = process.env.AI_BASE_URL || 'https://api.xkiro.com/v1';
  return url.replace(/\/+$/, '');
}

function getAIApiKey(): string {
  return (
    process.env.AI_API_KEY ||
    process.env.XKIRO_API_KEY ||
    'sk-xt-45159bc825d4cc36555287427086591547f01e278b5984a4'
  );
}

function getDefaultAIModel(): string {
  return process.env.AI_MODEL || 'qwen/qwen3-coder-plus:free';
}

function toOpenAIMessages(messages: ChatMessage[]): { role: string; content: string }[] {
  return messages.map((m) => ({
    role: m.role === 'model' ? 'assistant' : m.role,
    content: m.content || '',
  }));
}

export async function chatWithAI(options: ChatOptions): Promise<ChatResult> {
  const model = options.model || getDefaultAIModel();
  const baseUrl = getAIBaseUrl();
  const apiKey = getAIApiKey();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: toOpenAIMessages(options.messages),
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`AI Provider error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '';
  return { content };
}

export async function chatWithAIStream(options: ChatOptions): Promise<Response> {
  const model = options.model || getDefaultAIModel();
  const baseUrl = getAIBaseUrl();
  const apiKey = getAIApiKey();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: toOpenAIMessages(options.messages),
      stream: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`AI Provider stream error (${response.status}): ${errText}`);
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
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();

            if (dataStr === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const delta =
                parsed?.choices?.[0]?.delta?.content ||
                parsed?.choices?.[0]?.text ||
                '';
              if (delta) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`),
                );
              }
            } catch {
              // skip incomplete chunk JSON
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('AI stream error:', err);
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