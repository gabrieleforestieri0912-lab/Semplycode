/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useCallback, useEffect, useRef, MouseEvent } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { rust } from "@codemirror/lang-rust";
import { go } from "@codemirror/lang-go";
import { php } from "@codemirror/lang-php";
import { sql } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { StreamLanguage } from "@codemirror/stream-parser";
import { perl } from "@codemirror/legacy-modes/mode/perl";
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { ruby } from "@codemirror/legacy-modes/mode/ruby";
import { pascal } from "@codemirror/legacy-modes/mode/pascal";
import { java, cpp, c, csharp, kotlin } from "@codemirror/legacy-modes/mode/clike";
import { swift } from "@codemirror/legacy-modes/mode/swift";
import { fortran } from "@codemirror/legacy-modes/mode/fortran";
import { cobol } from "@codemirror/legacy-modes/mode/cobol";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import {
  Code2,
  MessageSquare,
  Loader2,
  Brain,
  Sparkles,
  ArrowRight,
  Send,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { debounce } from "lodash";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSupabaseSession } from "@/lib/auth";
import { Plus, Trash2, Play, FileText, FolderPlus, Archive, Github, X } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { postChatStream, formatApiError } from "@/lib/playgroundApi";
import { buildAnalysisSystemPrompt, REVIEWER_DEPTH_RULES, getAnalysisTypeLabels, getAnalysisTypeDescriptions } from "@/lib/analysisPrompts";
import { useLanguage } from "@/context/LanguageContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FileInfo {
  name: string;
  /** Percorso relativo quando caricato da cartella/ZIP, altrimenti uguale a name. */
  path?: string;
  content: string;
  language: string;
}

const MAX_DEMO_FILES = 50;
const MAX_DEMO_FILE_SIZE = 100 * 1024;
const ALLOWED_CODE_EXTENSIONS = [
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "java",
  "cpp",
  "c",
  "go",
  "rs",
  "php",
  "sql",
  "css",
  "html",
  "json",
];

const detectLanguageFromFilename = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    go: "go",
    rs: "rust",
    php: "php",
    sql: "sql",
    css: "css",
    html: "markup",
    json: "json",
  };
  return map[ext] || "javascript";
};

interface ErrorWithStatus {
  status?: number;
  message?: string;
  code?: string;
}

/** Rimuove il ragionamento interno del modello (<think>...</think>) così non appare mai nei messaggi. */
function stripThinking(content: string): string {
  if (!content) return content;
  let out = content;
  out = out.replace(/<think>[\s\S]*?<\/think>/gi, "");
  out = out.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
  const openIdx = out.search(/<think>/i);
  if (openIdx !== -1) out = out.slice(0, openIdx);
  const openIdx2 = out.search(/<thinking>/i);
  if (openIdx2 !== -1) out = out.slice(0, openIdx2);
  out = out.replace(/<\/?think\s*>/gi, "").replace(/<\/?thinking\s*>/gi, "");
  return out.trimStart();
}

