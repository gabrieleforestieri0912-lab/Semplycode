import { NextRequest, NextResponse } from 'next/server';
import { parseGitHubFileUrl, fetchGitHubFile, ParsedGitHubUrl } from '@/lib/githubFetch';

export async function POST(req: NextRequest) {
  try {
    const { url }: { url: string } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL richiesto' }, { status: 400 });
    }

    const parsed = parseGitHubFileUrl(url);
    if (!parsed) {
      return NextResponse.json(
        {
          error:
            'URL non valido. Usa un link GitHub al file (tab blob) o raw.githubusercontent.com',
        },
        { status: 400 },
      );
    }

    const content = await fetchGitHubFile(parsed);
    const name = parsed.path.split('/').pop() || 'file.txt';

    return NextResponse.json({
      name,
      content,
      path: parsed.path,
      repo: `${parsed.owner}/${parsed.repo}`,
      branch: parsed.branch,
    });
  } catch (error) {
    console.error('GitHub fetch error:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Errore nel recupero del file' },
      { status: 500 },
    );
  }
}
