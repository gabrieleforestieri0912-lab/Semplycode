import { NextRequest, NextResponse } from 'next/server';
import { parseGitHubFileUrl, fetchGitHubFile, ParsedGitHubUrl } from '@/lib/githubFetch';
import { getAuthUser } from '@/lib/api-auth';
import { findUserByEmail } from '@/lib/supabase/db';
import { getPlanLimits } from '@/lib/planLimits';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    const plan = authUser?.email ? (await findUserByEmail(authUser.email).catch(() => null))?.plan || 'free' : 'guest';
    const limits = getPlanLimits(plan);
    if (!limits.allowGithub) {
      return NextResponse.json({ error: `L'import da GitHub richiede almeno il piano Starter. Il tuo piano è "${plan}".` }, { status: 403 });
    }
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
