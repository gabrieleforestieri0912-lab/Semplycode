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
import { Plus, Trash2, Play } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { postChatStream, formatApiError } from "@/lib/playgroundApi";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FileInfo {
  name: string;
  content: string;
  language: string;
}

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
const DemoAIResponse = ({ content }: { content: string }) => {
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
            const lang = match?.[1] || "codice";
            const raw = Array.isArray(children)
              ? children.join("")
              : String(children ?? "").replace(/\n$/, "");
            return (
              <div className="my-4 w-full rounded-xl overflow-hidden border border-emerald-800/40 bg-[#010409]">
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-950/60 border-b border-emerald-900/30">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
                    {lang}
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
                    Copia
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto m-0 custom-scrollbar">
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
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
}

/** Bolla messaggio identica alla chat: utente a destra, AI a sinistra con avatar e azioni. */
const DemoMessage = ({ message, isLastAssistant, onRegenerate }: DemoMessageProps) => {
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
            <DemoAIResponse content={displayContent} />
            {displayContent && (
              <div className="flex items-center gap-1 mt-3 pt-2 border-t border-emerald-900/15">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 hover:text-primary rounded-md hover:bg-emerald-900/15 transition-all"
                  title="Copia risposta"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copiato" : "Copia"}
                </button>
                {isLastAssistant && onRegenerate && (
                  <button
                    type="button"
                    onClick={onRegenerate}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 hover:text-emerald-400 rounded-md hover:bg-emerald-900/15 transition-all ml-auto"
                    title="Rielabora"
                  >
                    <RefreshCw size={12} />
                    Rielabora
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

const DemoSection = () => {
  const [code, setCode] = useState(DEMO_SAMPLE_CODE);
  const [detectedLang, setDetectedLang] = useState("typescript");
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: DEMO_SAMPLE_REPORT }]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStartedAt, setLoadingStartedAt] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [mode, setMode] = useState<"correction" | "revision" | "creation">("correction");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const { user: session } = useSupabaseSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Timer dello stato di elaborazione (come in chat) + autoscroll in fondo.
  useEffect(() => {
    if (!isLoading || loadingStartedAt === null) return;
    setElapsedSec(0);
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - (loadingStartedAt as number)) / 1000));
    }, 500);
    return () => clearInterval(timer);
  }, [isLoading, loadingStartedAt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isLoading]);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [isButtonHovering, setIsButtonHovering] = useState(false);

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

  const performAutoAnalysis = async (currentCode: string) => {
    if (!currentCode.trim() || currentCode.length < 10) return;

    setHasInteracted(true);
    setIsLoading(true);
    setLoadingStartedAt(Date.now());
    setElapsedSec(0);
    // Placeholder come in chat: lo streaming lo riempie progressivamente.
    setMessages([
      { role: "assistant", content: "" },
    ]);

    let accumulatedContent = "";

    try {
      const systemPrompt =
        mode === "creation"
          ? `Sei un tutor italiano in modalità CREAZIONE: guida passo-passo la costruzione del progetto da zero${detectedLang ? ` in ${detectedLang}` : ""}. Prerequisiti, struttura cartelle, ogni passo con comandi e snippet, fino a progetto funzionante.`
          : mode === "revision"
            ? `Sei un esperto Senior Developer in modalità REVISIONE: correggi e ottimizza il codice${detectedLang ? ` in ${detectedLang}` : ""} (naming, DRY, leggibilità, performance, sicurezza). Usa Markdown con sezioni Errori, Codice revisionato, Miglioramenti, Best practice.`
            : `Sei un esperto Senior Developer in modalità CORREZIONE: correggi SOLO errori sintattici/logici/runtime${detectedLang ? ` in ${detectedLang}` : ""}, mantieni la struttura. Usa Markdown con sezioni Errori, Spiegazione, Codice corretto (solo fix minimi).`;
      await postChatStream(
        [
          {
            role: "system",
            content: `${systemPrompt} Rispondi in italiano. Non mostrare mai il tuo ragionamento interno e non usare tag <think>: restituisci solo la risposta finale.`,
          },
          {
            role: "user",
            content: `Analizza questo codice (modalità ${mode}):\n\n\`\`\`${detectedLang || ""}\n${currentCode}\n\`\`\``,
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
        (error) => {
          setMessages([
            {
              role: "assistant",
              content: `**${error}**`,
            },
          ]);
          setIsLoading(false);
          setLoadingStartedAt(null);
        },
        { analysisType: mode },
      );
    } catch (error) {
      const err = error as ErrorWithStatus;
      const msg = formatApiError(err as Error);
      const extra =
        err?.status === 429
          ? "\n\nCrea un account gratuito su semplycode per 10 analisi al giorno."
          : "";
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
    setIsLoading(true);
    setLoadingStartedAt(Date.now());
    setElapsedSec(0);

    let accumulatedContent = "";

    try {
      const systemPrompt =
        mode === "creation"
          ? `Sei un tutor italiano in modalità CREAZIONE.`
          : mode === "revision"
            ? `Sei un esperto Senior Developer in modalità REVISIONE.`
            : `Sei un esperto Senior Developer in modalità CORREZIONE.`;
      await postChatStream(
        [
          {
            role: "system",
            content: `${systemPrompt} Rispondi in italiano in modo chiaro e utile. Il codice corrente${detectedLang ? ` (${detectedLang})` : ""} è:\n\n\`\`\`${detectedLang || ""}\n${code}\n\`\`\`\nNon mostrare mai il tuo ragionamento interno e non usare tag <think>: restituisci solo la risposta finale.`,
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
        (error) => {
          const err = error as ErrorWithStatus;
          setMessages((prev) => {
            const withError = [...prev];
            const last = withError[withError.length - 1];
            if (last?.role === "assistant" && !last.content) {
              withError[withError.length - 1] = { role: "assistant", content: `**${formatApiError(err as Error)}**` };
            }
            return withError;
          });
          setIsLoading(false);
          setLoadingStartedAt(null);
        },
        { analysisType: mode },
      );
    } catch (error) {
      const err = error as ErrorWithStatus;
      setMessages([...updatedMessages, { role: "assistant", content: `**${formatApiError(err as Error)}**` }]);
      setIsLoading(false);
      setLoadingStartedAt(null);
    }
  };

  const debouncedAnalysis = useCallback(
    debounce((nextCode: string) => performAutoAnalysis(nextCode), 1500),
    [detectedLang],
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
          setMessages([{ role: "assistant", content: DEMO_SAMPLE_REPORT }]);
        }
      } else {
        // nessun saved → assicurati che il nuovo esempio lungo sia visibile
        setCode(DEMO_SAMPLE_CODE);
        setDetectedLang("typescript");
        setMessages([{ role: "assistant", content: DEMO_SAMPLE_REPORT }]);
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
    setCode("");
    setMessages([]);
    setDetectedLang("");

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
              Analizzatore Codice Live
            </h2>
            <p className="text-xs text-[#64748b] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Analisi AI in Tempo Reale
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isLoading && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3.5 py-1.5">
              <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              <span className="text-xs font-medium text-emerald-600">
                Analizzando...
              </span>
            </div>
          )}

          {(code || messages.length > 0) && (
            <>
              <button
                onClick={handleNewAnalysis}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors text-xs font-medium"
                title="Nuova Analisi"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuova
              </button>
              <button
                onClick={() => {
                  setCode("");
                  setMessages([]);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors text-xs font-medium"
                title="Cancella tutto"
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

          <div className="flex-1 min-h-0 max-h-[720px] font-mono text-sm overflow-auto custom-scrollbar">
            <CodeMirror
              value={code}
              onChange={(val: string) => {
                if (val.trim()) {
                  const lang = detectLanguage(val);
                  setDetectedLang(lang);
                } else {
                  setDetectedLang("");
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
              placeholder="// Incolla qui il tuo codice per l'analisi immediata..."
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-[#e2e8f0]">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="text-emerald-600 w-4 h-4" />
              <span className="text-[11px] font-bold text-[#64748b] font-mono tracking-widest uppercase">
                Report
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "correction", label: "Correzione" },
                { id: "revision", label: "Revisione" },
                { id: "creation", label: "Creazione" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as any)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${mode === m.id ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-[#64748b] border-[#e2e8f0] hover:border-emerald-200 hover:text-emerald-600"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#0f172a] max-h-[720px] custom-scrollbar">
            {messages.length === 0 && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-5">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200 shadow-inner">
                  <Sparkles className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-[#e2e8f0]">
                    Inizia la tua Analisi
                  </p>
                  <p className="text-sm text-[#94a3b8] max-w-70 leading-relaxed mx-auto">
                    Incolla un frammento di codice per ricevere un report
                    completo dall&apos;
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
                          Analisi del codice in corso…
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 tabular-nums">
                          {elapsedSec}s
                        </span>
                      </div>
                    </div>
                  );
                })()}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input chat come nella chat: l'utente può fare domande sul codice */}
          <div className="p-2.5 sm:p-4 border-t border-emerald-900/20 bg-[#0a0c10]/80">
            <div className="flex gap-2 items-end">
              <textarea
                value={chatInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setChatInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage(chatInput);
                  }
                }}
                rows={1}
                placeholder="Chiedi all'AI qualsiasi cosa sul codice..."
                className="flex-1 bg-[#010409] border border-emerald-900/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary resize-none max-h-[140px] custom-scrollbar"
                disabled={isLoading || !code.trim()}
              />
              <button
                type="button"
                onClick={() => sendChatMessage(chatInput)}
                disabled={!chatInput.trim() || isLoading || !code.trim()}
                aria-label="Invia messaggio"
                className="flex items-center justify-center w-11 h-11 shrink-0 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-all disabled:scale-95"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-gray-600">
              Prova la chat: chiedi spiegazioni, fix o miglioramenti sul codice a sinistra.
            </p>
          </div>
        </div>
      </motion.div>
      {!isLoading && code.trim() && (
        <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="flex justify-center mt-6">
          <button
            onClick={() => performAutoAnalysis(code)}
            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-md"
          >
            Analizza Codice
          </button>
        </motion.div>
      )}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #064e3b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #065f46;
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
          Prova Chat AI
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
