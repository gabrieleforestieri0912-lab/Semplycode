export interface CodeBlockResult {
  code: string;
  language: string;
  extension: string;
}

export const LANGUAGE_EXTENSION_MAP: Record<string, string> = {
  javascript: 'js',
  js: 'js',
  typescript: 'ts',
  ts: 'ts',
  tsx: 'tsx',
  jsx: 'jsx',
  python: 'py',
  py: 'py',
  html: 'html',
  markup: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  json: 'json',
  sql: 'sql',
  rust: 'rs',
  rs: 'rs',
  go: 'go',
  golang: 'go',
  cpp: 'cpp',
  'c++': 'cpp',
  c: 'c',
  csharp: 'cs',
  cs: 'cs',
  java: 'java',
  kotlin: 'kt',
  kt: 'kt',
  swift: 'swift',
  php: 'php',
  ruby: 'rb',
  rb: 'rb',
  bash: 'sh',
  shell: 'sh',
  sh: 'sh',
  zsh: 'sh',
  powershell: 'ps1',
  ps1: 'ps1',
  yaml: 'yml',
  yml: 'yml',
  markdown: 'md',
  md: 'md',
  xml: 'xml',
  vue: 'vue',
  svelte: 'svelte',
  dockerfile: 'dockerfile',
};

export function getExtensionForLanguage(lang: string): string {
  if (!lang) return 'txt';
  const clean = lang.trim().toLowerCase();
  return LANGUAGE_EXTENSION_MAP[clean] || 'txt';
}

/**
 * Rileva il linguaggio da un testo di codice se non specificato.
 */