/** Rendering del report AI identico alla chat (niente font-mono, tipografia prose, code block con header). */
const DemoAIResponse = ({ content, lang }: { content: string; lang: "it" | "en" }) => {
  return (
    <div className="relative text-left [&>*:first-child]:mt-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => (
            <h1 className="text-base font-bold text-white mb-3 mt-1 first:mt-0" {...props} />
          ),
          h2: ({ ...props }) => (
            <h2 className="text-[15px] font-bold text-white mt-6 mb-3 first:mt-0 pt-4 border-t border-emerald-900/30 first:border-t-0 first:pt-0" {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 className="text-sm font-semibold text-primary mt-4 mb-2 first:mt-0" {...props} />
          ),
          h4: ({ ...props }) => (
            <h4 className="text-sm font-medium text-gray-200 mt-3 mb-1.5" {...props} />
          ),
          p: ({ ...props }) => (
            <p className="mb-3 last:mb-0 text-sm leading-relaxed text-gray-300" {...props} />
          ),
          ul: ({ ...props }) => (
            <ul className="my-3 space-y-2 pl-5 list-disc marker:text-primary/70 text-gray-300" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="my-3 space-y-2 pl-5 list-decimal text-sm text-gray-300 marker:text-primary/80" {...props} />
          ),
          li: ({ children, ...props }: { children?: React.ReactNode }) => (
            <li className="text-sm leading-relaxed [&>p]:mb-1.5 [&>p]:last:mb-0" {...props}>
              {children}
            </li>
          ),
          blockquote: ({ ...props }) => (
            <blockquote className="my-3 pl-3 border-l-2 border-primary/50 text-gray-400 text-sm italic" {...props} />
          ),
          strong: ({ ...props }) => (
            <strong className="font-semibold text-emerald-300" {...props} />
          ),
          a: ({ ...props }) => (
            <a className="text-primary underline underline-offset-2 hover:text-primary/80" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          code: ({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) => {
            if (inline) {
              return (
                <code
                  className="bg-emerald-950/80 px-1.5 py-0.5 rounded text-emerald-300 text-[13px] font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            const match = /language-(\w+)/.exec(className || "");
            const codeLang = match?.[1] || (lang === "en" ? "code" : "codice");
            const raw = Array.isArray(children)
              ? children.join("")
              : String(children ?? "").replace(/\n$/, "");
            return (
              <div className="my-4 w-full rounded-xl overflow-hidden border border-emerald-800/40 bg-[#010409]">
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-950/60 border-b border-emerald-900/30">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
                    {codeLang}
                  </span>
                  <button
                    type="button"
                    className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-600/25 text-emerald-300 hover:bg-emerald-600/40 transition-colors"
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(raw);
                      } catch {
                        // clipboard non disponibile
                      }
                    }}
                  >
                    {lang === "en" ? "Copy" : "Copia"}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto m-0 demo-scroll">
                  <code className="text-[13px] font-mono leading-relaxed text-gray-200 whitespace-pre">
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

interface DemoMessageProps {
  message: Message;
  lang: "it" | "en";
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
}

/** Bolla messaggio identica alla chat: utente a destra, AI a sinistra con avatar e azioni. */
const DemoMessage = ({ message, lang, isLastAssistant, onRegenerate }: DemoMessageProps) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const displayContent = isUser ? message.content : stripThinking(message.content);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(displayContent);
    } catch {
      // clipboard non disponibile
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`flex w-full gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/semplycode.png" alt="Semplycode AI" className="w-full h-full object-cover" />
        </div>
      )}
      <div
        className={`${isUser ? "max-w-[85%]" : "flex-1 min-w-0"} rounded-2xl ${isUser
          ? "bg-primary/20 border border-primary/30 text-gray-100 px-4 py-3"
          : "bg-[#061014]/90 border border-emerald-900/25 text-gray-300 px-5 py-4"
          }`}
      >
        {!isUser && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
              Semplycode AI
            </p>
          </div>
        )}
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
            {message.content}
          </p>
        ) : (
          <>
            <DemoAIResponse content={displayContent} lang={lang} />
            {displayContent && (
              <div className="flex items-center gap-1 mt-3 pt-2 border-t border-emerald-900/15">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 hover:text-primary rounded-md hover:bg-emerald-900/15 transition-all"
                  title={lang === "en" ? "Copy answer" : "Copia risposta"}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? (lang === "en" ? "Copied" : "Copiato") : (lang === "en" ? "Copy" : "Copia")}
                </button>
                {isLastAssistant && onRegenerate && (
                  <button
                    type="button"
                    onClick={onRegenerate}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 hover:text-emerald-400 rounded-md hover:bg-emerald-900/15 transition-all ml-auto"
                    title={lang === "en" ? "Regenerate" : "Rielabora"}
                  >
                    <RefreshCw size={12} />
                    {lang === "en" ? "Regenerate" : "Rielabora"}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const DEMO_SAMPLE_CODE = `import express, { Request, Response } from 'express';
import cors from 'cors';
import { z } from 'zod';

const app = express();
app.use(cors());
app.use(express.json());

const emailRe = /^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$/i;

const UserSchema = z.object({
  id: z.string().min(3),
  name: z.string().min(2),
  email: z.string().regex(emailRe),
  role: z.enum(['admin', 'user', 'guest']),
});

type User = z.infer<typeof UserSchema>;

class UserStore {
  private users = new Map<string, User>();
  get(id: string) { return this.users.get(id) ?? null; }
  set(u: User) { this.users.set(u.id, u); }
  list() { return Array.from(this.users.values()); }
  remove(id: string) { return this.users.delete(id); }
}

const store = new UserStore();

function roleLabel(role: User['role']) {
  switch (role) {
    case 'admin': return 'Amministratore';
    case 'user': return 'Utente';
    default: return role === 'guest' ? 'Ospite' : 'Sconosciuto';
  }
}

app.get('/api/users/:id', (req: Request, res: Response) => {
  const user = store.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const label = roleLabel(user.role);
  return res.json({ ...user, label });
});

app.post('/api/users', (req: Request, res: Response) => {
  const parsed = UserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const exists = store.get(parsed.data.id);
  const msg = exists ? 'Aggiornato' : 'Creato';
  store.set(parsed.data);
  return res.status(exists ? 200 : 201).json({ message: msg, user: parsed.data });
});

for (const u of store.list()) {
  console.log(\`\${u.id}: \${u.email} -> \${roleLabel(u.role)}\`);
}

app.listen(3000, () => console.log('API pronta su :3000'));`;

const DEMO_SAMPLE_REPORT = `### Errori Trovati
- **Riga 9 — Regex email:** pattern ok ma manca ancoraggio completo per casi con spazi → usa \`trim()\` prima del test
- **Riga 31-35 — Switch con ternario nel default:** funziona ma poco leggibile; meglio estrarre \`isGuest\` o aggiungere \`case 'guest'\` esplicito
- **Riga 54-56 — Loop su store vuoto:** a freddo \`store.list()\` è vuoto, il log non mostra nulla — utile solo dopo seed

### Spiegazione
Il codice è già valido; gli errori sono minori di stile/robustezza. La citazione riga è precisa perché il file supera 50 righe (verifica riga 31 e 54 citate correttamente). La regex è testata con \`re.test ? trim : null\` e lo switch usa \`? :\` nel default.

### Codice Corretto (solo fix minimi)
\`\`\`typescript
function roleLabel(role: User['role']) {
  switch (role) {
    case 'admin': return 'Amministratore';
    case 'user': return 'Utente';
    case 'guest': return 'Ospite';
    default: return 'Sconosciuto';
  }
}
\`\`\`

### Revisione — Miglioramenti
1. **Chiarezza** — rimpiazza ternario nel default con case esplicito
2. **Validazione** — normalizza email con \`email.trim().toLowerCase()\` prima di \`regex.test\`
3. **Seed** — aggiungi utenti di esempio prima del loop riga 54 per test visivo`;

const DEMO_SAMPLE_REPORT_EN = `### Errors Found
- **Line 9 — Email regex:** pattern ok but missing full anchoring for cases with spaces → use \`trim()\` before testing
- **Line 31-35 — Switch with ternary in default:** works but hard to read; better to extract \`isGuest\` or add an explicit \`case 'guest'\`
- **Line 54-56 — Loop over empty store:** cold \`store.list()\` is empty, the log shows nothing — only useful after seeding

### Explanation
The code is already valid; the issues are minor style/robustness points. The line citation is precise because the file exceeds 50 lines (check lines 31 and 54 cited correctly). The regex is tested with \`re.test ? trim : null\` and the switch uses \`? :\` in the default.

### Corrected Code (minimal fixes only)
\`\`\`typescript
function roleLabel(role: User['role']) {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'user': return 'User';
    case 'guest': return 'Guest';
    default: return 'Unknown';
  }
}
\`\`\`

### Revision — Improvements
1. **Clarity** — replace the ternary in the default with an explicit case
2. **Validation** — normalize email with \`email.trim().toLowerCase()\` before \`regex.test\`
3. **Seed** — add sample users before the line 54 loop for a visual test`;

const DemoSection = () => {
  const { user: session } = useSupabaseSession();
  const { language: uiLang } = useLanguage();
  const sampleReport = uiLang === "en" ? DEMO_SAMPLE_REPORT_EN : DEMO_SAMPLE_REPORT;
  const t = {
    it: {
      title: "Analizzatore Codice Live",
      subtitle: "Analisi AI in Tempo Reale",
      analyzing: "Analizzando...",
      newTitle: "Nuova Analisi",
      newLabel: "Nuova",
      clearAll: "Cancella tutto",
      editorPlaceholder: "// Incolla qui il tuo codice per l'analisi immediata...",
      emptyTitle: "Inizia la tua Analisi",
      emptyBodyA: "Incolla un frammento di codice per ricevere un report completo dall'",
      analyzingStatus: "Analisi del codice in corso…",
      creditsOut: "Crediti esauriti",
      limitGuestMsg: "Hai esaurito le analisi ospite. Crea un account gratuito per 10 analisi al giorno.",
      limitPlanMsg: "Hai esaurito i token mensili. Fai l'upgrade per continuare ad analizzare.",
      createAccount: "Crea account gratuito",
      seePlans: "Vedi i piani",
      upgrade: "Fai l'upgrade",
      close: "Chiudi",
      askPlaceholder: "Chiedi all'AI qualsiasi cosa sul codice...",
      modeLabel: "Modalità di analisi",
      attachFile: "Allega file",
      uploadFolder: "Carica una cartella o un intero progetto",
      folderLabel: "Carica cartella",
      zipLabel: "Carica archivio ZIP",
      githubLabel: "Importa da GitHub",
      sendLabel: "Invia messaggio",
      importBtn: "Importa",
      removePrefix: "Rimuovi",
      hintA: "Invio con Enter",
      hintB: "Shift+Enter per andare a capo",
      hintC: "L'AI ha sempre il contesto del codice corrente",
      tryChat: "Prova Chat AI",
      freeExtra: "\n\nCrea un account gratuito su semplycode per 10 analisi al giorno.",
    },
    en: {
      title: "Live Code Analyzer",
      subtitle: "Real-Time AI Analysis",
      analyzing: "Analyzing...",
      newTitle: "New Analysis",
      newLabel: "New",
      clearAll: "Clear all",
      editorPlaceholder: "// Paste your code here for instant analysis...",
      emptyTitle: "Start Your Analysis",
      emptyBodyA: "Paste a code snippet to get a full report from the ",
      analyzingStatus: "Analyzing code…",
      creditsOut: "Credits exhausted",
      limitGuestMsg: "You've used all guest analyses. Create a free account for 10 analyses a day.",
      limitPlanMsg: "You've used all monthly tokens. Upgrade to keep analyzing.",
      createAccount: "Create free account",
      seePlans: "See plans",
      upgrade: "Upgrade",
      close: "Close",
      askPlaceholder: "Ask the AI anything about the code...",
      modeLabel: "Analysis mode",
      attachFile: "Attach file",
      uploadFolder: "Upload a folder or a whole project",
      folderLabel: "Upload folder",
      zipLabel: "Upload ZIP archive",
      githubLabel: "Import from GitHub",
      sendLabel: "Send message",
      importBtn: "Import",
      removePrefix: "Remove",
      hintA: "Enter to send",
      hintB: "Shift+Enter for a new line",
      hintC: "The AI always has the current code context",
      tryChat: "Try Chat AI",
      freeExtra: "\n\nCreate a free semplycode account for 10 analyses a day.",
    },
  }[uiLang];
  const [code, setCode] = useState(DEMO_SAMPLE_CODE);
  const [detectedLang, setDetectedLang] = useState("typescript");
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: sampleReport }]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStartedAt, setLoadingStartedAt] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [analysisType, setAnalysisType] = useState("correction");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [showGithubComposer, setShowGithubComposer] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isZipLoading, setIsZipLoading] = useState(false);
  /** Crediti esauriti: mostra la card con invito a registrarsi / fare upgrade. */
  const [limitCTA, setLimitCTA] = useState<{ message: string; code?: string } | null>(null);
  const typeLabels = getAnalysisTypeLabels(uiLang);
  const typeDescs = getAnalysisTypeDescriptions(uiLang);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  /** Evita che il setCode programmatico (allegati) riattivi clear/debounce dell'onChange. */
  const programmaticCodeRef = useRef(false);

  // Timer dello stato di elaborazione (come in chat) + autoscroll in fondo.
  useEffect(() => {
    if (!isLoading || loadingStartedAt === null) return;
    setElapsedSec(0);
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - (loadingStartedAt as number)) / 1000));
    }, 500);
    return () => clearInterval(timer);
  }, [isLoading, loadingStartedAt]);

  // Autoscroll fluido: segue il fondo solo se l'utente è già in fondo.
  // Durante lo streaming salta istantaneo (niente code di animazioni smooth),
  // a fine risposta scorre morbido una volta sola.
  useEffect(() => {
    const container = messagesScrollRef.current;
    if (!container || !isNearBottom) return;
    if (isLoading) {
      container.scrollTop = container.scrollHeight;
    } else {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isLoading, isNearBottom]);

  const detectLanguage = (codeSnippet: string): string => {
    const trimmed = codeSnippet.trim();
    if (!trimmed) return "";

    if (/fun\s+\w+\s*\(|val\s+\w+\s*:|var\s+\w+\s*:/.test(trimmed))
      return "kotlin";

    if (
      /:\s*(string|number|boolean|any|void|never|unknown)\s*[=;)]/i.test(
        trimmed,
      ) ||
      /interface\s+\w+/.test(trimmed) ||
      /\bimport\s+type\s+/.test(trimmed) ||
      (/<\w+>/.test(trimmed) && /(?<!:):\s*\w+/.test(trimmed))
    )
      return "typescript";

    if (/^\s*[{\[]/.test(trimmed) && /[}\]]\s*$/.test(trimmed)) {
      try {
        JSON.parse(trimmed);
        return "json";
      } catch {}
    }

    if (/^\s*<\?xml|<\w+:\w+\s+/.test(trimmed)) return "xml";
    if (/^\s*<\/?[a-zA-Z]+[^>]*>/.test(trimmed)) return "markup";

    if (/^\s*#!/.test(trimmed) && /bash|sh|env/.test(trimmed)) return "shell";

    if (
      /\bpackage\s+\w+;|System\.out\.println\(|public\s+static\s+void\s+main/.test(
        trimmed,
      )
    )
      return "java";
    if (
      /#include\s*<(iostream|vector|string|map|algorithm|bits\/)|std::|template\s*<|using\s+namespace\s+\w+;/.test(
        trimmed,
      )
    )
      return "cpp";
    if (
      /#include\s*<[a-z0-9]+\.h>|printf\s*\(|scanf\s*\(|int\s+main\s*\(/.test(
        trimmed,
      )
    )
      return "c";
    if (
      /using\s+System;|namespace\s+\w+;|Console\.WriteLine\(|public\s+class\s+/i.test(
        trimmed,
      )
    )
      return "csharp";
    if (/func\s+\w+\s*\(|fmt\.|:=/.test(trimmed)) return "go";

    if (
      /\bimport\s+[^;\n]*?\s+from\s+['"]|\brequire\s*\(|\bconst\b|\blet\b|\bvar\s+\w+|=>|\.then\(|async\s+function|\bswitch\s*\(|\bclass\s+\w+\s*\{/.test(
        trimmed,
      )
    )
      return "javascript";

    if (
      /\bdef\s+\w+\s*\([^)]*\)\s*:|\bclass\s+\w+\s*:|\bfrom\s+\w+\s+import|(?<!@)\bimport\s+\w+(?!\s*\()|print\s*\(/.test(
        trimmed,
      )
    )
      return "python";

    if (
      /SELECT\s+.*FROM|INSERT\s+INTO|UPDATE\s+\w+|DELETE\s+FROM|CREATE\s+TABLE/i.test(
        trimmed,
      )
    )
      return "sql";

    if (/\bBEGIN\b.*\bEND\b|\bsub\s+\w+\b|\buse\s+strict;/.test(trimmed))
      return "perl";

    if (
      /^\s*<\?php|\$\w+\s*=/.test(trimmed) ||
      (/function\s+\w+\s*\(.*\)\s*{/.test(trimmed) && /\$\w+/.test(trimmed))
    )
      return "php";

    if (
      /\bdef\s+\w+[\s(][\s\S]*\bend\b|require\s+['"]|attr_(accessor|reader|writer)|puts\s+/.test(
        trimmed,
      )
    )
      return "ruby";

    if (
      /\bfunction\s+\w+\s*\(|\blocal\s+\w+\s*=/.test(trimmed) &&
      /then|do|end/.test(trimmed)
    )
      return "lua";

    if (
      /\bprogram\s+\w+;|begin\s+end\.|\bvar\s+\w+\s*:|:\s*integer\b/i.test(
        trimmed,
      )
    )
      return "pascal";
    if (/^\s*PROGRAM\s+|REAL\s+|INTEGER\s+|END\s+PROGRAM/i.test(trimmed))
      return "fortran";
    if (/^\s*IDENTIFICATION\s+DIVISION\b|DISPLAY\s+|ACCEPT\s+/i.test(trimmed))
      return "cobol";

    if (
      /[.#][\w-]+\s*\{|@media|@keyframes|@import|@font-face|:\s*[^;}]+;/.test(
        trimmed,
      )
    )
      return "css";

    if (/^\s*---\s*\n|^#\s+\w+/.test(trimmed)) return "markdown";

    return "";
  };

  const getLanguageExtension = (lang: string) => {
    switch (lang) {
      case "python":
        return python();
      case "css":
        return css();
      case "markup":
        return html();
      case "json":
        return json();
      case "rust":
        return rust();
      case "go":
        return go();
      case "php":
        return php();
      case "sql":
        return sql();
      case "typescript":
        return javascript({ typescript: true });
      case "javascript":
        return javascript();
      case "java":
        return StreamLanguage.define(java as any);
      case "c":
        return StreamLanguage.define(c as any);
      case "cpp":
        return StreamLanguage.define(cpp as any);
      case "csharp":
        return StreamLanguage.define(csharp as any);
      case "kotlin":
        return StreamLanguage.define(kotlin as any);
      case "swift":
        return StreamLanguage.define(swift as any);
      case "ruby":
        return StreamLanguage.define(ruby as any);
      case "perl":
        return StreamLanguage.define(perl as any);
      case "lua":
        return StreamLanguage.define(lua as any);
      case "pascal":
        return StreamLanguage.define(pascal as any);
      case "shell":
        return StreamLanguage.define(shell as any);
      case "fortran":
        return StreamLanguage.define(fortran as any);
      case "cobol":
        return StreamLanguage.define(cobol as any);
      case "xml":
        return html();
      case "markdown":
        return javascript();
      default:
        return [];
    }
  };

  /** Vero se l'errore è da limite crediti/piano (serve invito a registrarsi o upgrade). */
  const isLimitError = (text: string, code?: string): boolean =>
    code === "GUEST_LIMIT" ||
    code === "PLAN_LIMIT" ||
    /esaurito|limite|piano|upgrade|token mensili|token giornalieri|crea un account|registrati gratuitamente/i.test(text || "");

  /** Vero se il limite riguarda un ospite (invito a creare account, non upgrade). */
  const isGuestLimit = (text: string, code?: string): boolean =>
    code === "GUEST_LIMIT" || /ospite|account gratuito|registrati/i.test(text || "");

  const performAutoAnalysis = async (currentCode: string) => {
    if (!currentCode.trim() || currentCode.length < 10) return;

    setHasInteracted(true);
    setLimitCTA(null);
    setIsLoading(true);
    setLoadingStartedAt(Date.now());
    setElapsedSec(0);
    // Placeholder come in chat: lo streaming lo riempie progressivamente.
    setMessages([
      { role: "assistant", content: "" },
    ]);

    let accumulatedContent = "";

    try {
      const lineCount = currentCode.split("\n").length;
      const systemPrompt =
        buildAnalysisSystemPrompt({
          analysisType,
          lang: detectedLang || "javascript",
          needsLineRefs: lineCount > 50,
          hasErrorContext: false,
        }) +
        "\nNon mostrare mai il tuo ragionamento interno e non usare tag <think>: restituisci solo la risposta finale.";
      const typeLabel = typeLabels[analysisType] || analysisType;
      await postChatStream(
        [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: uiLang === "en"
              ? `Analyze this code (${typeLabel} mode):\n\n\`\`\`${detectedLang || ""}\n${currentCode}\n\`\`\``
              : `Analizza questo codice (modalità ${typeLabel}):\n\n\`\`\`${detectedLang || ""}\n${currentCode}\n\`\`\``,
          },
        ],
        (chunk) => {
          accumulatedContent += chunk;
          const visible = stripThinking(accumulatedContent);
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: visible };
            }
            return next;
          });
        },
        (fullContent) => {
          const cleaned = stripThinking(fullContent);
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: cleaned };
            }
            return next;
          });
          setIsLoading(false);
          setLoadingStartedAt(null);
          window.dispatchEvent(new Event("semplycode:stats:refresh"));
        },
        (error, code) => {
          const msg = `**${error}**`;
          if (isLimitError(error, code)) {
            setLimitCTA({ message: error, code });
          }
          setMessages([
            {
              role: "assistant",
              content: msg,
            },
          ]);
          setIsLoading(false);
          setLoadingStartedAt(null);
        },
        { analysisType },
      );
    } catch (error) {
      const err = error as ErrorWithStatus;
      const msg = formatApiError(err as Error);
      const extra = err?.status === 429 ? t.freeExtra : "";
      if (err?.status === 429 || isLimitError(msg, err?.code)) {
        setLimitCTA({ message: `${msg}${extra}`, code: err?.code });
      }
      setMessages([
        {
          role: "assistant",
          content: `**${msg}**${extra}`,
        },
      ]);
      setIsLoading(false);
      setLoadingStartedAt(null);
    }
  };

  /** Domanda libera dell'utente sul codice corrente — stesso input della chat. */
  const sendChatMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;
    if (!code.trim()) return;

    const newUserMessage: Message = { role: "user", content: userMessage.trim() };
    const updatedMessages = [...messages, newUserMessage];
    setMessages([...updatedMessages, { role: "assistant", content: "" }]);
    setChatInput("");
    setHasInteracted(true);
    setLimitCTA(null);
    setIsLoading(true);
    setLoadingStartedAt(Date.now());
    setElapsedSec(0);

    let accumulatedContent = "";

    try {
      const typeLabel = typeLabels[analysisType] || analysisType;
      await postChatStream(
        [
          {
            role: "system",
            content: `Sei un esperto Code Reviewer italiano in modalità ${typeLabel}. Rispondi sempre nella stessa lingua del messaggio dell'utente (italiano o inglese), in modo chiaro e utile. ${REVIEWER_DEPTH_RULES} Il codice corrente${detectedLang ? ` (${detectedLang})` : ""} è:\n\n\`\`\`${detectedLang || ""}\n${code}\n\`\`\`\nNon mostrare mai il tuo ragionamento interno e non usare tag <think>: restituisci solo la risposta finale.`,
          },
          ...updatedMessages,
        ],
        (chunk) => {
          accumulatedContent += chunk;
          const visible = stripThinking(accumulatedContent);
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: visible };
            }
            return next;
          });
        },
        (fullContent) => {
          const cleaned = stripThinking(fullContent);
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: cleaned };
            }
            return next;
          });
          setIsLoading(false);
          setLoadingStartedAt(null);
          window.dispatchEvent(new Event("semplycode:stats:refresh"));
        },
        (error, code) => {
          const errText = typeof error === "string" ? error : formatApiError(error as Error);
          if (isLimitError(errText, code)) {
            setLimitCTA({ message: errText, code });
          }
          setMessages((prev) => {
            const withError = [...prev];
            const last = withError[withError.length - 1];
            if (last?.role === "assistant" && !last.content) {
              withError[withError.length - 1] = { role: "assistant", content: `**${errText}**` };
            }
            return withError;
          });
          setIsLoading(false);
          setLoadingStartedAt(null);
        },
        { analysisType },
      );
    } catch (error) {
      const err = error as ErrorWithStatus;
      const errText = formatApiError(err as Error);
      if (err?.status === 429 || isLimitError(errText, err?.code)) {
        setLimitCTA({ message: errText, code: err?.code });
      }
      setMessages([...updatedMessages, { role: "assistant", content: `**${errText}**` }]);
      setIsLoading(false);
      setLoadingStartedAt(null);
    }
  };

  const performAutoAnalysisRef = useRef(performAutoAnalysis);
  useEffect(() => {
    performAutoAnalysisRef.current = performAutoAnalysis;
  });

  /** Applica gli allegati all'editor singolo: li combina e avvia l'analisi. */
  const applyAttachments = (fileData: FileInfo[]) => {
    if (!fileData?.length) return;
    const combined = fileData
      .map((f) => `// ========== ${f.path ?? f.name} (${f.language}) ==========\n${f.content.trim()}`)
      .join("\n\n");
    const lang = fileData.length === 1 ? fileData[0].language : detectLanguage(combined) || "javascript";
    programmaticCodeRef.current = true;
    setUploadedFiles(fileData);
    setCode(combined);
    setDetectedLang(lang);
    setHasInteracted(true);
    performAutoAnalysisRef.current?.(combined);
  };

  const handleCodeFiles = (incomingFiles: File[]) => {
    const seen = new Set(uploadedFiles.map((f) => f.path ?? f.name));
    const validFiles: { file: File; displayPath: string }[] = [];
    const sorted = [...incomingFiles].sort((a, b) =>
      (a.name || "").localeCompare(b.name || ""),
    );
    for (const file of sorted) {
      if (uploadedFiles.length + validFiles.length >= MAX_DEMO_FILES) break;
      const displayPath =
        (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      const ext = (displayPath.split(".").pop() || "").toLowerCase();
      if (!ALLOWED_CODE_EXTENSIONS.includes(ext)) continue;
      if (file.size > MAX_DEMO_FILE_SIZE) continue;
      if (seen.has(displayPath)) continue;
      seen.add(displayPath);
      validFiles.push({ file, displayPath });
    }
    if (validFiles.length === 0) return;
    Promise.all<FileInfo>(
      validFiles.map(
        ({ file, displayPath }) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
              const base = displayPath.split("/").pop() || displayPath;
              resolve({
                name: base,
                path: displayPath,
                content: String(e.target?.result ?? ""),
                language: detectLanguageFromFilename(displayPath),
              });
            };
            reader.onerror = () => reject(new Error(`Lettura fallita: ${displayPath}`));
            reader.readAsText(file);
          }),
      ),
    )
      .then((fileData) => {
        applyAttachments([...uploadedFiles, ...fileData].slice(0, MAX_DEMO_FILES));
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const removeAttachment = (index: number) => {
    const next = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(next);
    if (next.length === 0) {
      programmaticCodeRef.current = true;
      setCode("");
      setDetectedLang("");
      setMessages([]);
      return;
    }
    applyAttachments(next);
  };

  const handleZipUpload = async (file: File) => {
    if (!file) return;
    setIsZipLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/files/extract-zip", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      applyAttachments(data.files);
    } catch (e) {
      console.error("Errore lettura ZIP.", e);
    } finally {
      setIsZipLoading(false);
    }
  };

  const importFromGitHub = async () => {
    if (!githubUrl.trim()) return;
    setIsGithubLoading(true);
    try {
      const res = await fetch("/api/github/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: githubUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      applyAttachments([
        {
          name: data.name,
          content: data.content,
          language: detectLanguageFromFilename(data.name),
        },
      ]);
      setGithubUrl("");
      setShowGithubComposer(false);
    } catch (e) {
      console.error("Errore import GitHub.", e);
    } finally {
      setIsGithubLoading(false);
    }
  };

  const debouncedAnalysis = useCallback(
    debounce((nextCode: string) => performAutoAnalysisRef.current?.(nextCode), 1500),
    [],
  );

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (value.trim()) {
      setHasInteracted(true);
      const lang = detectLanguage(value);
      setDetectedLang(lang);
    } else {
      setDetectedLang("");
      setMessages([]);
    }
  };

  useEffect(() => {
    const key = session?.email
      ? `demo_code:v2:${session.email}`
      : `demo_code:v2:anon`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        setCode(saved);
        const lang = detectLanguage(saved);
        setDetectedLang(lang);
        // se il saved è vecchio esempio corto, forza il nuovo lungo
        if (saved.trim().split("\n").length < 50) {
          setCode(DEMO_SAMPLE_CODE);
          setDetectedLang("typescript");
          setMessages([{ role: "assistant", content: sampleReport }]);
        }
      } else {
        // nessun saved → assicurati che il nuovo esempio lungo sia visibile
        setCode(DEMO_SAMPLE_CODE);
        setDetectedLang("typescript");
        setMessages([{ role: "assistant", content: sampleReport }]);
      }
    } catch {
      // ignore
    }
  }, [session]);

  useEffect(() => {
    const key = session?.email
      ? `demo_code:v2:${session.email}`
      : `demo_code:v2:anon`;
    try {
      if (code !== undefined) localStorage.setItem(key, code);
    } catch {
      // ignore
    }
  }, [code, session]);

  const handleNewAnalysis = async () => {
    programmaticCodeRef.current = true;
    setCode("");
    setMessages([]);
    setDetectedLang("");
    setUploadedFiles([]);
    setChatInput("");
    setGithubUrl("");
    setLimitCTA(null);
    setShowGithubComposer(false);

    if (session) {
      try {
        await fetch("/api/chat/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [],
            code: "",
            action: "new",
          }),
        });
      } catch {
        console.error("Failed to save new analysis");
      }
    }
  };

  return (
    <>
      <section className="w-full max-w-7xl 2xl:max-w-screen-2xl 3xl:max-w-[1720px] 4xl:max-w-[1920px] mx-auto p-3 sm:p-5 md:p-6 3xl:p-8 bg-white rounded-2xl sm:rounded-3xl border border-[#e2e8f0] shadow-2xl my-8 sm:my-12 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 sm:gap-4 px-1 sm:px-2">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#0f172a]">
              {t.title}
            </h2>
            <p className="text-xs text-[#64748b] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              {t.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isLoading && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3.5 py-1.5">
              <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              <span className="text-xs font-medium text-emerald-600">
                {t.analyzing}
              </span>
            </div>
          )}

          {(code || messages.length > 0) && (
            <>
              <button
                onClick={handleNewAnalysis}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors text-xs font-medium"
                title={t.newTitle}
              >
                <Plus className="w-3.5 h-3.5" />
                {t.newLabel}
              </button>
              <button
                onClick={() => {
                  programmaticCodeRef.current = true;
                  setCode("");
                  setMessages([]);
                  setUploadedFiles([]);
                  setLimitCTA(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors text-xs font-medium"
                title={t.clearAll}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <motion.div layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-h-[380px] xs:min-h-[440px] lg:min-h-[580px] 2xl:min-h-[660px] 3xl:min-h-[720px]">
        <motion.div layout transition={{ type: "spring", stiffness: 260, damping: 28 }} className={`flex flex-col min-h-[300px] lg:min-h-0 bg-[#f8fafc] backdrop-blur-md border border-[#e2e8f0] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm transition-all duration-300 hover:border-emerald-300 ${!hasInteracted && !code.trim() ? "lg:col-span-2 max-w-2xl w-full mx-auto" : ""}`}>
          <div className="flex items-center gap-2.5 px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-[#e2e8f0]">
            <Code2 className="text-primary w-4 h-4" />
            {detectedLang ? (
              <span className="text-[11px] font-bold text-[#64748b] font-mono uppercase tracking-widest">
                {detectedLang === "unrecognized" ? "code" : detectedLang}
              </span>
            ) : null}
          </div>

          <div className="flex-1 min-h-0 max-h-[720px] font-mono text-sm overflow-auto demo-scroll">
            <CodeMirror
              value={code}
              onChange={(val: string) => {
                // setCode programmatico dagli allegati: salta clear/debounce (già gestiti).
                if (programmaticCodeRef.current) {
                  programmaticCodeRef.current = false;
                  setCode(val);
                  return;
                }
                if (uploadedFiles.length > 0) setUploadedFiles([]);
                if (val.trim()) {
                  const lang = detectLanguage(val);
                  setDetectedLang(lang);
                } else {
                  setDetectedLang("");
                  setMessages([]);
                }
                setCode(val);
                if (val.trim().length > 10) {
                  debouncedAnalysis(val);
                }
              }}
              extensions={[
                getLanguageExtension(detectedLang),
                EditorView.lineWrapping,
                EditorView.theme({
                  "&": { maxHeight: "720px" },
                  ".cm-scroller": { overflow: "auto", maxHeight: "720px" },
                  ".cm-content": { minHeight: "0" },
                }),
              ]}
              theme={oneDark}
              placeholder={t.editorPlaceholder}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightSpecialChars: true,
                foldGutter: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                rectangularSelection: true,
                crosshairCursor: false,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
                closeBracketsKeymap: true,
                defaultKeymap: true,
                searchKeymap: true,
                historyKeymap: true,
                foldKeymap: true,
                completionKeymap: true,
                lintKeymap: true,
              }}
              style={{ fontSize: 14, height: "100%", maxHeight: "720px" }}
              className="h-full max-h-[720px]"
            />
          </div>
        </motion.div>

        <div className="flex flex-col bg-[#f8fafc] backdrop-blur-md border border-[#e2e8f0] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm relative min-h-[300px] lg:min-h-0">
          <div className="flex items-center gap-2.5 px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-[#e2e8f0]">
            <MessageSquare className="text-emerald-600 w-4 h-4" />
            <span className="text-[11px] font-bold text-[#64748b] font-mono tracking-widest uppercase">
              Report
            </span>
          </div>

          <div
            ref={messagesScrollRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              setIsNearBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 200);
            }}
            className="flex-1 overflow-y-auto p-4 sm:p-5 pb-52 bg-[#0f172a] max-h-[720px] demo-scroll"
          >
            {messages.length === 0 && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-5">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200 shadow-inner">
                  <Sparkles className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-[#e2e8f0]">
                    {t.emptyTitle}
                  </p>
                  <p className="text-sm text-[#94a3b8] max-w-70 leading-relaxed mx-auto">
                    {t.emptyBodyA}
                    <span className="text-primary font-bold">AI Engine</span>.
                  </p>
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div className="flex flex-col gap-4 pb-2">
                {messages.map((msg, i) => {
                  // Placeholder vuoto in attesa del primo chunk di streaming:
                  // non renderizzare la bolla, mostra solo lo status qui sotto.
                  if (msg.role === "assistant" && !stripThinking(msg.content).trim()) {
                    return null;
                  }
                  const isLast = i === messages.length - 1;
                  return (
                    <DemoMessage
                      key={`${msg.role}-${i}`}
                      message={msg}
                      lang={uiLang}
                      isLastAssistant={isLast && msg.role === "assistant"}
                      onRegenerate={
                        isLast && msg.role === "assistant" && !isLoading
                          ? () => performAutoAnalysis(code)
                          : undefined
                      }
                    />
                  );
                })}

                {(() => {
                  const lastMsg = messages[messages.length - 1];
                  const isStreamingContent =
                    !!lastMsg &&
                    lastMsg.role === "assistant" &&
                    stripThinking(lastMsg.content).trim().length > 0;
                  // Status con timer solo prima che lo streaming produca contenuto (come in chat).
                  if (!isLoading || isStreamingContent) return null;
                  return (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3 bg-[#061014]/90 border border-emerald-900/25">
                        <Loader2 size={15} className="animate-spin text-primary shrink-0" />
                        <span className="text-xs text-gray-300">
                          {t.analyzingStatus}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 tabular-nums">
                          {elapsedSec}s
                        </span>
                      </div>
                    </div>
                  );
                })()}
                {limitCTA && !isLoading && (
                  <div className="flex justify-start">
                    <div className="flex-1 min-w-0 rounded-2xl bg-[#061014]/90 border border-amber-500/30 px-5 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">
                        {t.creditsOut}
                      </p>
                      <p className="text-sm text-gray-300 leading-relaxed mb-4">
                        {uiLang === "en"
                          ? (isGuestLimit(limitCTA.message, limitCTA.code) ? t.limitGuestMsg : t.limitPlanMsg)
                          : limitCTA.message}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {isGuestLimit(limitCTA.message, limitCTA.code) ? (
                          <>
                            <Link
                              href="/register"
                              className="flex-1 text-center py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
                            >
                              {t.createAccount}
                            </Link>
                            <Link
                              href="/#pricing"
                              className="flex-1 text-center py-2.5 rounded-xl border border-emerald-900/30 text-gray-300 text-sm hover:text-primary hover:border-primary/40 transition-colors"
                            >
                              {t.seePlans}
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              href="/#pricing"
                              className="flex-1 text-center py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
                            >
                              {t.upgrade}
                            </Link>
                            <button
                              type="button"
                              onClick={() => setLimitCTA(null)}
                              className="flex-1 py-2.5 rounded-xl border border-emerald-900/30 text-gray-400 text-sm hover:text-primary transition-colors"
                            >
                              {t.close}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input flottante dentro lo spazio chat: vetro trasparente, non aumenta l'altezza della demo */}
          <div className="absolute bottom-0 inset-x-0 z-10 p-2.5 sm:p-4 bg-transparent rounded-b-2xl sm:rounded-b-3xl">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.go,.rs,.php,.sql,.css,.html,.json"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const selected = Array.from(e.target.files || []);
                handleCodeFiles(selected);
                e.target.value = "";
              }}
            />
            <input
              ref={folderInputRef}
              type="file"
              className="hidden"
              {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const selected = Array.from(e.target.files || []);
                handleCodeFiles(selected);
                e.target.value = "";
              }}
            />
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const f = e.target.files?.[0];
                if (f) handleZipUpload(f);
                e.target.value = "";
              }}
            />
            {/* Box stile AI Mode: vetro flottante con profondità 3D, niente bordi verdi in focus */}
            <div className="rounded-2xl border border-emerald-900/30 bg-[#0d1117]/60 backdrop-blur-xl ring-1 ring-white/10 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8),0_2px_6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]">
              <textarea
                value={chatInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setChatInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage(chatInput);
                  }
                }}
                rows={2}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
                }}
                placeholder={t.askPlaceholder}
                className="w-full bg-transparent px-4 pt-3 pb-1 text-sm text-white placeholder:text-gray-500 focus:outline-none resize-none max-h-[140px] demo-scroll"
                disabled={isLoading || !code.trim()}
              />
              <div className="flex items-center gap-1 px-2.5 pb-2.5">
                <select
                  value={analysisType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    if (e.target.value) setAnalysisType(e.target.value);
                  }}
                  title={t.modeLabel}
                  aria-label={t.modeLabel}
                >
                  {(['correction', 'revision', 'creation', 'security', 'performance', 'style', 'debug'] as const).map((m) => (
                    <option key={m} value={m} title={typeDescs[m]}>
                      {typeLabels[m]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title={t.attachFile}
                  aria-label={t.attachFile}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-primary hover:bg-emerald-900/20 transition-colors shrink-0"
                >
                  <FileText size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  title={t.uploadFolder}
                  aria-label={t.folderLabel}
                  className="w-8 h-8 rounded-full hidden xs:flex items-center justify-center text-gray-500 hover:text-primary hover:bg-emerald-900/20 transition-colors shrink-0"
                >
                  <FolderPlus size={15} />
                </button>
                <button
                  type="button"
                  disabled={isZipLoading}
                  onClick={() => zipInputRef.current?.click()}
                  title={t.zipLabel}
                  aria-label={t.zipLabel}
                  className="w-8 h-8 rounded-full hidden xs:flex items-center justify-center text-gray-500 hover:text-primary hover:bg-emerald-900/20 transition-colors shrink-0 disabled:opacity-50"
                >
                  <Archive size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowGithubComposer((v) => !v)}
                  aria-expanded={showGithubComposer}
                  title={t.githubLabel}
                  aria-label={t.githubLabel}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${showGithubComposer ? "text-primary bg-primary/10" : "text-gray-500 hover:text-primary hover:bg-emerald-900/20"}`}
                >
                  <Github size={15} />
                </button>
                {uploadedFiles.length > 0 && (
                  <span className="text-[10px] text-primary font-mono ml-0.5">
                    {uploadedFiles.length}/{MAX_DEMO_FILES}
                  </span>
                )}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => sendChatMessage(chatInput)}
                  disabled={!chatInput.trim() || isLoading || !code.trim()}
                  aria-label={t.sendLabel}
                  className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
            {showGithubComposer && (
              <div className="flex gap-2 mt-2">
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGithubUrl(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      importFromGitHub();
                    }
                  }}
                  placeholder="https://github.com/.../blob/main/file.js"
                  className="flex-1 bg-[#010409]/80 backdrop-blur border border-emerald-900/30 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isGithubLoading || !githubUrl.trim()}
                  onClick={importFromGitHub}
                  className="px-3 py-2 text-xs font-semibold bg-primary/20 text-primary rounded-xl hover:bg-primary/30 disabled:opacity-50"
                >
                  {isGithubLoading ? "…" : t.importBtn}
                </button>
              </div>
            )}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {uploadedFiles.map((file, index) => (
                  <span
                    key={`${file.path ?? file.name}-${index}`}
                    title={file.path ?? file.name}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-[#061014] border border-emerald-900/30 text-[11px] text-gray-300"
                  >
                    <FileText size={11} className="text-primary/70" />
                    <span className="max-w-[200px] truncate">{file.path ?? file.name}</span>
                    <button
                      type="button"
                      aria-label={`${t.removePrefix} ${file.path ?? file.name}`}
                      onClick={() => removeAttachment(index)}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-[10px] text-gray-600 mt-1.5 text-center">
              {t.hintA} &middot; {t.hintB} &middot; {t.hintC}
            </p>
          </div>
        </div>
      </motion.div>
      <style jsx global>{`
        .demo-scroll {
          scrollbar-width: thin;
          scrollbar-color: #064e3b transparent;
        }
        .demo-scroll::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .demo-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .demo-scroll::-webkit-scrollbar-thumb {
          background: #064e3b;
          border-radius: 8px;
        }
        .demo-scroll::-webkit-scrollbar-thumb:hover {
          background: #065f46;
        }
        .demo-scroll .cm-scroller::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .demo-scroll .cm-scroller::-webkit-scrollbar-thumb {
          background: #064e3b;
          border-radius: 8px;
        }
        .text-shadow-glow {
          text-shadow: 0 0 10px rgba(6, 78, 59, 0.5);
        }
      `}</style>
      </section>
      <div className="flex justify-center mt-6 sm:mt-8">
        <Link
          href="/chat"
          className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:brightness-105 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-visible"
        >
          <Sparkles size={16} className="group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
          {t.tryChat}
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
          <span className="pointer-events-none absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md shadow-white/30 group-hover:animate-ping" />
          <span className="pointer-events-none absolute -bottom-1.5 -left-2 w-2 h-2 rounded-full bg-emerald-200 opacity-0 group-hover:opacity-100 transition-opacity delay-75 shadow-sm group-hover:animate-ping" />
          <span className="pointer-events-none absolute top-1/2 -right-3.5 w-1.5 h-1.5 rounded-full bg-teal-200 opacity-0 group-hover:opacity-100 transition-opacity delay-100 shadow-sm group-hover:animate-ping" />
          <span className="pointer-events-none absolute -top-2 left-1/2 w-1.5 h-1.5 rounded-full bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity delay-150 shadow-sm group-hover:animate-ping" />
        </Link>
      </div>
    </>
  );
};

export default DemoSection;
