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
import {
  Code2,
  MessageSquare,
  Loader2,
  Brain,
  Sparkles,
} from "lucide-react";
import { debounce } from "lodash";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSupabaseSession } from "@/lib/auth";
import { Plus, Trash2, Play } from "lucide-react";
import { motion } from "framer-motion";
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

const DemoSection = () => {
  const [code, setCode] = useState("");
  const [detectedLang, setDetectedLang] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

    return "javascript";
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
        return javascript();
      case "c":
        return javascript();
      case "cpp":
        return javascript();
      case "csharp":
        return javascript();
      case "kotlin":
        return javascript();
      case "swift":
        return javascript();
      case "ruby":
         
        return StreamLanguage.define(ruby as any);
      case "perl":
         
        return StreamLanguage.define(perl as any);
      case "lua":
         
        return StreamLanguage.define(lua as any);
      case "pascal":
         
        return StreamLanguage.define(pascal as any);
      case "shell":
        return javascript();
      case "fortran":
        return javascript();
      case "cobol":
        return javascript();
      case "xml":
        return html();
      case "markdown":
        return javascript();
      default:
        return javascript();
    }
  };

  const performAutoAnalysis = async (currentCode: string) => {
    if (!currentCode.trim() || currentCode.length < 10) return;

    setIsLoading(true);
    setMessages([
      { role: "assistant", content: "_AI sta analizzando il tuo codice..._" },
    ]);

    try {
      const data = await postChat([
        {
          role: "system",
          content: `Sei un esperto Senior Developer. Rispondi in italiano. Priorità: errori e correzioni, poi miglioramenti. Usa Markdown con sezioni Errori, Spiegazione, Miglioramenti, Codice corretto.`,
        },
        {
          role: "user",
          content: `Analizza questo codice:\n\n\`\`\`${detectedLang || "javascript"}\n${currentCode}\n\`\`\``,
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
      ? `demo_code:${session.email}`
      : `demo_code:anon`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        setCode(saved);
        const lang = detectLanguage(saved);
        setDetectedLang(lang);
      }
    } catch {
      // ignore
    }
  }, [session]);

  useEffect(() => {
    const key = session?.email
      ? `demo_code:${session.email}`
      : `demo_code:anon`;
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
    <section className="w-full max-w-7xl mx-auto p-4 md:p-6 bg-white rounded-3xl border border-[#e2e8f0] shadow-2xl my-12 relative overflow-hidden group">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-primary to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Brain className="text-white w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0f172a]">
              Analizzatore Codice Live
            </h2>
            <p className="text-xs text-[#64748b] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Analisi AI in Tempo Reale
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2">
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-162.5">
        <div className="flex flex-col min-h-0 bg-[#f8fafc] backdrop-blur-md border border-[#e2e8f0] rounded-3xl overflow-hidden shadow-sm transition-all duration-300 hover:border-emerald-300">
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#e2e8f0]">
            <div className="flex items-center gap-2.5">
              <Code2 className="text-primary w-4 h-4" />
              {detectedLang ? (
                <span className="text-[11px] font-bold text-[#64748b] font-mono uppercase tracking-widest">
                  {detectedLang === "unrecognized" ? "code" : detectedLang}
                </span>
              ) : null}
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-900"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-900"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-900"></div>
            </div>
          </div>

          <div className="flex-1 min-h-0 font-mono text-sm overflow-auto custom-scrollbar">
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
                  "&": { height: "100%" },
                  ".cm-scroller": { overflow: "auto" },
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
              style={{ fontSize: 14, height: "100%" }}
              className="h-full"
            />
          </div>
        </div>

        <div className="flex flex-col bg-[#f8fafc] backdrop-blur-md border border-[#e2e8f0] rounded-3xl overflow-hidden shadow-sm relative">
          <div className="flex items-center gap-2.5 px-6 py-4 bg-white border-b border-[#e2e8f0]">
            <MessageSquare className="text-emerald-600 w-4 h-4" />
            <span className="text-[11px] font-bold text-[#64748b] font-mono tracking-widest uppercase">
              Report
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-8 max-h-145 custom-scrollbar">
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
  );
};

export default DemoSection;