export function detectLanguageFromCode(code: string): string {
  if (!code) return 'javascript';
  const text = code.trim();

  if (/^(import|export)\s.+from\s['"].+['"]/m.test(text) || /const\s+\w+\s*:\s*\w+/.test(text) || /interface\s+\w+/.test(text) || /type\s+\w+\s*=/.test(text)) {
    if (/<[A-Z]\w+.*>|<\/[A-Z]\w+>/.test(text)) return 'tsx';
    return 'typescript';
  }
  if (/<[a-zA-Z][\s\S]*>/m.test(text) && (/<!DOCTYPE html>/i.test(text) || /<html/i.test(text) || /<div/i.test(text))) {
    return 'html';
  }
  if (/def\s+\w+\s*\(.*\)[\s]*:/.test(text) || /import\s+\w+/.test(text) && /print\(/.test(text) || /elif\s+/.test(text)) {
    return 'python';
  }
  if (/\b(fn\s+main|let\s+mut|println!|impl\s+\w+)\b/.test(text)) {
    return 'rust';
  }
  if (/\bpackage\s+\w+\n+import\b|\bfunc\s+\w+\(/.test(text)) {
    return 'go';
  }
  if (/\b(SELECT|INSERT INTO|UPDATE|DELETE FROM|CREATE TABLE)\b/i.test(text)) {
    return 'sql';
  }
  if (/^<\?php/.test(text) || /\$\w+\s*=/.test(text)) {
    return 'php';
  }
  if (/\b(public\s+class|public\s+static\s+void\s+main|System\.out\.println)\b/.test(text)) {
    return 'java';
  }
  if (/#include\s+<[\w.]+>/.test(text) || /std::cout/.test(text)) {
    return 'cpp';
  }
  if (/^(\.|#)[\w-]+\s*\{[\s\S]*?\}/m.test(text)) {
    return 'css';
  }
  if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
    try {
      JSON.parse(text);
      return 'json';
    } catch {
      // not json
    }
  }

  return 'javascript';
}

/**
 * Estrae l'ultimo o il più rilevante blocco di codice dai messaggi della chat,
 * oppure usa il codice attivo nell'editor.
 */
export function extractCodeFromChat(
  messages: Array<{ role: string; content: string }>,
  editorCode?: string,
  fallbackLang?: string
): CodeBlockResult {
  // 1. Se c'è codice nell'editor e non è vuoto
  if (editorCode && editorCode.trim().length > 10) {
    const lang = fallbackLang || detectLanguageFromCode(editorCode);
    return {
      code: editorCode.trim(),
      language: lang,
      extension: getExtensionForLanguage(lang),
    };
  }

  // 2. Cerca blocchi di codice markdown negli ultimi messaggi dell'assistente
  const assistantMessages = messages.filter((m) => m.role === 'assistant').reverse();

  for (const msg of assistantMessages) {
    const codeBlockRegex = /```([a-zA-Z0-9_+#-]*)\n([\s\S]*?)```/g;
    let match;
    let lastCode: string | null = null;
    let lastLang = '';

    while ((match = codeBlockRegex.exec(msg.content)) !== null) {
      lastLang = match[1] || '';
      lastCode = match[2];
    }

    if (lastCode && lastCode.trim()) {
      const detected = lastLang ? lastLang.toLowerCase() : detectLanguageFromCode(lastCode);
      return {
        code: lastCode.trim(),
        language: detected,
        extension: getExtensionForLanguage(detected),
      };
    }
  }

  // 3. Fallback: se nessun blocco markdown ma c'è un messaggio con codice
  if (editorCode && editorCode.trim()) {
    const lang = fallbackLang || 'javascript';
    return {
      code: editorCode.trim(),
      language: lang,
      extension: getExtensionForLanguage(lang),
    };
  }

  return {
    code: '// Nessun blocco di codice trovato nella chat.',
    language: 'javascript',
    extension: 'js',
  };
}

/**
 * Prepara il contenuto Markdown dell'intera chat.
 */
export function formatFullChatToMarkdown(
  title: string,
  messages: Array<{ role: string; content: string }>
): string {
  const dateStr = new Date().toLocaleString('it-IT', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  let md = `# ${title || 'Conversazione Semplycode AI'}\n`;
  md += `*Data di esportazione: ${dateStr}*\n`;
  md += `*Generato con [Semplycode AI](https://semplycode.com)*\n\n`;
  md += `---\n\n`;

  for (const m of messages) {
    const isUser = m.role === 'user';
    const roleLabel = isUser ? 'Utente' : 'Semplycode AI';

    md += `### ${roleLabel}\n\n`;
    md += `${m.content.trim()}\n\n`;
    md += `---\n\n`;
  }

  return md;
}

/**
 * Ottiene il prefisso o percorso di salvataggio configurato dall'utente nelle impostazioni.
 */
export function getConfiguredExportSettings(): { path: string; autoPrefix: boolean } {
  if (typeof window === 'undefined') return { path: '', autoPrefix: false };
  try {
    const path = localStorage.getItem('semplycode:export_path') || '';
    const autoPrefix = localStorage.getItem('semplycode:export_autoprefix') === 'true';
    return { path, autoPrefix };
  } catch {
    return { path: '', autoPrefix: false };
  }
}

/**
 * Scarica un file nel browser. Se supportato e configurato, può richiedere percorso o usare download diretto.
 */
export async function downloadFile(filename: string, content: string, mimeType: string = 'text/plain;charset=utf-8'): Promise<void> {
  // Pulisci il nome file da caratteri non validi
  const cleanFilename = filename.replace(/[\\/:*?"<>|]/g, '_');

  // Verifica se l'utente ha configurato una cartella o prefisso
  const { path, autoPrefix } = getConfiguredExportSettings();
  let finalFilename = cleanFilename;

  if (autoPrefix && path.trim()) {
    const cleanPath = path.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || '';
    if (cleanPath) {
      finalFilename = `${cleanPath}_${cleanFilename}`;
    }
  }

  // Blob download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Esporta l'intera chat come file Markdown.
 */
export async function exportChatAsMarkdown(
  title: string,
  messages: Array<{ role: string; content: string }>
): Promise<void> {
  const content = formatFullChatToMarkdown(title, messages);
  const baseName = (title || 'chat-semplycode').toLowerCase().replace(/\s+/g, '-').slice(0, 40);
  const dateTag = new Date().toISOString().slice(0, 10);
  const filename = `${baseName}-${dateTag}.md`;
  await downloadFile(filename, content, 'text/markdown;charset=utf-8');
}

/**
 * Esporta solo il codice rilevato con l'estensione corretta.
 */
export async function exportCodeOnly(
  title: string,
  messages: Array<{ role: string; content: string }>,
  editorCode?: string,
  fallbackLang?: string
): Promise<{ filename: string; language: string }> {
  const { code, language, extension } = extractCodeFromChat(messages, editorCode, fallbackLang);
  const baseName = (title || 'code').toLowerCase().replace(/\s+/g, '-').slice(0, 30);
  const filename = `${baseName}.${extension}`;
  await downloadFile(filename, code, 'text/plain;charset=utf-8');
  return { filename, language };
}
