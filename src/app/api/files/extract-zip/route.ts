import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { findUserByEmail } from '@/lib/supabase/db';
import { getPlanLimits } from '@/lib/planLimits';

const MAX_ZIP_SIZE = 512 * 1024;

const ALLOWED_EXT = new Set([
  'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'sql', 'css', 'html', 'json',
]);

function detectLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', java: 'java', cpp: 'cpp', c: 'c', go: 'go', rs: 'rust',
    php: 'php', sql: 'sql', css: 'css', html: 'markup', json: 'json',
  };
  return map[ext] || 'javascript';
}

export async function POST(req: NextRequest) {
  try {
    // Verifica piano prima di permettere ZIP
    const authUser = await getAuthUser(req);
    const plan = authUser?.email ? (await findUserByEmail(authUser.email).catch(() => null))?.plan || 'free' : 'guest';
    const limits = getPlanLimits(plan);
    if (!limits.allowZip) {
      return NextResponse.json({ error: `L'estrazione ZIP richiede il piano Pro o Enterprise. Il tuo piano attuale è "${plan}".` }, { status: 403 });
    }
    const MAX_FILES = limits.maxFiles;
    const MAX_FILE_SIZE = limits.maxCharsPerFile;

    const formData = await req.formData();
    const zipFile = formData.get('file');
    if (!zipFile || typeof zipFile === 'string') {
      return NextResponse.json({ error: 'File ZIP richiesto' }, { status: 400 });
    }

    if (zipFile.size > MAX_ZIP_SIZE) {
      return NextResponse.json({ error: 'ZIP troppo grande (max 512KB)' }, { status: 400 });
    }

    const { default: JSZip } = await import('jszip');
    const buffer = await zipFile.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    const files: Array<{ name: string; path: string; content: string; language: string }> = [];
    const entries = Object.keys(zip.files).filter(
      (name) => !zip.files[name].dir && !name.startsWith('__MACOSX'),
    );

    for (const name of entries) {
      if (files.length >= MAX_FILES) break;
      const baseName = name.split('/').pop();
      if (!baseName) continue;
      const ext = baseName.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EXT.has(ext)) continue;

      const content = await zip.files[name].async('string');
      if (content.length > MAX_FILE_SIZE) continue;

      files.push({
        name: baseName,
        path: name,
        content,
        language: detectLanguageFromFilename(baseName),
      });
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Nessun file di codice supportato trovato nello ZIP' },
        { status: 400 },
      );
    }

    return NextResponse.json({ files });
  } catch (error) {
    console.error('ZIP extract error:', error);
    return NextResponse.json({ error: 'Impossibile leggere lo ZIP' }, { status: 500 });
  }
}
