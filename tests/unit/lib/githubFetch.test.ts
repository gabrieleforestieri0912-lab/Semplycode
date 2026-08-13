import { parseGitHubFileUrl, fetchGitHubFile } from '@/lib/githubFetch';

describe('parseGitHubFileUrl', () => {
  it('parses raw.githubusercontent.com URLs', () => {
    const result = parseGitHubFileUrl('https://raw.githubusercontent.com/owner/repo/main/src/file.ts');
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      branch: 'main',
      path: 'src/file.ts',
      rawUrl: 'https://raw.githubusercontent.com/owner/repo/main/src/file.ts',
    });
  });

  it('parses github.com blob URLs', () => {
    const result = parseGitHubFileUrl('https://github.com/owner/repo/blob/main/src/file.ts');
    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      branch: 'main',
      path: 'src/file.ts',
      rawUrl: 'https://raw.githubusercontent.com/owner/repo/main/src/file.ts',
    });
  });

  it('returns null for invalid URLs', () => {
    expect(parseGitHubFileUrl('not-a-url')).toBeNull();
  });

  it('returns null for github.com URLs without blob', () => {
    expect(parseGitHubFileUrl('https://github.com/owner/repo')).toBeNull();
  });

  it('returns null for non-github domains', () => {
    expect(parseGitHubFileUrl('https://gitlab.com/owner/repo/blob/main/file.ts')).toBeNull();
  });

  it('handles files in root directory', () => {
    const result = parseGitHubFileUrl('https://github.com/owner/repo/blob/main/file.ts');
    expect(result?.path).toBe('file.ts');
  });

  it('handles nested paths', () => {
    const result = parseGitHubFileUrl('https://github.com/owner/repo/blob/develop/src/components/Button.tsx');
    expect(result?.path).toBe('src/components/Button.tsx');
  });
});

describe('fetchGitHubFile', () => {
  it('throws on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(fetchGitHubFile({
      owner: 'o',
      repo: 'r',
      branch: 'main',
      path: 'f.ts',
      rawUrl: 'https://raw.githubusercontent.com/o/r/main/f.ts',
    })).rejects.toThrow('404');
  });

  it('returns text content on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('file content'),
    });

    const result = await fetchGitHubFile({
      owner: 'o',
      repo: 'r',
      branch: 'main',
      path: 'f.ts',
      rawUrl: 'https://raw.githubusercontent.com/o/r/main/f.ts',
    });

    expect(result).toBe('file content');
  });

  it('throws when file exceeds 150KB', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('x'.repeat(150 * 1024 + 1)),
    });

    await expect(fetchGitHubFile({
      owner: 'o',
      repo: 'r',
      branch: 'main',
      path: 'f.ts',
      rawUrl: 'https://raw.githubusercontent.com/o/r/main/f.ts',
    })).rejects.toThrow('File troppo grande');
  });
});
