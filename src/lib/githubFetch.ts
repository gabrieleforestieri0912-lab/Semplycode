export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  rawUrl: string;
}

export function parseGitHubFileUrl(url: string): ParsedGitHubUrl | null {
  try {
    const u = new URL(url.trim());

    if (u.hostname === 'raw.githubusercontent.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length < 4) return null;
      const [owner, repo, branch, ...rest] = parts;
      return {
        owner,
        repo,
        branch,
        path: rest.join('/'),
        rawUrl: u.href,
      };
    }

    if (u.hostname !== 'github.com') return null;

    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length >= 4 && parts[2] === 'blob') {
      const [owner, repo, , branch, ...rest] = parts;
      const path = rest.join('/');
      return {
        owner,
        repo,
        branch,
        path,
        rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function fetchGitHubFile(parsed: ParsedGitHubUrl): Promise<string> {
  const res = await fetch(parsed.rawUrl, {
    headers: { Accept: 'application/vnd.github.raw' },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Impossibile scaricare il file (${res.status})`);
  }
  const content = await res.text();
  if (content.length > 150 * 1024) {
    throw new Error('File troppo grande (max 150KB)');
  }
  return content;
}
