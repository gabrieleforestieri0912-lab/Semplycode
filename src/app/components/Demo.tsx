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
} from "lucide-react";
import { debounce } from "lodash";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSupabaseSession } from "@/lib/auth";
import { Plus, Trash2, Play } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { postChat, formatApiError } from "@/lib/playgroundApi";

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
  const [mode, setMode] = useState<"correction" | "revision" | "creation">("correction");
  const { user: session } = useSupabaseSession();

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

    setIsLoading(true);
    setMessages([
      { role: "assistant", content: "_AI sta analizzando il tuo codice..._" },
    ]);

    try {
      const systemPrompt =
        mode === "creation"
          ? `Sei un tutor italiano in modalità CREAZIONE: guida passo-passo la costruzione del progetto da zero${detectedLang ? ` in ${detectedLang}` : ""}. Prerequisiti, struttura cartelle, ogni passo con comandi e snippet, fino a progetto funzionante.`
          : mode === "revision"
            ? `Sei un esperto Senior Developer in modalità REVISIONE: correggi e ottimizza il codice${detectedLang ? ` in ${detectedLang}` : ""} (naming, DRY, leggibilità, performance, sicurezza). Usa Markdown con sezioni Errori, Codice revisionato, Miglioramenti, Best practice.`
            : `Sei un esperto Senior Developer in modalità CORREZIONE: correggi SOLO errori sintattici/logici/runtime${detectedLang ? ` in ${detectedLang}` : ""}, mantieni la struttura. Usa Markdown con sezioni Errori, Spiegazione, Codice corretto (solo fix minimi).`;
      const data = await postChat([
        {
          role: "system",
          content: `${systemPrompt} Rispondi in italiano.`,
        },
        {
          role: "user",
          content: `Analizza questo codice (modalità ${mode}):\n\n\`\`\`${detectedLang || ""}\n${currentCode}\n\`\`\``,
        },
      ]);

      window.dispatchEvent(new Event("semplycode:stats:refresh"));
      setMessages([
        {
          role: "assistant",
          content: (data.message as { content: string }).content,
        },
      ]);
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
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedAnalysis = useCallback(
    debounce((nextCode: string) => performAutoAnalysis(nextCode), 1500),
    [detectedLang],
  );

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (value.trim()) {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-h-[380px] xs:min-h-[440px] lg:min-h-[580px] 2xl:min-h-[660px] 3xl:min-h-[720px]">
        <div className="flex flex-col min-h-[300px] lg:min-h-0 bg-[#f8fafc] backdrop-blur-md border border-[#e2e8f0] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm transition-all duration-300 hover:border-emerald-300">
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
        </div>

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

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-h-[720px] custom-scrollbar">
            {messages.length === 0 && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-5">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200 shadow-inner">
                  <Sparkles className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-[#475569]">
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

            {messages.map((msg, i) => (
              <div
                key={i}
                className="animate-in fade-in zoom-in-95 duration-700"
              >
                <div className="prose prose-sm max-w-none text-[#475569]">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h3: ({ ...props }) => (
                        <h3
                          className="text-primary font-bold text-lg mb-4 mt-6 first:mt-0 flex items-center gap-2"
                          {...props}
                        />
                      ),
                      ul: ({ ...props }) => (
                        <ul className="space-y-2 list-none p-0" {...props} />
                      ),
                      li: ({ ...props }) => (
                        <li
                          className="flex items-start gap-2.5 before:content-[''] before:w-1.5 before:h-1.5 before:bg-primary/60 before:rounded-full before:mt-2"
                          {...props}
                        />
                      ),
                      strong: ({ ...props }) => (
                        <strong className="text-primary font-bold" {...props} />
                      ),
                      code: ({
                        inline,
                        className,
                        children,
                        ...props
                      }: {
                        inline?: boolean;
                        className?: string;
                        children?: React.ReactNode;
                      }) =>
                        inline ? (
                          <code
                            className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-700 text-xs font-mono"
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <pre className="my-4 rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-lg bg-[#f8fafc]">
                            <code
                              className="block bg-[#f8fafc] p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap"
                              {...props}
                            >
                              {children}
                            </code>
                          </pre>
                        ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 opacity-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-xs font-mono text-[#94a3b8] tracking-tighter">
                  ELABORAZIONE LOGICA IN CORSO...
                </span>
              </div>
            )}
          </div>

          {!isLoading && code.trim() && (
            <button
              onClick={() => performAutoAnalysis(code)}
              className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30"
            >
              <Brain className="w-4 h-4" />
              Analizza Codice
            </button>
          )}
        </div>
      </div>
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
