import { fallbackChatTitle, generateChatTitleWithAI } from '@/lib/chatTitle';

describe('fallbackChatTitle', () => {
  it('returns default for empty input', () => {
    expect(fallbackChatTitle('')).toBe('Nuova chat');
    expect(fallbackChatTitle(null as any)).toBe('Nuova chat');
    expect(fallbackChatTitle(undefined as any)).toBe('Nuova chat');
  });

  it('cleans whitespace', () => {
    expect(fallbackChatTitle('   hello   world   ')).toBe('hello world');
  });

  it('returns first sentence when >= 8 chars', () => {
    expect(fallbackChatTitle('Hello world! This is a test.')).toBe('Hello world');
  });

  it('falls back to full text when first sentence is short', () => {
    expect(fallbackChatTitle('Hi! This is a much longer message')).toBe('Hi! This is a much longer message');
  });

  it('truncates long titles', () => {
    const long = 'a'.repeat(60);
    expect(fallbackChatTitle(long)).toHaveLength(56);
    expect(fallbackChatTitle(long)).toMatch(/\.\.\.$/);
  });
});

describe('generateChatTitleWithAI', () => {
  const originalOpenAIKey = process.env.OPENAI_API_KEY;
  const originalOllamaUrl = process.env.OLLAMA_URL;

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalOpenAIKey;
    process.env.OLLAMA_URL = originalOllamaUrl;
  });

  it('returns fallback when firstMessage is empty', async () => {
    await expect(generateChatTitleWithAI('')).resolves.toBe('Nuova chat');
  });

  it('calls AI provider endpoint with correct payload', async () => {
    process.env.OPENAI_API_KEY = '';
    process.env.OLLAMA_URL = 'http://localhost:11434';
    const mockJson = { message: { content: 'Test Title' } };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockJson),
    });

    const result = await generateChatTitleWithAI('Some message');
    expect(result).toBe('Test Title');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Some message'),
      })
    );
  });

  it('uses OpenAI when OPENAI_API_KEY is set', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: 'OpenAI Title' } }] }),
    });

    const result = await generateChatTitleWithAI('Some message');
    expect(result).toBe('OpenAI Title');
    expect(fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
        }),
      })
    );
  });

  it('returns fallback on fetch error', async () => {
    process.env.OPENAI_API_KEY = '';
    global.fetch = jest.fn().mockRejectedValue(new Error('network'));
    const result = await generateChatTitleWithAI('Some message');
    expect(result).toBe('Some message');
  });

  it('returns fallback when response is not ok', async () => {
    process.env.OPENAI_API_KEY = '';
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    const result = await generateChatTitleWithAI('Some message');
    expect(result).toBe('Some message');
  });
});
