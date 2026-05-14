/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import dynamic from "next/dynamic";
import EditorWrapper from "./EditorWrapper";
import {
  MessageSquare,
  Code2,
  Home,
  History,
  Terminal,
  Brain,
  Sparkles,
  Trash2,
  RotateCcw,
  LogOut,
  User,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  Menu,
  X,
} from "lucide-react";
import { debounce } from "lodash";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const FormattedAIResponse = ({ content, onLineClick }) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!content) return;
    setDisplayedContent("");
    setIsTyping(true);

    let i = 0;
    const speed = 8;
    const timer = setInterval(() => {
      const increment =
        content.length > 500 ? 15 : content.length > 200 ? 10 : 3;
      i += increment;
      setDisplayedContent(content.slice(0, i));
      if (i >= content.length) {
        setDisplayedContent(content);
        setIsTyping(false);
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [content]);

  const processContent = (text) => {
    return text.replace(/(?:riga|line|linea)\s+(\d+)/gi, (match, lineNum) => {
      const line = parseInt(lineNum, 10);
      if (line > 0) {
        return `%%LINE:${line}%%`;
      }
      return match;
    });
  };

  const handleClick = (e) => {
    const target = e.target;
    if (target.tagName === "BUTTON" && target.dataset.line) {
      const lineNum = parseInt(target.dataset.line, 10);
      if (onLineClick && lineNum > 0) {
        onLineClick(lineNum);
      }
    }
  };

  const processedContent = processContent(displayedContent);

  // Custom component to render the processed content with line buttons
  const RenderContent = () => {
    // Split by line markers
    const parts = processedContent.split(/(%%LINE:\d+%%)/g);

    // Separate markdown content from line buttons
    const markdownParts = [];
    const lineButtons = [];

    parts.forEach((part, i) => {
      const match = part.match(/%%LINE:(\d+)%%/);
      if (match) {
        lineButtons.push(parseInt(match[1], 10));
      } else if (part) {
        markdownParts.push(part);
      }
    });

    const markdownText = markdownParts.join("");

    return (
      <>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ node, ...props }) => (
              <h2
                className="text-lg font-bold text-white mb-3 mt-5 first:mt-0 flex items-center gap-2 border-b border-emerald-600/30 pb-2"
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3
                className="text-primary font-bold text-sm mb-2 mt-4 first:mt-0 flex items-center gap-2 border-b border-emerald-900/30 pb-1"
                {...props}
              />
            ),
            ul: ({ node, ...props }) => (
              <ul className="space-y-1 list-none p-0 my-3 ml-2" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol
                className="space-y-1 list-decimal list-inside p-0 my-3 ml-2 text-gray-400 text-xs"
                {...props}
              />
            ),
            li: ({ node, ...props }) => (
              <li
                className="flex items-start gap-2 text-gray-300 text-xs leading-relaxed"
                {...props}
              />
            ),
            strong: ({ node, ...props }) => (
              <strong className="text-emerald-400 font-bold" {...props} />
            ),
            p: ({ node, ...props }) => (
              <p
                className="mb-3 last:mb-0 leading-relaxed text-xs text-gray-300"
                {...props}
              />
            ),
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <div className="my-3 rounded-lg overflow-hidden border border-emerald-600/30 bg-[#010409]/80">
                  <pre className="p-4 overflow-x-auto m-0">
                    <code className="text-[11px] font-mono leading-relaxed text-gray-200">
                      {children}
                    </code>
                  </pre>
                </div>
              ) : (
                <code
                  className="bg-emerald-900/40 px-1.5 py-0.5 rounded text-emerald-300 text-[10px] font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            },
          }}
        >
          {markdownText}
        </ReactMarkdown>
        {lineButtons.map((lineNum, i) => (
          <button
            key={`btn-${i}`}
            type="button"
            data-line={lineNum}
            className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 text-[10px] font-semibold bg-emerald-600/20 text-emerald-400 rounded-md border border-emerald-500/30 hover:bg-emerald-600/40 hover:text-emerald-300 transition-all cursor-pointer"
            onClick={() => onLineClick?.(lineNum)}
          >
            <span className="text-[8px]">📍</span>
            riga {lineNum}
          </button>
        ))}
      </>
    );
  };

  return (
    <div className="relative" onClick={handleClick}>
      <RenderContent />
      {isTyping && (
        <span className="inline-block w-1.5 h-3.5 bg-primary/70 ml-0.5 animate-pulse align-middle"></span>
      )}
    </div>
  );
};

