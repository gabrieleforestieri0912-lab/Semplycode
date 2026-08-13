import { chatWithAI, chatWithAIStream } from '@/lib/ai-provider';

describe('ai-provider', () => {
  const originalOpenAIKey = process.env.OPENAI_API_KEY;
  const originalOpenAIBaseUrl = process.env.OPENAI_BASE_URL;
  const originalOpenAIModel = process.env.OPENAI_MODEL;
  const originalOllamaUrl = process.env.OLLAMA_URL;
  const originalOllamaModel = process.env.OLLAMA_MODEL;

  afterEach(() => {
    if (originalOpenAIKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalOpenAIKey;
    }
    if (originalOpenAIBaseUrl === undefined) {
      delete process.env.OPENAI_BASE_URL;
    } else {
      process.env.OPENAI_BASE_URL = originalOpenAIBaseUrl;
    }
    if (originalOpenAIModel === undefined) {
      delete process.env.OPENAI_MODEL;
    } else {
      process.env.OPENAI_MODEL = originalOpenAIModel;
    }
    if (originalOllamaUrl === undefined) {
      delete process.env.OLLAMA_URL;
    } else {
      process.env.OLLAMA_URL = originalOllamaUrl;
    }
    if (originalOllamaModel === undefined) {
      delete process.env.OLLAMA_MODEL;
    } else {
      process.env.OLLAMA_MODEL = originalOllamaModel;
    }
  });

  describe('chatWithAI', () => {
    it('uses OpenAI when OPENAI_API_KEY is set', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'OpenAI response' } }] }),
      });

      const result = await chatWithAI({
        messages: [{ role: 'user', content: 'hello' }],
      });

      expect(result.content).toBe('OpenAI response');
      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        })
      );
    });

    it('uses OpenAI custom base URL when set', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_BASE_URL = 'https://custom.openai.com/v1';
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'custom response' } }] }),
      });

      const result = await chatWithAI({
        messages: [{ role: 'user', content: 'hello' }],
      });

      expect(result.content).toBe('custom response');
      expect(fetch).toHaveBeenCalledWith(
        'https://custom.openai.com/v1/chat/completions',
        expect.anything()
      );
    });

    it('uses OpenAI custom model when set', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_MODEL = 'gpt-4o-mini';
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'mini response' } }] }),
      });

      const result = await chatWithAI({
        messages: [{ role: 'user', content: 'hello' }],
        model: 'gpt-4o-mini',
      });

      expect(result.content).toBe('mini response');
      const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.model).toBe('gpt-4o-mini');
    });

    it('falls back to Ollama when OPENAI_API_KEY is not set', async () => {
      process.env.OPENAI_API_KEY = '';
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: { content: 'ollama response' } }),
      });

      const result = await chatWithAI({
        messages: [{ role: 'user', content: 'hello' }],
      });

      expect(result.content).toBe('ollama response');
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        expect.anything()
      );
    });

    it('uses requested model override', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'ok' } }] }),
      });

      await chatWithAI({
        messages: [{ role: 'user', content: 'hello' }],
        model: 'gpt-4',
      });

      const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.model).toBe('gpt-4');
    });
  });

  describe('chatWithAIStream', () => {
    it('returns a streaming Response for OpenAI', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'text/event-stream' : null),
        },
        body: {
          getReader: () => ({
            read: async () => ({ done: true, value: undefined }),
            cancel: async () => {},
          }),
        },
      });

      const response = await chatWithAIStream({
        messages: [{ role: 'user', content: 'hello' }],
      });

      expect(response.headers.get('content-type')).toBe('text/event-stream');
      expect(response.body).toBeDefined();
    });

    it('returns a streaming Response for Ollama', async () => {
      process.env.OPENAI_API_KEY = '';
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        headers: {
          get: (name: string) => (name === 'content-type' ? 'text/event-stream' : null),
        },
        body: {
          getReader: () => ({
            read: async () => ({ done: true, value: undefined }),
            cancel: async () => {},
          }),
        },
      });

      const response = await chatWithAIStream({
        messages: [{ role: 'user', content: 'hello' }],
      });

      expect(response.headers.get('content-type')).toBe('text/event-stream');
      expect(response.body).toBeDefined();
    });
  });
});
