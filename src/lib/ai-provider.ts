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

function getOpenAiBaseUrl(): string {
  return (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
}

function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o';
}

function getOllamaUrl(): string {
  return process.env.OLLAMA_URL || 'http://localhost:11434';
}

function getOllamaModel(): string {
  return process.env.OLLAMA_MODEL || 'llama3';
}

function isOpenAIEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function resolveModel(requested?: string): string {
  if (requested) return requested;
  if (isOpenAIEnabled()) return getOpenAiModel();
  return getOllamaModel();
}

export async function chatWithAI(options: ChatOptions): Promise<ChatResult> {
  const { messages, model } = options;
  const resolvedModel = resolveModel(model);

  if (isOpenAIEnabled()) {
    return chatOpenAI({ messages, model: resolvedModel });
  }

  return chatOllama({ messages, model: resolvedModel });
}

export async function chatWithAIStream(options: ChatOptions): Promise<Response> {
  const { messages, model } = options;
  const resolvedModel = resolveModel(model);

  if (isOpenAIEnabled()) {
    return chatOpenAIStreamResponse({ messages, model: resolvedModel });
  }

  return chatOllamaStreamResponse({ messages, model: resolvedModel });
}

async function chatOpenAI(options: ChatOptions): Promise<ChatResult> {
  const response = await fetch(`${getOpenAiBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`OpenAI error: ${response.statusText} ${errText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '';
  return { content };
}

async function chatOpenAIStreamResponse(options: ChatOptions): Promise<Response> {
  const response = await fetch(`${getOpenAiBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`OpenAI error: ${response.statusText} ${errText}`);
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
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(Boolean);

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const trimmed = line.slice(6).trim();
            if (trimmed === '[DONE]') continue;

            try {
              const parsed = JSON.parse(trimmed);
              const delta = parsed.choices?.[0]?.delta?.content || '';
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
          console.error('OpenAI stream error:', err);
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

async function chatOllama(options: ChatOptions): Promise<ChatResult> {
  const response = await fetch(`${getOllamaUrl()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Ollama error: ${response.statusText} ${errText}`);
  }

  const data = await response.json();
  const content = data?.message?.content || data?.response || '';
  return { content };
}

async function chatOllamaStreamResponse(options: ChatOptions): Promise<Response> {
  const response = await fetch(`${getOllamaUrl()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Ollama error: ${response.statusText} ${errText}`);
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
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(Boolean);

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              const delta = parsed.message?.content || parsed.response || '';
              if (delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
              }
              if (parsed.done) break;
            } catch {
              // skip malformed JSON
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Ollama stream error:', err);
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