export default function Chat() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState("editor");
  const [code, setCode] = useState("");
  const [detectedLang, setDetectedLang] = useState("javascript");
  const [messages, setMessages] = useState([]);
  const [output, setOutput] = useState("Pronto. In attesa del codice...");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [user, setUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [isOutputSidebarOpen, setIsOutputSidebarOpen] = useState(true);
  const [activeMobilePanel, setActiveMobilePanel] = useState("editor"); // editor, insights, log
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        firstName:
          session.user.firstName || session.user.name?.split(" ")[0] || "",
        lastName:
          session.user.lastName ||
          session.user.name?.split(" ").slice(1).join(" ") ||
          "",
        email: session.user.email || "",
      });
    } else {
      setUser(null);
    }
  }, [session]);

  useEffect(() => {
    if (user?.email) {
      loadChatHistory();
    }
  }, [user]);

  // Restore autosaved draft from localStorage
  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem("semplycode:draft:v1") || "null");
      if (draft?.code) {
        setCode(draft.code);
        setDetectedLang(draft.language || "javascript");
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Global ESC handling to close overlays / mobile panels
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
        if (isProfileOpen) setIsProfileOpen(false);
        if (activeMobilePanel === "log") setActiveMobilePanel("editor");
        setIsOutputSidebarOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isMobileSidebarOpen, isProfileOpen, activeMobilePanel]);

  const loadChatHistory = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch("/api/chat/history");
      const data = await res.json();
      if (data.chats) setChatHistory(data.chats);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const saveChat = async () => {
    if (!user?.email || messages.length === 0) return;
    const title =
      code.slice(0, 30) + (code.length > 30 ? "..." : "") || "New Chat";
    try {
      const res = await fetch("/api/chat/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: currentChatId,
          title,
          messages,
          language: detectedLang,
        }),
      });
      const data = await res.json();
      if (data.chat) {
        setCurrentChatId(data.chat._id);
        loadChatHistory();
      }
    } catch (err) {
      console.error("Failed to save chat:", err);
    }
  };

  const loadChat = (chat) => {
    setCode("");
    setMessages(chat.messages || []);
    setCurrentChatId(chat._id);
    setDetectedLang(chat.language || "javascript");
    setOutput("Chat caricato dalla cronologia.");
  };

  const deleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (!user?.email || !chatId) return;
    try {
      await fetch(`/api/chat/history?chatId=${chatId}`, {
        method: "DELETE",
      });
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
        setCode("");
      }
      loadChatHistory();
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setCode("");
    setOutput("Pronto. In attesa del codice...");
  };

  const handleLogout = async () => {
    setUser(null);
    setIsProfileOpen(false);
    await nextAuthSignOut({ callbackUrl: "/" });
  };

  const sidebarMenuItems = [
    { icon: <Home size={20} />, label: "Home", href: "/", isLink: true },
    { icon: <History size={20} />, label: "Cronologia", section: "history" },
    { icon: <Sparkles size={20} />, label: "Nuova Chat", action: "newChat" },
  ];

  const getLanguageExtension = (lang) => {
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
      default:
        return javascript();
    }
  };

  const detectLanguage = (codeSnippet) => {
    const trimmed = codeSnippet.trim();
    if (!trimmed) return "javascript";

    // TypeScript
    if (
      /:\s*(string|number|boolean|any|void|never|unknown)\s*[=;)]/i.test(
        trimmed,
      ) ||
      /interface\s+\w+/.test(trimmed) ||
      (/<\w+>/.test(trimmed) && /:\s*\w+/.test(trimmed))
    )
      return "typescript";

    // JSON
    if (
      /^\s*[{[\[]/.test(trimmed) &&
      /[{[\[]\s*[\]}]\s*$/.test(trimmed) &&
      /^[^"']*\s*"/.test(trimmed)
    ) {
      try {
        JSON.parse(trimmed);
        return "json";
      } catch {}
    }

    // Rust
    if (/fn\s+\w+\s*\(|<impl|pub\s+fn|let\s+mut|use\s+std::/.test(trimmed))
      return "rust";

    // Go
    if (/func\s+\w+|package\s+\w+|import\s+"|fmt\./.test(trimmed)) return "go";

    // PHP
    if (
      /<\?php|\$\w+\s*=/.test(trimmed) ||
      (/function\s+\w+\s*\(.*\)\s*{/.test(trimmed) && /\$\w+/.test(trimmed))
    )
      return "php";

    // SQL
    if (
      /SELECT\s+.*FROM|INSERT\s+INTO|UPDATE\s+\w+|DELETE\s+FROM|CREATE\s+TABLE/i.test(
        trimmed,
      )
    )
      return "sql";

    // Python
    if (
      /def\s+\w+\s*\(.*\):|import\s+\w+|from\s+\w+\s+import|print\s*\(/.test(
        trimmed,
      )
    )
      return "python";

    // CSS
    if (/[.#][\w-]+\s*{|@media|@keyframes|:\s*[^;]+;/.test(trimmed))
      return "css";

    // HTML/Markup
    if (/<[a-z][^>]*>/i.test(trimmed)) return "markup";

    // JavaScript/TypeScript basics
    if (/const|let|var|function|=>\s*{|\.then\(|async\s+function/.test(trimmed))
      return "javascript";

    return "javascript";
  };

  const performAutoAnalysis = async (currentCode) => {
    if (!currentCode || !currentCode.trim() || currentCode.length < 5) {
      setIsLoading(false);
      setOutput("Pronto. In attesa del codice...");
      return;
    }

    setIsLoading(true);
    setOutput("Esecuzione analisi neurale...");

    const lineCount = currentCode.split("\n").length;
    const needsLineRefs = lineCount > 50;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `Sei un esperto Code Reviewer italiano. Rispondi SEMPRE in italiano. Analizza il codice e rispondi con questa struttura Markdown (USA SOLO TESTO, NIENTE EMOJI):

## Panoramica
[Breve descrizione del codice in 1-2 righe]

## Criticita
Per ogni problema indica la riga esatta:
- [Problema 1] - riga X: [descrizione]
- [Problema 2] - riga Y: [descrizione]
- [Problema 3] - riga Z: [descrizione]

## Suggerimenti
1. [Tipo] - [descrizione]
2. [Tipo] - [descrizione]

## Codice Ottimizzato
\`\`\`${detectedLang}
[Codice migliorato]
\`\`\`

${needsLineRefs ? 'IMPORTANTE: Per codici oltre 50 righe, cita SEMPRE le righe specifiche quando parli di problemi usando "riga XX".' : ""}`,
            },
            {
              role: "user",
              content: `Analizza questo codice ${detectedLang} (${lineCount} righe):\n\n\`\`\`${detectedLang}\n${currentCode}\n\`\`\``,
            },
          ],
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const aiResponse = data.message.content;
      setMessages([{ role: "assistant", content: aiResponse }]);
      setOutput(
        `Successo: Analizzato codice ${detectedLang}.\nImpronta memoria: minima\nLatenza: 12ms`,
      );

      // Auto-save chat after analysis
      if (user?.email && code.trim()) {
        const title =
          code.slice(0, 40) + (code.length > 40 ? "..." : "") ||
          "Analisi Codice";
        try {
          await fetch("/api/chat/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chatId: currentChatId,
              title,
              messages: [
                {
                  role: "user",
                  content:
                    code.slice(0, 500) +
                    (code.length > 500 ? "...[codice troncato]" : ""),
                },
                { role: "assistant", content: aiResponse },
              ],
              language: detectedLang,
            }),
          });
          loadChatHistory();
        } catch (err) {
          console.error("Auto-save failed:", err);
        }
      }
    } catch (error) {
      setOutput("Errore: Motore AI locale disconnesso.");
    } finally {
      setIsLoading(false);
    }
  };

  // Keep a ref to the latest performAutoAnalysis so the debounced callback
  // always calls the freshest version without recreating the debounced function.
  const performAutoAnalysisRef = useRef(performAutoAnalysis);
  useEffect(() => {
    performAutoAnalysisRef.current = performAutoAnalysis;
  }, [performAutoAnalysis]);

  const debouncedRef = useRef(
    debounce((nextCode) => {
      if (performAutoAnalysisRef.current) performAutoAnalysisRef.current(nextCode);
    }, 1200),
  );

  // Autosave draft after a pause in typing
  const autosaveRef = useRef(
    debounce((nextCode, lang) => {
      try {
        localStorage.setItem(
          "semplycode:draft:v1",
          JSON.stringify({ code: nextCode, language: lang, savedAt: Date.now() }),
        );
      } catch (e) {}
    }, 1500),
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => debouncedRef.current?.cancel();
  }, []);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    setDetectedLang(detectLanguage(newCode));

    // Cancel any pending analysis if code is empty
    if (!newCode.trim()) {
      debouncedRef.current.cancel();
      setMessages([]);
      setOutput("Pronto. In attesa del codice...");
      return;
    }

    if (newCode.trim().length > 5) {
      debouncedRef.current(newCode);
    }

    autosaveRef.current(newCode, detectLanguage(newCode));
  };

  const handleLineClick = (lineNumber) => {
    setHighlightedLine(lineNumber);

    // Scroll to and highlight line in editor
    const lineCount = code.split("\n").length;
    if (lineNumber > 0 && lineNumber <= lineCount) {
      const editorElement = document.querySelector(".cm-editor");
      if (editorElement) {
        const lines = editorElement.querySelectorAll(".cm-line");
        if (lines[lineNumber - 1]) {
          lines[lineNumber - 1].scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          // Add temporary highlight class
          lines[lineNumber - 1].classList.add("line-highlight");
        }
      }
    }

    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedLine(null);
      const editorElement = document.querySelector(".cm-editor");
      if (editorElement) {
        const highlighted = editorElement.querySelectorAll(".line-highlight");
        highlighted.forEach((el) => el.classList.remove("line-highlight"));
      }
    }, 3000);
  };

  return (
    <div className="flex h-screen bg-[#0a0c10] text-gray-300 overflow-hidden font-sans">
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarExpanded ? 260 : 70,
          x: isMobileSidebarOpen ? 0 : '-100%'
        }}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className="h-full bg-[#0d1117] border-r border-emerald-900/30 flex flex-col z-30 md:relative md:translate-x-0 fixed"
      >
        <div className="p-4 flex items-center gap-4 border-b border-emerald-900/20 h-16">
          <Link href="/" className="shrink-0">
            <img
              src="/semplycode.png"
              alt="Semplycode"
              className="w-10 h-10 rounded-xl"
            />
          </Link>
          {isSidebarExpanded && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-white whitespace-nowrap"
            >
              Semplycode
            </motion.span>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {sidebarMenuItems.map((item, i) =>
            item.isLink ? (
              <Link
                key={i}
                href={item.href}
                className="w-full flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-emerald-900/20 text-gray-500 hover:text-primary"
              >
                <div className="min-w-6 shrink-0">{item.icon}</div>
                {isSidebarExpanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            ) : (
              <button
                key={i}
                onClick={() => {
                  if (item.action === "newChat") {
                    startNewChat();
                  } else {
                    setActiveSection(item.section);
                    if (item.section === "editor") startNewChat();
                  }
                }}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-colors text-left ${item.action === "newChat" ? "hover:bg-emerald-900/20 text-emerald-400 hover:text-emerald-300" : activeSection === item.section ? "bg-primary text-white" : "hover:bg-emerald-900/20 text-gray-500 hover:text-primary"}`}
              >
                <div className="min-w-6 shrink-0">{item.icon}</div>
                {isSidebarExpanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </button>
            ),
          )}

          {isSidebarExpanded && activeSection === "history" && (
            <div className="mt-4 pt-4 border-t border-emerald-900/20">
              <div className="px-3 mb-2 text-xs font-bold text-gray-600 uppercase">
                Chat Recenti
              </div>
              <div className="space-y-1">
                {chatHistory.map((chat) => (
                  <div
                    key={chat._id}
                    onClick={() => loadChat(chat)}
                    className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs ${currentChatId === chat._id ? "bg-emerald-900/30 text-primary" : "text-gray-500 hover:bg-emerald-900/20 hover:text-primary"}`}
                  >
                    <span className="truncate flex-1">{chat.title}</span>
                    <button
                      onClick={(e) => deleteChat(e, chat._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* User Profile Section */}
        <div className="p-3 border-t border-emerald-900/20 overflow-hidden">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-900/20 transition-colors"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
                  <User size={16} className="text-white" />
                </div>
                {isSidebarExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 text-left min-w-0 overflow-hidden"
                  >
                    <p className="text-sm font-medium text-white truncate">
                      {user.firstName || user.email?.split("@")[0]}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </motion.div>
                )}
                {isSidebarExpanded && (
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              <AnimatePresence>
                {isProfileOpen && isSidebarExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-[#0d1117] border border-emerald-900/30 rounded-xl shadow-xl overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push("/dashboard");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:bg-emerald-900/20 hover:text-primary transition-colors"
                    >
                      <BarChart3 size={16} />
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        router.push("/settings");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:bg-emerald-900/20 hover:text-primary transition-colors"
                    >
                      <Settings size={16} />
                      Impostazioni
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut size={16} />
                      Esci
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/login"
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-900/20 text-gray-500 transition-colors"
            >
              <User size={20} />
              {isSidebarExpanded && (
                <span className="text-sm font-medium">Accedi</span>
              )}
            </Link>
          )}
        </div>
      </motion.aside>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Mobile Header with Hamburger and Tabs */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-[#0d1117] border-b border-emerald-900/30">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 hover:bg-emerald-900/20 rounded-lg text-gray-400"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveMobilePanel("editor")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeMobilePanel === "editor"
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:bg-emerald-900/20"
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setActiveMobilePanel("insights")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeMobilePanel === "insights"
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:bg-emerald-900/20"
                }`}
              >
                Insights
              </button>
              <button
                onClick={() => setActiveMobilePanel("log")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeMobilePanel === "log"
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:bg-emerald-900/20"
                }`}
              >
                Log
              </button>
            </div>
            <button
              onClick={() => code.trim() && performAutoAnalysis(code)}
              disabled={!code.trim() || isLoading}
              className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Brain size={18} />
            </button>
          </div>
        </div>

        <section className={`flex-1 flex flex-col border-r border-emerald-900/30 bg-[#0a0c10] md:flex ${activeMobilePanel === "editor" ? "flex" : "hidden md:flex"} md:mt-0 mt-14`}>
          <div className="h-16 border-b border-emerald-900/20 flex items-center justify-between px-6 bg-[#0d1117]/50 md:flex hidden">
            <div className="flex items-center gap-2">
              <Code2 size={18} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {detectedLang} Editor
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => code.trim() && performAutoAnalysis(code)}
                disabled={!code.trim() || isLoading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Brain size={14} />
                Analizza
              </button>
              <button
                onClick={saveChat}
                className="p-2 hover:bg-emerald-900/20 rounded-lg text-gray-500 hover:text-primary transition-colors"
                title="Save Chat"
              >
                <Sparkles size={16} />
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.setItem(
                      "semplycode:draft:v1",
                      JSON.stringify({ code, language: detectedLang, savedAt: Date.now() }),
                    );
                    // small UI feedback
                    setOutput("Bozza salvata localmente.");
                  } catch (e) {
                    setOutput("Impossibile salvare la bozza.");
                  }
                }}
                className="p-2 hover:bg-emerald-900/20 rounded-lg text-gray-500 hover:text-primary transition-colors"
                title="Save Draft"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => {
                  setCode("");
                  setMessages([]);
                  setOutput("Pulito.");
                  setCurrentChatId(null);
                }}
                className="p-2 hover:bg-emerald-900/20 rounded-lg text-gray-500 transition-colors"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar font-mono text-sm bg-[#0a0c10] min-h-0">
            {/* Mobile fallback: simple textarea for small screens */}
            {typeof window !== "undefined" && window.innerWidth < 640 ? (
              <textarea
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="w-full h-full p-4 bg-[#010409] text-sm font-mono text-gray-100 outline-none"
                placeholder="Scrivi o incolla il codice qui..."
              />
            ) : (
              <EditorWrapper value={code} onChange={handleCodeChange} detectedLang={detectedLang} />
            )}
          </div>
        </section>

        <section aria-hidden={activeMobilePanel !== "insights"} className={`flex-1 flex flex-col border-r border-emerald-900/30 bg-[#0d1117]/30 md:flex ${activeMobilePanel === "insights" ? "flex" : "hidden md:flex"} md:mt-0 mt-14`}>
          <div className="h-16 border-b border-emerald-900/20 flex items-center gap-2 px-6 bg-[#0d1117]/50 md:flex hidden">
            <Brain size={18} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Neural Insights
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <AnimatePresence mode="wait">
              {messages.length === 0 && !isLoading ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  className="h-full flex flex-col items-center justify-center text-center"
                >
                  <Sparkles size={40} className="mb-4 text-primary" />
                  <p className="text-xs text-gray-500">
                    In attesa di input neurale...
                  </p>
                </motion.div>
              ) : (
                <div key="content">
                  {messages.map((m, i) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={i}
                    >
                      <FormattedAIResponse
                        content={m.content}
                        onLineClick={handleLineClick}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
            {isLoading && (
              <div className="flex items-center gap-3 text-gray-500 animate-pulse">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-mono">
                  Analisi in corso...
                </span>
              </div>
            )}
          </div>
        </section>

        <AnimatePresence>
          {(isOutputSidebarOpen || activeMobilePanel === "log") && (
            <motion.section
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: activeMobilePanel === "log" ? '100%' : 384, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex flex-col bg-[#0a0c10] overflow-hidden border-l border-emerald-900/30 md:relative md:flex ${activeMobilePanel === "log" ? "flex fixed inset-0 z-10 mt-14" : "hidden md:flex"}`}
            >
              <div className="h-16 border-b border-emerald-900/20 flex items-center justify-between px-4 bg-[#0d1117]/50 shrink-0 md:flex hidden">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Log di Sistema
                  </span>
                </div>
                <button
                  onClick={() => setIsOutputSidebarOpen(false)}
                  className="p-1.5 hover:bg-emerald-900/30 rounded-lg text-gray-500 hover:text-primary transition-colors"
                  title="Chiudi pannello output"
                >
                  <PanelRightClose size={16} />
                </button>
              </div>
              <div className="flex-1 p-4 font-mono text-[11px] text-gray-500 overflow-auto custom-scrollbar leading-loose bg-[#010409]/30">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold shrink-0">➜</span>
                  <span className="whitespace-pre-wrap">{output}</span>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {!isOutputSidebarOpen && (
          <button
            onClick={() => setIsOutputSidebarOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-[#0d1117]/80 border border-emerald-900/30 rounded-l-lg text-gray-500 hover:text-primary transition-colors z-10 hidden md:block"
            title="Apri pannello output"
          >
            <PanelRightOpen size={18} />
          </button>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #064e3b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #065f46;
        }
        .line-highlight {
          background: rgba(16, 185, 129, 0.25) !important;
          border-left: 3px solid #10b981;
          animation: line-pulse 0.5s ease-in-out;
        }
        @keyframes line-pulse {
          0% {
            background: rgba(16, 185, 129, 0.5);
          }
          100% {
            background: rgba(16, 185, 129, 0.25);
          }
        }
        .line-link {
          color: #10b981;
          text-decoration: underline;
          cursor: pointer;
          font-weight: 500;
          transition: color 0.2s;
        }
        .line-link:hover {
          color: #34d399;
        }
      `}</style>
    </div>
  );
}
