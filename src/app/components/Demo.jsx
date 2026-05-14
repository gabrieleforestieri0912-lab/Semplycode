/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { rust } from '@codemirror/lang-rust';
import { go } from '@codemirror/lang-go';
import { php } from '@codemirror/lang-php';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { Code2, MessageSquare, Loader2, Brain, Sparkles, CheckCircle2 } from 'lucide-react';
import { debounce } from 'lodash';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSession } from 'next-auth/react';
import { Plus, Trash2 } from 'lucide-react';

const DemoSection = () => {
  const [code, setCode] = useState('');
  const [detectedLang, setDetectedLang] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  const detectLanguage = (codeSnippet) => {
    const trimmed = codeSnippet.trim();
    if (!trimmed) return '';

    // TypeScript
    if (/:\s*(string|number|boolean|any|void|never|unknown)\s*[=;)]/i.test(trimmed) || /interface\s+\w+/.test(trimmed) || /<\w+>/.test(trimmed) && /:\s*\w+/.test(trimmed)) return 'typescript';
    
    // JSON
    if (/^\s*[{[\[]/.test(trimmed) && /[{[\[]\s*[\]}]\s*$/.test(trimmed) && /^[^"']*\s*"/.test(trimmed)) {
      try { JSON.parse(trimmed); return 'json'; } catch { }
    }
    
    // Rust
    if (/fn\s+\w+\s*\(|<impl|pub\s+fn|let\s+mut|use\s+std::/.test(trimmed)) return 'rust';
    
    // Go
    if (/func\s+\w+|package\s+\w+|import\s+"|fmt\./.test(trimmed)) return 'go';
    
    // PHP
    if (/<\?php|\$\w+\s*=/.test(trimmed) || /function\s+\w+\s*\(.*\)\s*{/.test(trimmed) && /\$\w+/.test(trimmed)) return 'php';
    
    // SQL
    if (/SELECT\s+.*FROM|INSERT\s+INTO|UPDATE\s+\w+|DELETE\s+FROM|CREATE\s+TABLE/i.test(trimmed)) return 'sql';
    
    // Python
    if (/def\s+\w+\s*\(.*\):|import\s+\w+|from\s+\w+\s+import|print\s*\(/.test(trimmed)) return 'python';
    
    // CSS
    if (/[.#][\w-]+\s*{|@media|@keyframes|:\s*[^;]+;/.test(trimmed)) return 'css';
    
    // HTML/Markup
    if (/<[a-z][^>]*>/i.test(trimmed)) return 'markup';
    
    // JavaScript/TypeScript basics
    if (/const|let|var|function|=>\s*{|\.then\(|async\s+function/.test(trimmed)) return 'javascript';

    return 'javascript';
  };

  const getLanguageExtension = (lang) => {
    switch (lang) {
      case 'python': return python();
      case 'css': return css();
      case 'markup': return html();
      case 'json': return json();
      case 'rust': return rust();
      case 'go': return go();
      case 'php': return php();
      case 'sql': return sql();
      case 'typescript': return javascript({ typescript: true });
      default: return javascript();
    }
  };

  const performAutoAnalysis = async (currentCode) => {
    if (!currentCode.trim() || currentCode.length < 10) return;

    setIsLoading(true);
    setMessages([{ role: 'assistant', content: '_AI sta analizzando il tuo codice..._' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Sei un esperto Senior Developer e Architetto Software. 
              Analizza il codice fornito e rispondi seguendo SEMPRE questa struttura:
              
### Analisi Completa
### Miglioramenti Suggeriti
### Codice Ottimizzato
              Fornisci il blocco di codice completo e migliorato.
              
              Usa il formato Markdown (grassetto, elenchi puntati, blocchi di codice).`
            },
            { role: 'user', content: `Analizza questo codice:\n\n\`\`\`${detectedLang || 'javascript'}\n${currentCode}\n\`\`\`` }
          ]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages([{
        role: 'assistant',
        content: data.message.content
      }]);
    } catch (error) {
      setMessages([{ role: 'assistant', content: "**Errore:** Assicurati che Ollama sia attivo." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedAnalysis = useCallback(
    debounce((nextCode) => performAutoAnalysis(nextCode), 1500),
    [detectedLang]
  );

  const handleCodeChange = (value) => {
    setCode(value);
    if (value.trim()) {
      const lang = detectLanguage(value);
      setDetectedLang(lang);
    } else {
      setDetectedLang('');
      setMessages([]);
    }
  };

  const handleNewAnalysis = async () => {
    setCode('');
    setMessages([]);
    setDetectedLang('');

    if (session?.user) {
      try {
        await fetch('/api/chat/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [],
            code: '',
            action: 'new'
          })
        });
      } catch (e) {
        console.error('Failed to save new analysis');
      }
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto p-4 md:p-6 bg-[#0a0c10] rounded-3xl border border-emerald-900/30 shadow-2xl my-12 relative overflow-hidden group">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Brain className="text-white w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Analizzatore Codice Live
            </h2>
            <p className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Analisi AI in Tempo Reale
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-800/30 rounded-full px-4 py-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-xs font-medium text-emerald-300">Analizzando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-medium text-emerald-400">Ready</span>
            </div>
          )}

          {(code || messages.length > 0) && (
            <>
              <button
                onClick={handleNewAnalysis}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-800/30 text-emerald-300 hover:bg-emerald-900/50 transition-colors text-xs font-medium"
                title="Nuova Analisi"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuova
              </button>
              <button
                onClick={() => { setCode(''); setMessages([]); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-900/20 border border-red-800/30 text-red-400 hover:bg-red-900/40 transition-colors text-xs font-medium"
                title="Cancella tutto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[650px]">
        <div className="flex flex-col bg-[#0d1117]/80 backdrop-blur-md border border-emerald-900/30 rounded-3xl overflow-hidden shadow-sm transition-all duration-300 hover:border-primary/30">
          <div className="flex items-center justify-between px-6 py-4 bg-[#161b22]/50 border-b border-emerald-900/20">
            <div className="flex items-center gap-2.5">
              <Code2 className="text-primary w-4 h-4" />
              {detectedLang ? (
                <span className="text-[11px] font-bold text-gray-400 font-mono uppercase tracking-widest">
                  {detectedLang === 'unrecognized' ? 'code' : detectedLang}
                </span>
              ) : null}
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-900"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-900"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-900"></div>
            </div>
          </div>

          <div className="flex-1 font-mono text-sm overflow-auto custom-scrollbar">
            <CodeMirror
              value={code}
              onChange={(val) => {
                if (val.trim()) {
                  const lang = detectLanguage(val);
                  setDetectedLang(lang);
                } else {
                  setDetectedLang('');
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
                  ".cm-content": { minHeight: "500px" }
                })
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

        <div className="flex flex-col bg-[#0d1117]/80 backdrop-blur-md border border-emerald-900/30 rounded-3xl overflow-hidden shadow-sm relative">
          <div className="flex items-center gap-2.5 px-6 py-4 bg-[#161b22]/50 border-b border-emerald-900/20">
            <MessageSquare className="text-primary w-4 h-4" />
            <span className="text-[11px] font-bold text-gray-400 font-mono tracking-widest uppercase text-shadow-glow">Report Architettonico</span>
          </div>

          <div className="flex-1 overflow-y-auto p-8 max-h-[580px] custom-scrollbar">
            {messages.length === 0 && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-5">
                <div className="w-20 h-20 bg-emerald-950/30 rounded-full flex items-center justify-center border border-emerald-900/30 shadow-inner">
                  <Sparkles className="w-8 h-8 text-primary/50" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-gray-300">Inizia la tua Analisi</p>
                  <p className="text-sm text-gray-500 max-w-[280px] leading-relaxed mx-auto">
                    Incolla un frammento di codice per ricevere un report completo dall&apos;<span className="text-primary font-bold">AI Engine</span>.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className="animate-in fade-in zoom-in-95 duration-700">
                <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h3: ({ node, ...props }) => <h3 className="text-primary font-bold text-lg mb-4 mt-6 first:mt-0 flex items-center gap-2" {...props} />,
                      ul: ({ node, ...props }) => <ul className="space-y-2 list-none p-0" {...props} />,
                      li: ({ node, ...props }) => <li className="flex items-start gap-2.5 before:content-[''] before:w-1.5 before:h-1.5 before:bg-primary/60 before:rounded-full before:mt-2" {...props} />,
                      strong: ({ node, ...props }) => <strong className="text-primary font-bold" {...props} />,
                      code: ({ node, inline, ...props }) =>
                        inline
                          ? <code className="bg-emerald-900/30 px-1.5 py-0.5 rounded text-primary text-xs font-mono" {...props} />
                          : <div className="my-4 rounded-2xl overflow-hidden border border-emerald-900/30 shadow-lg bg-[#010409]/50"><code className="block bg-[#010409]/50 p-4 text-xs font-mono leading-relaxed" {...props} /></div>
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
                <span className="text-xs font-mono text-gray-500 tracking-tighter">ELABORAZIONE LOGICA IN CORSO...</span>
              </div>
            )}
          </div>

          {!isLoading && code.trim() && (
            <button 
              onClick={() => performAutoAnalysis(code)} 
              className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30"
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