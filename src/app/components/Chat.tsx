/* eslint-disable @next/next/no-location-assign-relative-destination */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useRef, ChangeEvent, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import EditorWrapper from "./EditorWrapper";
import Onboarding from "./Onboarding";
import QuotaBadge from "./QuotaBadge";
import CodeApplyModal from "./playground/CodeApplyModal";
import { buildAnalysisSystemPrompt, ANALYSIS_TYPE_LABELS, ANALYSIS_TYPE_DESCRIPTIONS } from "@/lib/analysisPrompts";
import { postChat, postChatStream, formatApiError } from "@/lib/playgroundApi";
import {
  MessageSquare,
  Terminal,
  Brain,
  Sparkles,
  Trash2,
  User,
  BarChart3,
  Settings,
  ChevronDown,
  PanelRightClose,
  PanelRightOpen,
  Menu,
  X,
  Cpu,
  Wand2,
  Plus,
  Send,
  Upload,
  FileText,
  Download,
  Share2,
  Github,
  Archive,
  Bookmark,
  AlertCircle,
  Search,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Loader2,
  PenLine,
  Folder,
  FolderPlus,
  FolderKanban,
  ChevronRight,
  FileCode,
  FolderInput,
  FolderX,
} from "lucide-react";
import { debounce } from "lodash";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChatProject,
  loadProjectsFromStorage,
  loadChatProjectMap,
  createProject,
  deleteProject,
  renameProject,
  assignChatToProject,
  PROJECT_COLORS,
  getProjectColor,
} from "@/lib/projectStore";
import {
  exportChatAsMarkdown,
  exportCodeOnly,
} from "@/lib/exportUtils";

const MAX_UPLOAD_FILES = 5;
const MAX_UPLOAD_FILE_SIZE = 100 * 1024;
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

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  _streamed?: boolean;
}

interface FileInfo {
  name: string;
  content: string;
  language: string;
}

interface ApplyModalState {
  oldCode: string;
  newCode: string;
}

interface LimitModalState {
  message: string;
  code?: string;
}

interface ChatHistoryItem {
  _id: string;
  title: string;
  messages?: Message[];
  language?: string;
}

interface RenameState {
  chatId: string;
  title: string;
}

interface UserInfo {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  image: string | null;
}

interface FormattedAIResponseProps {
  content: string;
  onLineClick?: (line: number) => void;
  enableTyping?: boolean;
  highlightedLine?: number | null;
}

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

const buildCombinedCodeFromFiles = (files: FileInfo[]): string =>
  files
    .map(
      (f) =>
        `// ========== ${f.name} (${f.language}) ==========\n${f.content.trim()}`,
    )
    .join("\n\n");

const FormattedAIResponse = ({
  content,
  onLineClick,
  enableTyping = false,
  highlightedLine = null,
}: FormattedAIResponseProps) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!content) {
      setDisplayedContent("");
      setIsTyping(false);
      return;
    }

    if (!enableTyping) {
      setDisplayedContent(content);
      setIsTyping(false);
      return;
    }

    setDisplayedContent("");
    setIsTyping(true);

    let i = 0;
    const tickMs = 32;
    const timer = setInterval(() => {
      const increment =
        content.length > 800 ? 3 : content.length > 300 ? 2 : 1;
      i += increment;
      setDisplayedContent(content.slice(0, i));
      if (i >= content.length) {
        setDisplayedContent(content);
        setIsTyping(false);
        clearInterval(timer);
      }
    }, tickMs);
    return () => clearInterval(timer);
  }, [content, enableTyping]);

  const processContent = (text: string): string => {
    return text.replace(/(?:riga|line|linea)\s+(\d+)/gi, (match, lineNum) => {
      const line = parseInt(lineNum, 10);
      if (line > 0) {
        return `%%LINE:${line}%%`;
      }
      return match;
    });
  };

  const handleClick = (e: ReactMouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "BUTTON" && target.dataset.line) {
      const lineNum = parseInt(target.dataset.line, 10);
      if (onLineClick && lineNum > 0) {
        onLineClick(lineNum);
      }
    }
  };

  const processedContent = processContent(displayedContent);

  const RenderContent = () => {
    const parts = processedContent.split(/(%%LINE:\d+%%)/g);

    const markdownParts: string[] = [];
    const lineButtons: number[] = [];

    parts.forEach((part) => {
      const match = part.match(/%%LINE:(\d+)%%/);
      if (match) {
        lineButtons.push(parseInt(match[1], 10));
      } else if (part) {
        markdownParts.push(part);
      }
    });

    const markdownText = markdownParts.join("");

    const mdComponents: Record<string, React.ComponentType<Record<string, unknown>>> = {
      h1: ({ ...props }) => (
        <h1
          className="text-base font-bold text-white mb-3 mt-1 first:mt-0"
          {...props}
        />
      ),
      h2: ({ ...props }) => (
        <h2
          className="text-[15px] font-bold text-white mt-6 mb-3 first:mt-0 pt-4 border-t border-emerald-900/30 first:border-t-0 first:pt-0"
          {...props}
        />
      ),
      h3: ({ ...props }) => (
        <h3
          className="text-sm font-semibold text-primary mt-4 mb-2 first:mt-0"
          {...props}
        />
      ),
      h4: ({ ...props }) => (
        <h4
          className="text-sm font-medium text-gray-200 mt-3 mb-1.5"
          {...props}
        />
      ),
      p: ({ ...props }) => (
        <p
          className="mb-3 last:mb-0 text-sm leading-relaxed text-gray-300"
          {...props}
        />
      ),
      ul: ({ ...props }) => (
        <ul
          className="my-3 space-y-2 pl-5 list-disc marker:text-primary/70 text-gray-300"
          {...props}
        />
      ),
      ol: ({ ...props }) => (
        <ol
          className="my-3 space-y-2 pl-5 list-decimal text-sm text-gray-300 marker:text-primary/80"
          {...props}
        />
      ),
      li: ({ children, ...props }: { children?: React.ReactNode }) => (
        <li
          className="text-sm leading-relaxed [&>p]:mb-1.5 [&>p]:last:mb-0"
          {...props}
        >
          {children}
        </li>
      ),
      blockquote: ({ ...props }) => (
        <blockquote
          className="my-3 pl-3 border-l-2 border-primary/50 text-gray-400 text-sm italic"
          {...props}
        />
      ),
      hr: () => <hr className="my-5 border-emerald-900/30" />,
      strong: ({ ...props }) => (
        <strong className="font-semibold text-emerald-300" {...props} />
      ),
      em: ({ ...props }) => (
        <em className="text-gray-400 not-italic" {...props} />
      ),
      a: ({ ...props }) => (
        <a
          className="text-primary underline underline-offset-2 hover:text-primary/80"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        />
      ),
      table: ({ ...props }) => (
        <div className="my-4 overflow-x-auto rounded-lg border border-emerald-900/30">
          <table className="w-full text-xs text-left" {...props} />
        </div>
      ),
      thead: ({ ...props }) => (
        <thead className="bg-emerald-950/50 text-gray-400 uppercase text-[10px]" {...props} />
      ),
      th: ({ ...props }) => (
        <th className="px-3 py-2 font-semibold border-b border-emerald-900/30" {...props} />
      ),
      td: ({ ...props }) => (
        <td className="px-3 py-2 border-b border-emerald-900/20 text-gray-300" {...props} />
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
                  window.dispatchEvent(
                    new CustomEvent("semplycode:previewApply", {
                      detail: { code: raw },
                    }),
                  );
                }}
              >
                Applica
              </button>
            </div>
            <pre className="p-4 overflow-x-auto m-0 max-h-80 custom-scrollbar">
              <code className="text-[13px] font-mono leading-relaxed text-gray-200 whitespace-pre">
                {children}
              </code>
            </pre>
          </div>
        );
      },
    };

    return (
      <>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={mdComponents}
        >
          {markdownText}
        </ReactMarkdown>
        {lineButtons.map((lineNum, i) => (
          <button
            key={`btn-${i}`}
            type="button"
            data-line={lineNum}
            className={`inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 text-[10px] font-semibold rounded-md border transition-all cursor-pointer ${highlightedLine === lineNum
                ? "bg-emerald-500/30 text-emerald-200 border-emerald-400/60 shadow-sm shadow-emerald-500/20"
                : "bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/40 hover:text-emerald-300"
              }`}
            onClick={() => onLineClick?.(lineNum)}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            riga {lineNum}
          </button>
        ))}
      </>
    );
  };

  return (
    <div
      className="relative text-left ai-response-markdown [&>*:first-child]:mt-0"
      onClick={handleClick}
    >
      <RenderContent />
      {isTyping && (
        <span className="inline-block w-1.5 h-3.5 bg-primary/70 ml-0.5 animate-pulse align-middle"></span>
      )}
    </div>
  );
};

interface ChatMessageProps {
  message: Message;
  onLineClick?: (line: number) => void;
  enableTyping?: boolean;
  onRegenerate?: () => void;
  onSave?: () => void;
  highlightedLine?: number | null;
}

const ChatMessage = ({ message, onLineClick, enableTyping, onRegenerate, onSave, highlightedLine }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"liked" | "disliked" | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`${isUser ? "max-w-[min(100%,42rem)]" : "w-full"} rounded-2xl ${isUser
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
            <FormattedAIResponse
              content={message.content}
              onLineClick={onLineClick}
              enableTyping={enableTyping}
              highlightedLine={highlightedLine}
            />
            {message.content && (
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
                <button
                  type="button"
                  onClick={() => setFeedback(feedback === "liked" ? null : "liked")}
                  className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded-md transition-all ${feedback === "liked" ? "text-emerald-400 bg-emerald-500/15" : "text-gray-500 hover:text-primary hover:bg-emerald-900/15"
                    }`}
                  title="Utile"
                >
                  <ThumbsUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setFeedback(feedback === "disliked" ? null : "disliked")}
                  className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded-md transition-all ${feedback === "disliked" ? "text-red-400 bg-red-500/15" : "text-gray-500 hover:text-primary hover:bg-emerald-900/15"
                    }`}
                  title="Non utile"
                >
                  <ThumbsDown size={12} />
                </button>
                {onSave && (
                  <button
                    type="button"
                    onClick={onSave}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 hover:text-emerald-400 rounded-md hover:bg-emerald-900/15 transition-all"
                    title="Salva nel cassetto"
                  >
                    <Bookmark size={12} />
                    Salva
                  </button>
                )}
                {onRegenerate && (
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
    </motion.div>
  );
};

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  rust: "Rust",
  go: "Go",
  php: "PHP",
  sql: "SQL",
  css: "CSS",
  markup: "HTML",
  json: "JSON",
};

function getLanguageLabel(lang: string): string {
  return (
    LANGUAGE_LABELS[lang] ||
    (lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : "JavaScript")
  );
}

export default function Chat() {
  const router = useRouter();
  const { user: sessionUser } = useSupabaseSession();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [code, setCode] = useState("");
  const [detectedLang, setDetectedLang] = useState("javascript");
  const [messages, setMessages] = useState<Message[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [activeMobilePanel, setActiveMobilePanel] = useState<"editor" | "insights">("editor");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const [insightsTab, setInsightsTab] = useState<"full" | "files">("full");
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [analysisType, setAnalysisType] = useState("correction");
  const [errorContext, setErrorContext] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [isZipLoading, setIsZipLoading] = useState(false);
  const [limitModal, setLimitModal] = useState<LimitModalState | null>(null);
  const [applyModal, setApplyModal] = useState<ApplyModalState | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [confirmDeleteChatId, setConfirmDeleteChatId] = useState<string | null>(null);
  const [renameChat, setRenameChat] = useState<RenameState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<{ scrollToLine: (line: number) => void; getLineCount: () => number }>(null);

  // Progetti & Esportazione
  const [projects, setProjects] = useState<ChatProject[]>([]);
  const [chatProjectMap, setChatProjectMap] = useState<Record<string, string>>({});
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("emerald");
  const [renameProjectId, setRenameProjectId] = useState<string | null>(null);
  const [renameProjectTitle, setRenameProjectTitle] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ unassigned: true });
  const [activeProjectFilter, setActiveProjectFilter] = useState<string | null>(null);
  const [moveChatTarget, setMoveChatTarget] = useState<{ chatId: string; currentProjId?: string } | null>(null);
  const [exportMenuChatId, setExportMenuChatId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    const projs = loadProjectsFromStorage();
    const map = loadChatProjectMap();
    setProjects(projs);
    setChatProjectMap(map);
    const expanded: Record<string, boolean> = { unassigned: true };
    projs.forEach((p) => {
      expanded[p.id] = true;
    });
    setExpandedFolders(expanded);
  }, []);

  const handleCreateProject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newProjectName.trim()) return;
    const created = createProject(newProjectName.trim(), newProjectColor);
    const updated = loadProjectsFromStorage();
    setProjects(updated);
    setExpandedFolders((prev) => ({ ...prev, [created.id]: true }));
    setNewProjectName("");
    setIsCreatingProject(false);
  };

  const handleDeleteProject = (e: ReactMouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!confirm("Eliminare questo progetto? Le chat associate torneranno in 'Senza progetto'.")) return;
    deleteProject(projectId);
    setProjects(loadProjectsFromStorage());
    setChatProjectMap(loadChatProjectMap());
    if (activeProjectFilter === projectId) setActiveProjectFilter(null);
  };

  const handleRenameProject = (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    if (!renameProjectTitle.trim()) {
      setRenameProjectId(null);
      return;
    }
    renameProject(projectId, renameProjectTitle.trim());
    setProjects(loadProjectsFromStorage());
    setRenameProjectId(null);
  };

  const handleAssignChatToProject = (chatId: string, projectId: string | null) => {
    assignChatToProject(chatId, projectId);
    setChatProjectMap(loadChatProjectMap());
    setMoveChatTarget(null);
  };

  const handleExportChat = async (chat: ChatHistoryItem, mode: "full" | "code") => {
    try {
      const chatMessages =
        chat._id === currentChatId && messages.length > 0
          ? messages
          : chat.messages || [];
      const chatTitle = chat.title || "Conversazione Semplycode";

      if (mode === "full") {
        await exportChatAsMarkdown(chatTitle, chatMessages);
        setExportNotice(`Esportata chat: ${chatTitle}.md`);
      } else {
        const activeCode =
          chat._id === currentChatId ? activeFile?.content ?? code : undefined;
        const res = await exportCodeOnly(
          chatTitle,
          chatMessages,
          activeCode,
          chat.language || detectedLang
        );
        setExportNotice(`File scaricato: ${res.filename} (${res.language})`);
      }
      setTimeout(() => setExportNotice(null), 3500);
    } catch (err) {
      console.error("Export error:", err);
      alert("Si è verificato un errore durante l'esportazione.");
    } finally {
      setExportMenuChatId(null);
    }
  };

  useEffect(() => {
    if (sessionUser) {
      setUser({
        id: sessionUser.id,
        firstName: sessionUser.user_metadata?.full_name?.split(" ")[0] || "",
        lastName: sessionUser.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
        email: sessionUser.email || "",
        image: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || null,
      });
    } else {
      setUser(null);
    }
  }, [sessionUser]);

  useEffect(() => {
    if (user?.email) {
      loadChatHistory();
    }
  }, [user]);

  useEffect(() => {
    try {
      const shown = localStorage.getItem("semplycode:onboard:v1");
      if (!shown) setShowOnboarding(true);
    } catch { }
  }, []);

  useEffect(() => {
    const onPreview = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const suggested: string | undefined = detail.code;
      if (!suggested) return;
      setApplyModal({ oldCode: code, newCode: suggested });
    };
    const onApply = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const suggested: string | undefined = detail.code;
      if (!suggested) return;
      setCode(suggested);
      setDetectedLang(detectLanguage(suggested));
      setUploadedFiles([]);
      performAutoAnalysisRef.current?.(suggested);
    };
    window.addEventListener("semplycode:previewApply", onPreview);
    window.addEventListener("semplycode:applySuggestion", onApply);
    return () => {
      window.removeEventListener("semplycode:previewApply", onPreview);
      window.removeEventListener("semplycode:applySuggestion", onApply);
    };
  }, [code]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get("code") || params.get("c");
      if (urlCode) {
        setCode(urlCode);
        setDetectedLang(detectLanguage(urlCode));
        return;
      }

      const draft = JSON.parse(
        localStorage.getItem("semplycode:draft:v1") || "null",
      );
      if (draft?.code) {
        setCode(draft.code);
        setDetectedLang(draft.language || "javascript");
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
        if (isSidebarExpanded) setIsSidebarExpanded(false);
        if (isProfileOpen) setIsProfileOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isMobileSidebarOpen, isSidebarExpanded, isProfileOpen, activeMobilePanel]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.key === "Enter") {
        e.preventDefault();
        if (code.trim()) performAutoAnalysisRef.current?.(code);
      }
      if (isMod && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        try {
          localStorage.setItem(
            "semplycode:draft:v1",
            JSON.stringify({
              code,
              language: detectedLang,
              savedAt: Date.now(),
            }),
          );
        } catch {
          // niente da mostrare: la bozza viene salvata localmente
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [code, detectedLang]);

  const loadChatHistory = async () => {
    if (!user?.email) return;
    setIsHistoryLoading(true);
    try {
      const res = await fetch("/api/chat/history");
      const data: { chats?: Array<ChatHistoryItem & { id?: string }> } = await res.json();
      if (data.chats) {
        const normalized = data.chats
          .filter(Boolean)
          .map((c) => ({ ...c, _id: c._id || c.id || "" }));
        setChatHistory(normalized);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const loadChat = (chat: ChatHistoryItem) => {
    setCode("");
    setUploadedFiles([]);
    setActiveFileIndex(0);
    setMessages(chat.messages || []);
    setCurrentChatId(chat._id);
    setDetectedLang(chat.language || "javascript");
  };

  const deleteChat = async (e: ReactMouseEvent, chatId: string) => {
    e.stopPropagation();
    setConfirmDeleteChatId(chatId);
  };

  const confirmDeleteChat = async () => {
    const chatId = confirmDeleteChatId;
    if (!user?.email || !chatId) return;
    setConfirmDeleteChatId(null);
    try {
      await fetch(`/api/chat/history?chatId=${chatId}`, {
        method: "DELETE",
      });
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
        setCode("");
        setUploadedFiles([]);
        setActiveFileIndex(0);
      }
      loadChatHistory();
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  const submitRenameChat = async () => {
    if (!renameChat || !user?.email) return;
    const { chatId, title } = renameChat;
    const trimmed = title.trim();
    if (!trimmed) {
      setRenameChat(null);
      return;
    }
    setRenameChat(null);
    try {
      const current = chatHistory.find((c) => c._id === chatId);
      await fetch("/api/chat/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          title: trimmed,
          messages: current?.messages?.length
            ? current.messages
            : [{ role: "user", content: trimmed }],
          language: current?.language || "javascript",
        }),
      });
      loadChatHistory();
    } catch (err) {
      console.error("Failed to rename chat:", err);
    }
  };

  const regenerateMessage = (index: number) => {
    const aiMessage = messages[index];
    if (!aiMessage || aiMessage.role !== "assistant") return;

    const previousUserMessages = messages
      .slice(0, index)
      .filter((m) => m.role === "user");
    const lastUserMessage = previousUserMessages[previousUserMessages.length - 1];

    if (lastUserMessage) {
      const withoutAi = messages.filter((_, i) => i !== index);
      setMessages(withoutAi);
      sendChatMessage(lastUserMessage.content);
    } else {
      performAutoAnalysis(code);
    }
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setCode("");
    setUploadedFiles([]);
    setActiveFileIndex(0);
  };

  const handleLogout = async () => {
    setUser(null);
    setIsProfileOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const detectLanguage = (codeSnippet: string): string => {
    const trimmed = codeSnippet.trim();
    if (!trimmed) return "javascript";

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
      } catch { }
    }

    if (
      /\bfn\s+\w+\s*\(|\bpub\s+fn\b|\blet\s+mut\b|\buse\s+std::|impl\s+\w+/.test(
        trimmed,
      )
    )
      return "rust";

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
    if (/func\s+\w+\s*\(|fmt\.|:=|import\s+"/.test(trimmed)) return "go";

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

  const applyFilesToEditor = (fileData: FileInfo[], { autoAnalyze = true }: { autoAnalyze?: boolean } = {}) => {
    if (!fileData?.length) return;

    const combined = buildCombinedCodeFromFiles(fileData);
    const lang =
      fileData.length === 1
        ? fileData[0].language
        : detectLanguage(combined);

    setUploadedFiles(fileData);
    setActiveFileIndex(0);
    setCode(combined);
    setDetectedLang(lang);
    setMessages([]);
    setInsightsTab("full");

    const firstFile = fileData[0];
    if (autoAnalyze && firstFile && firstFile.content.trim().length > 5) {
      performAutoAnalysisRef.current?.(firstFile.content, firstFile.language, fileData);
    }
  };

  const handleCodeFiles = (incomingFiles: File[]) => {
    const validFiles: File[] = [];

    for (const file of incomingFiles) {
      if (uploadedFiles.length + validFiles.length >= MAX_UPLOAD_FILES) break;

      if (file.size > MAX_UPLOAD_FILE_SIZE) {
        continue;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!ALLOWED_CODE_EXTENSIONS.includes(ext)) {
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    Promise.all<FileInfo>(
      validFiles.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
              resolve({
                name: file.name,
                content: String(e.target?.result ?? ""),
                language: detectLanguageFromFilename(file.name),
              });
            };
            reader.onerror = () =>
              reject(new Error(`Lettura fallita: ${file.name}`));
            reader.readAsText(file);
          }),
      ),
    )
      .then((fileData) => {
        const merged = [...uploadedFiles, ...fileData].slice(
          0,
          MAX_UPLOAD_FILES,
        );
        applyFilesToEditor(merged, { autoAnalyze: true });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const removeUploadedFile = (index: number) => {
    const next = uploadedFiles.filter((_, i) => i !== index);
    if (next.length === 0) {
      setUploadedFiles([]);
      setActiveFileIndex(0);
      setCode("");
      setMessages([]);
      return;
    }
    setActiveFileIndex(Math.min(activeFileIndex, next.length - 1));
    applyFilesToEditor(next, { autoAnalyze: true });
  };

  const clearUploadedFiles = () => {
    setUploadedFiles([]);
    setActiveFileIndex(0);
    setCode("");
    setMessages([]);
  };

  const saveToNotes = async (explanationOverride?: string) => {
    if (!user?.email) {
      router.push(`/login?callbackUrl=/chat`);
      return;
    }
    const explanation =
      explanationOverride !== undefined
        ? explanationOverride
        : ([...messages].reverse().find((m) => m.role === "assistant")?.content || "");
    if (!explanation) {
      return;
    }
    const snippetCode = activeFile?.content ?? code;
    if (!snippetCode.trim()) {
      return;
    }
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snippet_code: snippetCode,
          explanation,
          language: activeFile?.language || detectedLang,
          source_type: "webapp",
          source_ref: currentChatId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore salvataggio");
      // Categorizzazione asincrona (non blocca la UX)
      fetch(`/api/notes/${data.note.id}/categorize`, { method: "POST" }).catch(() => { });
    } catch (error) {
      console.error("Impossibile salvare la nota.", error);
    }
  };

  const exportAnalysisReport = () => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last?.content) {
      return;
    }
    const md = `# Report Semplycode\n\n**Linguaggio:** ${getLanguageLabel(detectedLang)}\n**Tipo:** ${ANALYSIS_TYPE_LABELS[analysisType as keyof typeof ANALYSIS_TYPE_LABELS] || analysisType}\n**Data:** ${new Date().toLocaleString("it-IT")}\n\n---\n\n${last.content}`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `semplycode-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const shareAnalysis = async () => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last?.content) {
      return;
    }
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: {
            title: `Analisi ${getLanguageLabel(detectedLang)}`,
            language: detectedLang,
            analysis: last.content,
          },
          userId: user?.email || "guest",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShareUrl(data.url);
      await navigator.clipboard.writeText(data.url);
    } catch {
      console.error("Impossibile creare il link di condivisione.");
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
      applyFilesToEditor(
        [
          {
            name: data.name,
            content: data.content,
            language: detectLanguageFromFilename(data.name),
          },
        ],
        { autoAnalyze: true },
      );
      setGithubUrl("");
    } catch (e) {
      console.error("Errore import GitHub.", e);
    } finally {
      setIsGithubLoading(false);
    }
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
      applyFilesToEditor(data.files, { autoAnalyze: true });
      setInsightsTab("full");
    } catch (e) {
      console.error("Errore lettura ZIP.", e);
    } finally {
      setIsZipLoading(false);
    }
  };

  const performAutoAnalysis = async (
    currentCode: string,
    langOverride?: string,
    sourceFiles: FileInfo[] = uploadedFiles,
  ) => {
    if (!currentCode || !currentCode.trim() || currentCode.length < 5) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setMessages([{ role: "assistant", content: "" }]);

    const lang = langOverride || detectedLang;
    const lineCount = currentCode.split("\n").length;
    const needsLineRefs = lineCount > 50;
    const filesNote =
      sourceFiles.length > 0
        ? `\n\nOrigine: ${sourceFiles.length} file caricato/i (${sourceFiles.map((f) => f.name).join(", ")}). Analizza ogni file e, se pertinenti, le relazioni tra di essi.`
        : "";
    const errorNote =
      errorContext.trim() && (analysisType === "debug" || errorContext.trim())
        ? `\n\nMessaggio / stack trace dell'utente:\n\`\`\`\n${errorContext.trim()}\n\`\`\``
        : "";

    const systemPrompt = buildAnalysisSystemPrompt({
      analysisType,
      lang,
      needsLineRefs,
      hasErrorContext: Boolean(errorContext.trim()),
    });

    let accumulatedContent = "";

    try {
      postChatStream(
        [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analizza questo codice ${lang} (${lineCount} righe):${filesNote}${errorNote}\n\n\`\`\`${lang}\n${currentCode}\n\`\`\``,
          },
        ],
        (chunk) => {
          accumulatedContent += chunk;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: accumulatedContent, _streamed: true };
            }
            return next;
          });
        },
        (fullContent) => {
          setIsLoading(false);
          window.dispatchEvent(new Event("semplycode:stats:refresh"));

          if (user?.email && code.trim()) {
            const title =
              code.slice(0, 40) + (code.length > 40 ? "..." : "") ||
              "Analisi Codice";
            fetch("/api/chat/history", {
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
                  { role: "assistant", content: fullContent },
                ],
                language: detectedLang,
              }),
            })
              .then(() => loadChatHistory())
              .catch((err) => console.error("Auto-save failed:", err));
          }
        },
        (error) => {
          setIsLoading(false);
          const errMsg = error;
          if (error.includes("429") || error.includes("limite")) {
            setLimitModal({ message: errMsg });
          }
          setMessages([{ role: "assistant", content: `**${errMsg}**` }]);
        },
      );
    } catch (error) {
      const err = error as { status?: number; code?: string; message?: string };
      if (err?.status === 429) {
        setLimitModal({
          message: formatApiError(err as Error),
          code: err.code,
        });
      }
      setMessages([
        {
          role: "assistant",
          content: `**${formatApiError(err as Error)}**`,
        },
      ]);
      setIsLoading(false);
    }
  };

  const sendChatMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    const newUserMessage: Message = { role: "user", content: userMessage.trim() };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setChatInput("");
    setIsLoading(true);

    const placeholderMessage: Message = { role: "assistant", content: "" };
    const messagesWithPlaceholder = [...updatedMessages, placeholderMessage];
    setMessages(messagesWithPlaceholder);

    let accumulatedContent = "";

    try {
      const currentCode = activeFile?.content ?? code;
      const systemPrompt = `Sei un esperto Code Reviewer italiano. Rispondi in italiano in modo chiaro e utile. Il codice corrente è:\n\n\`\`\`${activeFile?.language || detectedLang}\n${currentCode}\n\`\`\`${errorContext.trim() ? `\n\nContesto errore:\n${errorContext.trim()}` : ""}`;

      postChatStream(
        [
          { role: "system", content: systemPrompt },
          ...updatedMessages,
        ],
        (chunk) => {
          accumulatedContent += chunk;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: accumulatedContent, _streamed: true };
            }
            return next;
          });
        },
        async (fullContent) => {
          const finalMessages = [...updatedMessages, { role: "assistant" as const, content: fullContent, _streamed: true }];
          setMessages(finalMessages);
          setIsLoading(false);
          window.dispatchEvent(new Event("semplycode:stats:refresh"));

          if (user?.email) {
            const isFirstMessageInNewChat =
              !currentChatId && messages.length === 0;
            try {
              const saveRes = await fetch("/api/chat/history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chatId: currentChatId,
                  messages: finalMessages,
                  language: detectedLang,
                  ...(isFirstMessageInNewChat && {
                    generateTitleFrom: userMessage.trim(),
                  }),
                }),
              });
              const saveData: { chat?: { _id?: string } } = await saveRes.json();
              if (saveData.chat?._id) {
                setCurrentChatId(saveData.chat._id);
              }
              loadChatHistory();
            } catch (err) {
              console.error("Auto-save failed:", err);
            }
          }
        },
        (error) => {
          const errMsg = error;
          if (error.includes("429") || error.includes("limite")) {
            setLimitModal({ message: errMsg });
          }
          setMessages((prev) => {
            const withError = [...prev];
            const last = withError[withError.length - 1];
            if (last?.role === "assistant" && !last.content) {
              withError[withError.length - 1] = { role: "assistant", content: `**${errMsg}**` };
            }
            return withError;
          });
          setIsLoading(false);
        },
      );
    } catch (err) {
      const error = err as { status?: number; code?: string; message?: string };
      if (error?.status === 429) {
        setLimitModal({ message: formatApiError(error as Error), code: error.code });
      }
      setMessages([...updatedMessages, { role: "assistant", content: `**${formatApiError(error as Error)}**` }]);
      setIsLoading(false);
    }
  };

  const performAutoAnalysisRef = useRef(performAutoAnalysis);
  useEffect(() => {
    performAutoAnalysisRef.current = performAutoAnalysis;
  }, [performAutoAnalysis]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const threshold = 200;
      const near = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
      setIsNearBottom(near);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isNearBottom]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("import") !== "true") return;

      const raw = localStorage.getItem("semplycode:imported-files");
      if (!raw) return;

      const imported = JSON.parse(raw);
      if (!Array.isArray(imported) || imported.length === 0) return;

      applyFilesToEditor(imported, { autoAnalyze: true });
      localStorage.removeItem("semplycode:imported-files");
      window.history.replaceState({}, "", "/chat");
    } catch (e) {
      console.error("Import files failed:", e);
    }
  }, []);

  const debouncedRef = useRef(
    debounce((nextCode: string) => {
      if (performAutoAnalysisRef.current)
        performAutoAnalysisRef.current(nextCode);
    }, 1200),
  );

  const autosaveRef = useRef(
    debounce((nextCode: string, lang: string) => {
      try {
        localStorage.setItem(
          "semplycode:draft:v1",
          JSON.stringify({
            code: nextCode,
            language: lang,
            savedAt: Date.now(),
          }),
        );
      } catch { }
    }, 1500),
  );

  useEffect(() => {
    return () => debouncedRef.current?.cancel();
  }, []);

  const handleCodeChange = (newCode: string) => {
    if (uploadedFiles.length > 0) {
      const updated = uploadedFiles.map((f, i) =>
        i === activeFileIndex ? { ...f, content: newCode } : f,
      );
      setUploadedFiles(updated);
      setCode(buildCombinedCodeFromFiles(updated));
      setDetectedLang(updated[activeFileIndex]?.language || detectLanguage(newCode));

      if (!newCode.trim()) {
        debouncedRef.current.cancel();
        setMessages([]);
        return;
      }
      if (newCode.trim().length > 5) {
        debouncedRef.current(newCode);
      }
      autosaveRef.current(newCode, detectLanguage(newCode));
      return;
    }

    setCode(newCode);
    setDetectedLang(detectLanguage(newCode));
    if (uploadedFiles.length > 0) setUploadedFiles([]);

    if (!newCode.trim()) {
      debouncedRef.current.cancel();
      setMessages([]);
      return;
    }

    if (newCode.trim().length > 5) {
      debouncedRef.current(newCode);
    }

    autosaveRef.current(newCode, detectLanguage(newCode));
  };

  const selectFileTab = (index: number) => {
    if (index < 0 || index >= uploadedFiles.length) return;
    setActiveFileIndex(index);
    setDetectedLang(uploadedFiles[index].language);
    setHighlightedLine(null);
  };

  const handleLineClick = (lineNumber: number) => {
    setHighlightedLine(lineNumber);

    const lineCount = (activeFile?.content ?? code).split("\n").length;
    if (lineNumber > 0 && lineNumber <= lineCount) {
      // Su mobile mostriamo sempre il tab editor quando si clicca una riga
      if (!isDesktop && activeMobilePanel !== "editor") setActiveMobilePanel("editor");

      editorRef.current?.scrollToLine(lineNumber);

      // Evidenziazione visiva (fallback sul DOM se il ref non è ancora pronto)
      setTimeout(() => {
        const editorElement = document.querySelector(".cm-editor");
        if (editorElement) {
          const lines = editorElement.querySelectorAll(".cm-line");
          if (lines[lineNumber - 1]) {
            lines[lineNumber - 1].classList.add("line-highlight");
          }
        }
      }, 50);
    }

    setTimeout(() => {
      setHighlightedLine(null);
      const editorElement = document.querySelector(".cm-editor");
      if (editorElement) {
        const highlighted = editorElement.querySelectorAll(".line-highlight");
        highlighted.forEach((el) => el.classList.remove("line-highlight"));
      }
    }, 3000);
  };

  const SIDEBAR_WIDTH = 260;
  const SIDEBAR_COLLAPSED = 70;
  const showSidebarLabels =
    isSidebarExpanded || (!isDesktop && isMobileSidebarOpen);
  const labelReveal = showSidebarLabels
    ? "opacity-100 max-w-[200px] delay-100"
    : "opacity-0 max-w-0 delay-0";

  const activeFile = uploadedFiles[activeFileIndex] ?? null;

  return (
    <div className="flex h-screen supports-[height:100dvh]:h-[100dvh] bg-[#0a0c10] text-gray-300 overflow-hidden font-sans">
      <AnimatePresence>
        {isDesktop && isSidebarExpanded && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 hidden md:block"
            onClick={() => setIsSidebarExpanded(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{
          width: isDesktop ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
          x: isDesktop ? 0 : isMobileSidebarOpen ? 0 : "-100%",
        }}
        transition={{ type: "tween", duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="fixed md:relative h-full shrink-0 md:overflow-visible z-30 md:z-50"
      >
        <motion.div
          initial={false}
          animate={{
            width: isDesktop
              ? isSidebarExpanded
                ? SIDEBAR_WIDTH
                : SIDEBAR_COLLAPSED
              : SIDEBAR_WIDTH,
          }}
          transition={{ type: "tween", duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          onMouseEnter={() => {
            if (isDesktop) setIsSidebarExpanded(true);
          }}
          onMouseLeave={() => {
            if (isDesktop) {
              setIsSidebarExpanded(false);
              setIsProfileOpen(false);
            }
          }}
          className={`h-full bg-[#0d1117] border-r border-emerald-900/30 ${isDesktop
              ? "absolute left-0 top-0 shadow-2xl overflow-hidden"
              : "relative overflow-hidden"
            }`}
        >
          <div
            className="h-full flex flex-col"
            style={{ width: SIDEBAR_WIDTH }}
          >
            <div className="flex items-center border-b border-emerald-900/20 h-16 shrink-0 w-full min-w-0">
              <div className="w-[70px] shrink-0 flex justify-center items-center py-4">
                <Link href="/" className="shrink-0 block">
                  <img
                    src="/semplycode.png"
                    alt="Semplycode"
                    className="w-10 h-10 rounded-xl"
                  />
                </Link>
              </div>
              {showSidebarLabels && (
                <span
                  className={`font-bold text-white whitespace-nowrap overflow-hidden transition-all duration-150 ease-out pr-3 ${labelReveal}`}
                >
                  Semplycode
                </span>
              )}
            </div>

            <nav className="flex-1 py-4 px-3 min-h-0 overflow-y-auto overflow-x-hidden">
              {!showSidebarLabels ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <button type="button" onClick={startNewChat} title="Nuova chat" aria-label="Nuova chat" className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-sm transition-colors">
                    <Plus size={18} />
                  </button>
                  <button type="button" onClick={() => setIsSidebarExpanded(true)} title="Cerca chat" aria-label="Cerca chat" className="w-10 h-10 rounded-xl bg-[#061014] border border-emerald-900/20 text-gray-400 hover:text-white hover:border-emerald-500/30 flex items-center justify-center transition-colors">
                    <Search size={16} />
                  </button>
                  <button type="button" onClick={() => setIsSidebarExpanded(true)} title="Progetti" aria-label="Progetti" className="w-10 h-10 rounded-xl bg-[#061014] border border-emerald-900/20 text-gray-400 hover:text-white hover:border-emerald-500/30 flex items-center justify-center transition-colors">
                    <FolderKanban size={16} />
                  </button>
                  <button type="button" onClick={() => setIsSidebarExpanded(true)} title="Chat recenti" aria-label="Chat recenti" className="w-10 h-10 rounded-xl bg-[#061014] border border-emerald-900/20 text-gray-400 hover:text-white hover:border-emerald-500/30 flex items-center justify-center transition-colors">
                    <FileCode size={16} />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {user ? (
                    <>
                      <button
                        type="button"
                        onClick={startNewChat}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white transition-all"
                      >
                        <Plus size={18} className="shrink-0" />
                        <span className="text-sm font-semibold whitespace-nowrap">
                          Nuova Chat
                        </span>
                      </button>

                      {/* Search filter */}
                      {chatHistory.length > 0 && (
                        <div className="relative mb-2">
                          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
                          <input
                            type="text"
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                            placeholder="Cerca chat..."
                            className="w-full bg-[#061014] border border-emerald-900/20 rounded-lg pl-8 pr-2 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-emerald-500/40"
                          />
                        </div>
                      )}

                      {/* --- SEZIONE PROGETTI --- */}
                      <div className="pt-1 pb-2 border-b border-emerald-900/20 space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            <FolderKanban size={13} className="text-emerald-400" />
                            <span>Progetti</span>
                            {projects.length > 0 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">
                                {projects.length}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsCreatingProject(!isCreatingProject)}
                            className="p-1 text-gray-400 hover:text-emerald-400 rounded-md hover:bg-emerald-950/40 transition-colors"
                            title="Nuovo progetto"
                            aria-label="Crea nuovo progetto"
                          >
                            <FolderPlus size={14} />
                          </button>
                        </div>

                        {/* Form creazione progetto inline */}
                        {isCreatingProject && (
                          <form
                            onSubmit={handleCreateProject}
                            className="p-2.5 rounded-xl bg-[#061014] border border-emerald-500/30 space-y-2 animate-in fade-in"
                          >
                            <input
                              autoFocus
                              type="text"
                              value={newProjectName}
                              onChange={(e) => setNewProjectName(e.target.value)}
                              placeholder="Nome progetto..."
                              className="w-full bg-[#010409] border border-emerald-900/40 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/60"
                            />

                            {/* Color dots */}
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="text-[10px] text-gray-500 mr-1">Colore:</span>
                              {PROJECT_COLORS.map((col) => (
                                <button
                                  key={col.id}
                                  type="button"
                                  onClick={() => setNewProjectColor(col.id)}
                                  className={`w-4 h-4 rounded-full ${col.bg} transition-transform ${newProjectColor === col.id ? "ring-2 ring-white scale-110" : "opacity-70 hover:opacity-100"
                                    }`}
                                  title={col.label}
                                />
                              ))}
                            </div>

                            <div className="flex gap-1.5 pt-1">
                              <button
                                type="submit"
                                className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-md transition-colors"
                              >
                                Crea
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCreatingProject(false);
                                  setNewProjectName("");
                                }}
                                className="px-2.5 py-1 text-[11px] text-gray-400 hover:text-white rounded-md border border-emerald-900/30"
                              >
                                Annulla
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Lista Progetti */}
                        {projects.length > 0 && (
                          <div className="space-y-1">
                            {projects.map((proj) => {
                              const colorConfig = getProjectColor(proj.color);
                              const isExpanded = !!expandedFolders[proj.id];
                              const projChats = chatHistory.filter((c) => chatProjectMap[c._id] === proj.id);
                              const filteredProjChats = projChats.filter((c) =>
                                !historySearch || c.title?.toLowerCase().includes(historySearch.toLowerCase())
                              );

                              return (
                                <div key={proj.id} className="rounded-lg bg-[#061014]/40 border border-emerald-900/15 overflow-hidden">
                                  {/* Progetto Header */}
                                  <div className="group/proj flex items-center justify-between p-1.5 hover:bg-emerald-950/20 transition-colors">
                                    <button
                                      type="button"
                                      onClick={() => setExpandedFolders((prev) => ({ ...prev, [proj.id]: !isExpanded }))}
                                      className="flex items-center gap-1.5 flex-1 min-w-0 text-left cursor-pointer"
                                    >
                                      <ChevronRight
                                        size={12}
                                        className={`text-gray-500 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                      />
                                      <Folder size={13} className={colorConfig.text} />
                                      {renameProjectId === proj.id ? (
                                        <form
                                          onSubmit={(e) => handleRenameProject(e, proj.id)}
                                          onClick={(e) => e.stopPropagation()}
                                          className="flex items-center gap-1 flex-1 min-w-0"
                                        >
                                          <input
                                            autoFocus
                                            type="text"
                                            value={renameProjectTitle}
                                            onChange={(e) => setRenameProjectTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Escape") setRenameProjectId(null);
                                            }}
                                            className="bg-[#010409] border border-emerald-500/50 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-full"
                                          />
                                          <button type="submit" className="p-0.5 text-emerald-400">
                                            <Check size={11} />
                                          </button>
                                        </form>
                                      ) : (
                                        <span className="text-xs font-semibold text-gray-300 truncate">
                                          {proj.name}
                                        </span>
                                      )}
                                    </button>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <span className="text-[10px] text-gray-500 px-1.5 py-0.2 rounded-full bg-emerald-950/40">
                                        {projChats.length}
                                      </span>
                                      <div className="opacity-0 group-hover/proj:opacity-100 flex items-center gap-0.5 transition-opacity">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setRenameProjectId(proj.id);
                                            setRenameProjectTitle(proj.name);
                                          }}
                                          className="p-1 text-gray-500 hover:text-emerald-400 rounded"
                                          title="Rinomina progetto"
                                        >
                                          <PenLine size={11} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => handleDeleteProject(e, proj.id)}
                                          className="p-1 text-gray-500 hover:text-red-400 rounded"
                                          title="Elimina progetto"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Chat del progetto */}
                                  {isExpanded && (
                                    <div className="pl-3 pr-1 pb-1 pt-0.5 space-y-0.5 border-l-2 border-emerald-500/20 ml-2.5 my-1">
                                      {filteredProjChats.length === 0 ? (
                                        <p className="py-1 px-2 text-[11px] text-gray-600 italic">
                                          Nessuna chat in questo progetto
                                        </p>
                                      ) : (
                                        filteredProjChats.map((chat) => (
                                          <div
                                            key={chat._id}
                                            role={renameChat?.chatId === chat._id ? undefined : "button"}
                                            tabIndex={renameChat?.chatId === chat._id ? undefined : 0}
                                            aria-current={currentChatId === chat._id ? "true" : undefined}
                                            onClick={() => {
                                              if (renameChat?.chatId !== chat._id) loadChat(chat);
                                            }}
                                            onKeyDown={(e) => {
                                              if (renameChat?.chatId === chat._id) return;
                                              if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                loadChat(chat);
                                              }
                                            }}
                                            className={`group flex items-center justify-between gap-1 p-1.5 rounded-md cursor-pointer text-xs outline-none transition-colors ${currentChatId === chat._id
                                                ? "bg-emerald-900/30 text-primary border border-emerald-500/20"
                                                : "text-gray-400 hover:bg-emerald-950/30 hover:text-gray-200"
                                              }`}
                                          >
                                            {renameChat?.chatId === chat._id ? (
                                              <form
                                                className="flex items-center gap-1 flex-1 min-w-0"
                                                onSubmit={(e) => {
                                                  e.preventDefault();
                                                  submitRenameChat();
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <input
                                                  autoFocus
                                                  type="text"
                                                  value={renameChat.title}
                                                  onChange={(e) => setRenameChat({ chatId: chat._id, title: e.target.value })}
                                                  onKeyDown={(e) => {
                                                    if (e.key === "Escape") setRenameChat(null);
                                                  }}
                                                  className="flex-1 min-w-0 bg-[#010409] border border-emerald-500/40 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                                                />
                                                <button
                                                  type="submit"
                                                  className="p-0.5 text-emerald-400 hover:text-emerald-300 shrink-0"
                                                  aria-label="Salva nome"
                                                >
                                                  <Check size={11} />
                                                </button>
                                              </form>
                                            ) : (
                                              <>
                                                <span className="truncate flex-1 pr-1 font-medium">
                                                  {chat.title}
                                                </span>
                                                <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                                                  <button
                                                    type="button"
                                                    onClick={(e: ReactMouseEvent) => {
                                                      e.stopPropagation();
                                                      setMoveChatTarget({ chatId: chat._id, currentProjId: proj.id });
                                                    }}
                                                    className="p-1 text-gray-500 hover:text-emerald-400 rounded hover:bg-emerald-950/40"
                                                    title="Sposta chat in un altro progetto"
                                                    aria-label="Sposta in progetto"
                                                  >
                                                    <FolderInput size={11} />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={(e: ReactMouseEvent) => {
                                                      e.stopPropagation();
                                                      setExportMenuChatId(chat._id);
                                                    }}
                                                    className="p-1 text-gray-500 hover:text-emerald-400 rounded hover:bg-emerald-950/40"
                                                    title="Esporta chat o codice"
                                                    aria-label="Esporta chat"
                                                  >
                                                    <Download size={11} />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={(e: ReactMouseEvent) => {
                                                      e.stopPropagation();
                                                      setRenameChat({ chatId: chat._id, title: chat.title || "" });
                                                    }}
                                                    className="p-1 text-gray-500 hover:text-emerald-400 rounded hover:bg-emerald-950/40"
                                                    title="Rinomina chat"
                                                    aria-label="Rinomina chat"
                                                  >
                                                    <PenLine size={11} />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={(e: ReactMouseEvent) => deleteChat(e, chat._id)}
                                                    className="p-1 text-gray-500 hover:text-red-400 rounded hover:bg-red-950/40"
                                                    title="Elimina chat"
                                                    aria-label="Elimina chat"
                                                  >
                                                    <Trash2 size={11} />
                                                  </button>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* --- SEZIONE CHAT RECENTI / SENZA PROGETTO --- */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between px-1 mb-1">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            {projects.length > 0 ? "Senza Progetto" : "Chat Recenti"}
                          </span>
                          <span className="text-[10px] text-gray-600">
                            {chatHistory.filter((c) => !chatProjectMap[c._id]).length}
                          </span>
                        </div>

                        {isHistoryLoading ? (
                          Array.from({ length: 3 }).map((_, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-lg bg-[#061014] border border-emerald-900/10 animate-pulse"
                            >
                              <div className="skeleton h-3 w-4/6 mb-2"></div>
                              <div className="skeleton h-2 w-5/6"></div>
                            </div>
                          ))
                        ) : chatHistory.filter((c) => !chatProjectMap[c._id]).length === 0 ? (
                          <p className="px-2 py-2 text-xs text-gray-600">
                            {projects.length > 0 ? "Tutte le chat sono organizzate nei progetti" : "Nessuna chat salvata"}
                          </p>
                        ) : (
                          chatHistory
                            .filter((chat) => chat && !chatProjectMap[chat._id] && (
                              !historySearch ||
                              chat.title?.toLowerCase().includes(historySearch.toLowerCase())
                            ))
                            .map((chat) => (
                              <div
                                key={chat._id}
                                role={renameChat?.chatId === chat._id ? undefined : "button"}
                                tabIndex={renameChat?.chatId === chat._id ? undefined : 0}
                                aria-current={currentChatId === chat._id ? "true" : undefined}
                                onClick={() => {
                                  if (renameChat?.chatId !== chat._id) loadChat(chat);
                                }}
                                onKeyDown={(e) => {
                                  if (renameChat?.chatId === chat._id) return;
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    loadChat(chat);
                                  }
                                }}
                                className={`group flex items-center justify-between gap-1 p-2 rounded-lg cursor-pointer text-xs outline-none transition-colors ${currentChatId === chat._id
                                    ? "bg-emerald-900/30 text-primary border border-emerald-500/20"
                                    : "text-gray-400 hover:bg-emerald-950/30 hover:text-gray-200"
                                  }`}
                              >
                                {renameChat?.chatId === chat._id ? (
                                  <form
                                    className="flex items-center gap-1 flex-1 min-w-0"
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      submitRenameChat();
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      autoFocus
                                      type="text"
                                      value={renameChat.title}
                                      onChange={(e) => setRenameChat({ chatId: chat._id, title: e.target.value })}
                                      onKeyDown={(e) => {
                                        if (e.key === "Escape") setRenameChat(null);
                                      }}
                                      className="flex-1 min-w-0 bg-[#010409] border border-emerald-500/40 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                    />
                                    <button
                                      type="submit"
                                      className="p-1 text-emerald-400 hover:text-emerald-300 shrink-0"
                                      aria-label="Salva nome"
                                    >
                                      <Check size={12} />
                                    </button>
                                  </form>
                                ) : (
                                  <>
                                    <span className="truncate flex-1 pr-1 font-medium">
                                      {chat.title}
                                    </span>
                                    <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={(e: ReactMouseEvent) => {
                                          e.stopPropagation();
                                          setMoveChatTarget({ chatId: chat._id });
                                        }}
                                        className="p-1 text-gray-500 hover:text-emerald-400 rounded hover:bg-emerald-950/40"
                                        title="Sposta in un progetto"
                                        aria-label="Sposta in progetto"
                                      >
                                        <FolderInput size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e: ReactMouseEvent) => {
                                          e.stopPropagation();
                                          setExportMenuChatId(chat._id);
                                        }}
                                        className="p-1 text-gray-500 hover:text-emerald-400 rounded hover:bg-emerald-950/40"
                                        title="Esporta chat o codice"
                                        aria-label="Esporta chat"
                                      >
                                        <Download size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e: ReactMouseEvent) => {
                                          e.stopPropagation();
                                          setRenameChat({ chatId: chat._id, title: chat.title || "" });
                                        }}
                                        className="p-1 text-gray-500 hover:text-emerald-400 rounded hover:bg-emerald-950/40"
                                        title="Rinomina chat"
                                        aria-label="Rinomina chat"
                                      >
                                        <PenLine size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e: ReactMouseEvent) => deleteChat(e, chat._id)}
                                        className="p-1 text-gray-500 hover:text-red-400 rounded hover:bg-red-950/40"
                                        title="Elimina chat"
                                        aria-label="Elimina chat"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-3 rounded-xl border border-emerald-900/25 bg-[#061014]/60 space-y-2">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Accedi per salvare la cronologia e ottenere 10 analisi al giorno.
                      </p>
                      <Link
                        href="/login"
                        className="block text-center text-xs font-semibold py-2 rounded-lg border border-emerald-900/40 text-gray-300 hover:text-primary"
                      >
                        Accedi
                      </Link>
                      <Link
                        href="/register"
                        className="block text-center text-xs font-semibold py-2 rounded-lg bg-primary text-white"
                      >
                        Registrati gratis
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </nav>

            <div className="p-3 border-t border-emerald-900/20 shrink-0 overflow-visible relative z-60">
              {user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isProfileOpen;
                      setIsProfileOpen(next);
                      if (next && isDesktop) setIsSidebarExpanded(true);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-900/20 transition-colors min-w-0"
                  >
                    <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-primary flex items-center justify-center ring-2 ring-emerald-900/40">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={16} className="text-white" />
                      )}
                    </div>
                    <div
                      className={`flex-1 text-left min-w-0 overflow-hidden transition-all duration-150 ease-out ${labelReveal}`}
                    >
                      <p className="text-sm font-medium text-white truncate whitespace-nowrap">
                        {user.firstName || user.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-gray-500 truncate whitespace-nowrap">
                        {user.email}
                      </p>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-gray-500 overflow-hidden transition-all duration-150 ease-out ${showSidebarLabels ? "opacity-100 w-4 delay-100" : "opacity-0 w-0"} ${isProfileOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <>
                        <motion.div
                          key="profile-backdrop"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-55"
                          onClick={() => setIsProfileOpen(false)}
                          aria-hidden
                        />
                        <motion.div
                          key="profile-menu"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full left-0 mb-2 w-56 z-100 bg-[#0d1117] border border-emerald-900/30 rounded-xl shadow-2xl overflow-hidden"
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
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-900/20 text-gray-500 transition-colors"
                >
                  <User size={20} className="shrink-0" />
                  <span
                    className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-150 ease-out ${labelReveal}`}
                  >
                    Accedi
                  </span>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </motion.aside>

      <main className="flex-1 flex min-w-0 overflow-hidden relative z-0">
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
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeMobilePanel === "editor"
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:bg-emerald-900/20"
                  }`}
              >
                Editor
              </button>
              <button
                onClick={() => setActiveMobilePanel("insights")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeMobilePanel === "insights"
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:bg-emerald-900/20"
                  }`}
              >
                Chat AI
              </button>
            </div>
          </div>
        </div>

        <section
          className={`flex-1 flex flex-col border-r border-emerald-900/30 bg-[#0a0c10] md:flex ${activeMobilePanel === "editor" ? "flex" : "hidden md:flex"} md:mt-0 mt-14`}
        >
          <div className="h-14 sm:h-16 border-b border-emerald-900/20 flex items-center justify-between px-3 sm:px-6 bg-[#0d1117]/50 gap-2 sm:gap-4">
            {code.trim() || activeFile ? (
              <div className="flex items-center gap-2 min-w-0">
                <Cpu size={14} className="text-primary shrink-0" />
                <span className="text-xs font-semibold text-primary tracking-wide truncate">
                  {activeFile ? getLanguageLabel(activeFile.language) : getLanguageLabel(detectedLang)}
                </span>
              </div>
            ) : (
              <span className="shrink-0" aria-hidden />
            )}
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <div className="flex items-center rounded-full bg-[#0d1117] border border-emerald-900/30 p-1 gap-1" role="tablist" aria-label="Modalità AI">
                {(['correction','revision','creation'] as const).map((mode) => {
                  const active = analysisType === mode;
                  const label = ANALYSIS_TYPE_LABELS[mode];
                  const desc = ANALYSIS_TYPE_DESCRIPTIONS[mode];
                  return (
                    <button
                      key={mode}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      title={desc}
                      onClick={() => setAnalysisType(mode)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${active ? 'bg-emerald-500 text-white shadow' : 'text-gray-400 hover:text-emerald-300 hover:bg-emerald-900/30'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <select
                value={['correction','revision','creation'].includes(analysisType) ? '' : analysisType}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => { if (e.target.value) setAnalysisType(e.target.value); }}
                className="bg-[#0d1117]/80 border border-emerald-900/30 rounded-xl px-2 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider focus:outline-none focus:border-primary hidden lg:block"
                title="Altre analisi (legacy)"
              >
                <option value="">Altro…</option>
                {(['full','security','performance','style','debug'] as const).map((k) => (
                  <option key={k} value={k}>{ANALYSIS_TYPE_LABELS[k]}</option>
                ))}
              </select>
              <QuotaBadge className="hidden sm:flex" />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.go,.rs,.php,.sql,.css,.html,.json"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const selected = Array.from(e.target.files || []);
                  handleCodeFiles(selected);
                  e.target.value = "";
                }}
              />
              {uploadedFiles.length > 0 && (
                <span className="text-[10px] text-primary font-mono">
                  {uploadedFiles.length} file
                </span>
              )}
            </div>
          </div>
          {uploadedFiles.length > 0 && (
            <div className="flex items-center border-b border-emerald-900/20 bg-[#0d1117]/60 overflow-x-auto custom-scrollbar shrink-0" role="tablist" aria-label="File aperti">
              {uploadedFiles.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  role="tab"
                  aria-selected={activeFileIndex === i}
                  onClick={() => selectFileTab(i)}
                  className={`group flex items-center gap-2 px-3 py-2 text-[11px] font-mono whitespace-nowrap border-r border-emerald-900/20 transition-colors cursor-pointer ${activeFileIndex === i
                      ? "bg-[#010409] text-primary border-t-2 border-t-emerald-400"
                      : "text-gray-500 hover:text-gray-300 hover:bg-[#0a0c10]"
                    }`}
                >
                  <FileText size={12} className="shrink-0 text-primary/70" />
                  <span className="max-w-[140px] truncate">{file.name}</span>
                  <button
                    type="button"
                    aria-label={`Chiudi ${file.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeUploadedFile(i);
                    }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-gray-600 hover:text-red-400 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {!sessionUser && (
            <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 flex items-center justify-between gap-2 text-xs shrink-0">
              <span className="text-gray-400">
                Ospite: 3 analisi gratuite al giorno.
              </span>
              <Link
                href="/register"
                className="shrink-0 font-semibold text-primary hover:underline"
              >
                Registrati (10/giorno)
              </Link>
            </div>
          )}
          <div
            className="flex-1 overflow-auto custom-scrollbar font-mono text-sm bg-[#0a0c10] min-h-0"

          >
            {typeof window !== "undefined" && window.innerWidth < 640 ? (
              <textarea
                value={activeFile?.content ?? code}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleCodeChange(e.target.value)}
                className="w-full h-full p-4 bg-[#010409] text-sm font-mono text-gray-100 outline-none"
                placeholder="Scrivi o incolla il codice qui..."
              />
            ) : (
              <EditorWrapper
                ref={editorRef}
                value={activeFile?.content ?? code}
                onChange={handleCodeChange}
                detectedLang={detectedLang}
              />
            )}
          </div>
        </section>

        <section
          aria-hidden={activeMobilePanel !== "insights"}
          className={`flex-1 flex flex-col border-r border-emerald-900/30 bg-[#0d1117]/30 md:flex ${activeMobilePanel === "insights" ? "flex" : "hidden md:flex"} md:mt-0 mt-14`}
        >
          <div className="h-14 sm:h-16 border-b border-emerald-900/20 flex items-center justify-between px-3 sm:px-6 bg-[#0d1117]/50 md:flex shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setInsightsTab("full")}
                className={`flex items-center gap-1.5 pb-4 pt-4 border-b-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${insightsTab === "full"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-400"
                  }`}
              >
                <Brain size={14} />
                Analisi Completa
              </button>
              <button
                onClick={() => setInsightsTab("files")}
                className={`flex items-center gap-1.5 pb-4 pt-4 border-b-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${insightsTab === "files"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-400"
                  }`}
              >
                <Upload size={14} />
                Carica File
                {uploadedFiles.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[9px]">
                    {uploadedFiles.length}
                  </span>
                )}
              </button>
            </div>
            {insightsTab === "full" && messages.some((m) => m.role === "assistant") && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setExportMenuChatId(currentChatId || "current")}
                  className="p-2 text-gray-500 hover:text-primary rounded-lg"
                  title="Esporta chat o solo codice"
                >
                  <Download size={16} />
                </button>
                <button
                  type="button"
                  onClick={shareAnalysis}
                  className="p-2 text-gray-500 hover:text-primary rounded-lg"
                  title="Condividi analisi"
                >
                  <Share2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => saveToNotes()}
                  className="p-2 text-gray-500 hover:text-emerald-400 rounded-lg"
                  title="Salva nel cassetto"
                >
                  <Bookmark size={16} />
                </button>
              </div>
            )}
          </div>

          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar">
            {insightsTab === "full" ? (
              <AnimatePresence mode="wait">
                {messages.length === 0 && isLoading ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-[#061014] border border-emerald-900/10 rounded-xl">
                      <div className="skeleton h-3 w-3/5 mb-3"></div>
                      <div className="skeleton h-2 w-full mb-2"></div>
                      <div className="skeleton h-2 w-5/6"></div>
                    </div>

                    <div className="p-4 bg-[#061014] border border-emerald-900/10 rounded-xl">
                      <div className="skeleton h-3 w-2/5 mb-3"></div>
                      <div className="skeleton h-2 w-full mb-2"></div>
                      <div className="skeleton h-2 w-4/6"></div>
                    </div>

                    <div className="p-4 bg-[#061014] border border-emerald-900/10 rounded-xl">
                      <div className="skeleton h-3 w-1/3 mb-3"></div>
                      <div className="skeleton h-2 w-full mb-2"></div>
                      <div className="skeleton h-2 w-3/6"></div>
                    </div>
                  </motion.div>
                ) : messages.length === 0 && !isLoading ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center px-4"
                  >
                    <Sparkles size={36} className="mb-3 text-primary" />
                    <p className="text-sm text-gray-400 mb-6">
                      Incolla il codice nell&apos;editor e l&apos;analisi partirà automaticamente
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 max-w-xs">
                      {["Trova bug", "Ottimizza", "Spiega codice", "Suggerisci fix"].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setChatInput(suggestion.toLowerCase());
                          }}
                          className="px-3 py-1.5 text-xs rounded-xl border border-emerald-900/30 text-gray-400 hover:text-primary hover:border-primary/40 transition-all bg-[#061014]/50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div key="content" className="flex flex-col gap-4 pb-2">
                    {messages.map((m, i) => (
                      <ChatMessage
                        key={`${m.role}-${i}`}
                        message={m}
                        onLineClick={handleLineClick}
                        enableTyping={
                          m.role === "assistant" &&
                          i === messages.length - 1 &&
                          !isLoading &&
                          !m._streamed
                        }
                        onRegenerate={
                          m.role === "assistant" &&
                            i === messages.length - 1 &&
                            !isLoading
                            ? () => regenerateMessage(i)
                            : undefined
                        }
                        onSave={
                          m.role === "assistant" && m.content
                            ? () => saveToNotes(m.content)
                            : undefined
                        }
                        highlightedLine={highlightedLine}
                      />
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl px-4 py-3 bg-[#061014]/90 border border-emerald-900/25">
                          <div className="flex gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                            <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                            <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </AnimatePresence>
            ) : (
              <div className="h-full flex flex-col space-y-4">
                <div
                  onDrop={(e: DragEvent) => {
                    e.preventDefault();
                    setIsDraggingFiles(false);
                    handleCodeFiles(Array.from(e.dataTransfer.files));
                  }}
                  onDragOver={(e: DragEvent) => {
                    e.preventDefault();
                    setIsDraggingFiles(true);
                  }}
                  onDragLeave={() => setIsDraggingFiles(false)}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isDraggingFiles
                      ? "border-primary bg-primary/5"
                      : "border-emerald-900/30 hover:border-emerald-800/50"
                    }`}
                >
                  <Upload
                    size={28}
                    className="mx-auto mb-3 text-primary opacity-80"
                  />
                  <p className="text-sm font-semibold text-white mb-1">
                    Trascina i file di codice qui
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    L&apos;AI li leggerà e avvierà l&apos;analisi automaticamente
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#061014] border border-emerald-900/30 rounded-xl text-xs font-medium text-gray-300 hover:text-primary hover:border-primary/40 transition-colors"
                  >
                    <FileText size={14} />
                    Scegli dal computer
                  </button>
                  <p className="text-[10px] text-gray-600 mt-3">
                    Max {MAX_UPLOAD_FILES} file &middot; 100KB ciascuno &middot; JS, TS, Python,
                    Java, Go, Rust&hellip;
                  </p>
                  <input
                    ref={zipInputRef}
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const f = e.target.files?.[0];
                      if (f) handleZipUpload(f);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    disabled={isZipLoading}
                    onClick={() => zipInputRef.current?.click()}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 border border-emerald-900/30 rounded-xl text-xs text-gray-400 hover:text-primary disabled:opacity-50"
                  >
                    <Archive size={14} />
                    {isZipLoading ? "Estrazione ZIP&hellip;" : "Carica archivio ZIP"}
                  </button>
                </div>

                <div className="p-4 bg-[#0a0c10]/80 border border-emerald-900/20 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                    <Github size={14} className="text-primary" />
                    Importa da GitHub
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/.../blob/main/file.js"
                      className="flex-1 bg-[#010409] border border-emerald-900/30 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      disabled={isGithubLoading || !githubUrl.trim()}
                      onClick={importFromGitHub}
                      className="px-3 py-2 text-xs font-semibold bg-primary/20 text-primary rounded-xl hover:bg-primary/30 disabled:opacity-50"
                    >
                      {isGithubLoading ? "&hellip;" : "Importa"}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-[#0a0c10]/80 border border-emerald-900/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                    <AlertCircle size={14} className="text-amber-400" />
                    Messaggio di errore / stack trace
                  </div>
                  <textarea
                    value={errorContext}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setErrorContext(e.target.value)}
                    rows={4}
                    placeholder="Incolla l'errore del terminale o lo stack trace&hellip;"
                    className="w-full bg-[#010409] border border-emerald-900/30 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-primary font-mono"
                  />
                  <p className="text-[10px] text-gray-600">
                    Seleziona tipo &quot;Debug errore&quot; e carica il codice per un&apos;analisi mirata.
                  </p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400">
                        File caricati ({uploadedFiles.length}/{MAX_UPLOAD_FILES})
                      </span>
                      <button
                        type="button"
                        onClick={clearUploadedFiles}
                        className="text-[10px] text-red-400 hover:text-red-300"
                      >
                        Rimuovi tutti
                      </button>
                    </div>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between gap-3 p-3 bg-[#0a0c10]/80 border border-emerald-900/20 rounded-xl"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText
                              size={16}
                              className="text-primary shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-sm text-white truncate">
                                {file.name}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {file.language}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeUploadedFile(index)}
                            className="text-[10px] text-gray-500 hover:text-red-400 shrink-0"
                          >
                            Rimuovi
                          </button>
                        </div>
                      ))}
                    </div>
                    {isLoading && (
                      <p className="text-xs text-primary animate-pulse text-center">
                        Analisi AI in corso sui file caricati&hellip;
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-2.5 sm:p-4 border-t border-emerald-900/20 bg-[#0a0c10]/80">
            <div className="flex gap-2 items-end">
              <textarea
                value={chatInput}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setChatInput(e.target.value)}
                onKeyDown={(e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage(chatInput);
                  }
                }}
                rows={1}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
                }}
                placeholder="Chiedi all'AI qualsiasi cosa sul codice..."
                className="flex-1 bg-[#010409] border border-emerald-900/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary resize-none max-h-[140px] custom-scrollbar"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => sendChatMessage(chatInput)}
                disabled={!chatInput.trim() || isLoading}
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
            <p className="text-[10px] text-gray-600 mt-1.5 text-center">
              Invio con Enter &middot; Shift+Enter per andare a capo &middot; L&apos;AI ha sempre il contesto del codice corrente
            </p>
          </div>
        </section>


      </main>

      {showOnboarding && (
        <Onboarding onClose={() => setShowOnboarding(false)} />
      )}

      {applyModal && (
        <CodeApplyModal
          oldCode={applyModal.oldCode}
          newCode={applyModal.newCode}
          onClose={() => setApplyModal(null)}
          onApply={(newCode: string) => {
            setCode(newCode);
            setDetectedLang(detectLanguage(newCode));
            setUploadedFiles([]);
            setApplyModal(null);
            performAutoAnalysisRef.current?.(newCode);
          }}
        />
      )}

      {limitModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4">
          <div className="max-w-md w-full bg-[#0d1117] border border-emerald-900/40 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Limite raggiunto</h3>
            <p className="text-sm text-gray-400 mb-6">{limitModal.message}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              {limitModal.code === "GUEST_LIMIT" ? (
                <Link
                  href="/register"
                  className="flex-1 text-center py-2.5 rounded-xl bg-primary text-white font-semibold text-sm"
                  onClick={() => setLimitModal(null)}
                >
                  Crea account gratuito
                </Link>
              ) : (
                <Link
                  href="/#pricing"
                  className="flex-1 text-center py-2.5 rounded-xl bg-primary text-white font-semibold text-sm"
                  onClick={() => setLimitModal(null)}
                >
                  Passa a Pro
                </Link>
              )}
              <button
                type="button"
                onClick={() => setLimitModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-emerald-900/30 text-gray-400 text-sm"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {shareUrl && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#0d1117] border border-primary/40 rounded-xl text-xs text-gray-300 shadow-xl max-w-md truncate">
          Link copiato: {shareUrl}
          <button
            type="button"
            className="ml-2 text-primary"
            onClick={() => setShareUrl(null)}
          >
            OK
          </button>
        </div>
      )}

      {moveChatTarget && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="max-w-md w-full bg-[#0d1117] border border-emerald-900/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderInput size={18} className="text-emerald-400" /> Sposta in Progetto
              </h3>
              <button
                type="button"
                onClick={() => setMoveChatTarget(null)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Scegli il progetto in cui organizzare questa chat AI:
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => handleAssignChatToProject(moveChatTarget.chatId, null)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all ${!moveChatTarget.currentProjId
                    ? "bg-emerald-900/30 border-emerald-500/40 text-white font-semibold"
                    : "bg-[#061014] border-emerald-900/20 text-gray-300 hover:border-emerald-500/30"
                  }`}
              >
                <span className="flex items-center gap-2">
                  <FolderX size={16} className="text-gray-500" /> Nessun progetto (Senza progetto)
                </span>
                {!moveChatTarget.currentProjId && <Check size={14} className="text-emerald-400" />}
              </button>

              {projects.map((proj) => {
                const colorConfig = getProjectColor(proj.color);
                const isCurrent = moveChatTarget.currentProjId === proj.id;
                return (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => handleAssignChatToProject(moveChatTarget.chatId, proj.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all ${isCurrent
                        ? "bg-emerald-900/30 border-emerald-500/40 text-white font-semibold"
                        : "bg-[#061014] border-emerald-900/20 text-gray-300 hover:border-emerald-500/30"
                      }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={`w-3 h-3 rounded-full ${colorConfig.bg}`} />
                      <span className="font-medium text-white">{proj.name}</span>
                    </span>
                    {isCurrent && <Check size={14} className="text-emerald-400" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-emerald-900/20 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMoveChatTarget(null);
                  setIsCreatingProject(true);
                  if (isDesktop) setIsSidebarExpanded(true);
                }}
                className="flex-1 py-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded-xl hover:bg-emerald-900/40 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> Crea Nuovo Progetto
              </button>
              <button
                type="button"
                onClick={() => setMoveChatTarget(null)}
                className="px-4 py-2 text-xs text-gray-400 border border-emerald-900/30 rounded-xl hover:text-white"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {exportMenuChatId && (() => {
        const targetChat =
          exportMenuChatId === "current"
            ? {
              _id: currentChatId || "current",
              title: "Conversazione Corrente",
              messages: messages,
              language: detectedLang,
            }
            : chatHistory.find((c) => c._id === exportMenuChatId) || {
              _id: exportMenuChatId,
              title: "Conversazione",
              messages: messages,
              language: detectedLang,
            };

        return (
          <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
            <div className="max-w-md w-full bg-[#0d1117] border border-emerald-900/40 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Download size={18} className="text-emerald-400" /> Esporta Chat o Codice
                </h3>
                <button
                  type="button"
                  onClick={() => setExportMenuChatId(null)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-gray-400">
                Seleziona il formato di esportazione per <span className="text-white font-medium">&quot;{targetChat.title}&quot;</span>:
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleExportChat(targetChat, "full")}
                  className="w-full flex items-start gap-3 p-3.5 rounded-xl border border-emerald-900/30 bg-[#061014] hover:bg-emerald-950/40 hover:border-emerald-500/40 text-left transition-all group"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                    <FileText size={20} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">Esporta l&apos;intera chat (.md)</span>
                    <span className="text-xs text-gray-400 leading-relaxed block mt-0.5">
                      Scarica tutta la conversazione con domande, spiegazioni e blocchi di codice in formato Markdown formattato.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportChat(targetChat, "code")}
                  className="w-full flex items-start gap-3 p-3.5 rounded-xl border border-emerald-900/30 bg-[#061014] hover:bg-emerald-950/40 hover:border-emerald-500/40 text-left transition-all group"
                >
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                    <FileCode size={20} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white block">Esporta solo il file con il codice</span>
                    <span className="text-xs text-gray-400 leading-relaxed block mt-0.5">
                      Riconosce automaticamente il linguaggio (es. <code className="text-emerald-400">.py</code>, <code className="text-emerald-400">.ts</code>, <code className="text-emerald-400">.html</code>) e scarica il file con l&apos;estensione esatta.
                    </span>
                  </div>
                </button>
              </div>

              <div className="pt-2 border-t border-emerald-900/20 flex items-center justify-between text-[11px] text-gray-500">
                <Link
                  href="/settings"
                  className="hover:text-emerald-400 underline underline-offset-2 flex items-center gap-1"
                  onClick={() => setExportMenuChatId(null)}
                >
                  <Settings size={12} /> Configura cartella / prefisso nelle impostazioni
                </Link>
                <button
                  type="button"
                  onClick={() => setExportMenuChatId(null)}
                  className="px-3 py-1 text-gray-400 hover:text-white rounded-lg"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {exportNotice && (
        <div className="fixed bottom-6 right-6 z-100 flex items-center gap-2.5 px-4 py-3 bg-[#061014] border border-emerald-500/50 text-white rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <Check size={16} className="text-emerald-400 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {confirmDeleteChatId && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4">
          <div className="max-w-sm w-full bg-[#0d1117] border border-emerald-900/40 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Elimina chat</h3>
            <p className="text-sm text-gray-400 mb-6">
              Sei sicuro di voler eliminare questa chat? L&apos;operazione non può essere annullata.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmDeleteChat}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-500 transition-colors"
              >
                Elimina
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteChatId(null)}
                className="flex-1 py-2.5 rounded-xl border border-emerald-900/30 text-gray-400 text-sm hover:text-white transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

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
          background: rgba(16, 185, 129, 0.12) !important;
          border-left: 3px solid #10b981 !important;
          animation: line-pulse 1.5s ease-in-out infinite !important;
        }

        @keyframes line-pulse {
          0%, 100% {
            background: rgba(16, 185, 129, 0.12);
          }
          50% {
            background: rgba(16, 185, 129, 0.22);
          }
        }

        .skeleton {
          background: #021012;
          position: relative;
          overflow: hidden;
          border-radius: 6px;
        }
        .skeleton::after {
          content: "";
          position: absolute;
          top: 0;
          left: -120%;
          height: 100%;
          width: 120%;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.04) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: shimmer 1.2s infinite;
        }

        @keyframes shimmer {
          0% {
            left: -120%;
          }
          100% {
            left: 120%;
          }
        }

        .card {
          background: linear-gradient(
            180deg,
            rgba(6, 16, 20, 0.6),
            rgba(4, 12, 14, 0.6)
          );
          border: 1px solid rgba(6, 30, 24, 0.08);
          padding: 12px;
          border-radius: 12px;
          box-shadow: 0 6px 16px rgba(2, 6, 8, 0.6);
        }
        .card-ghost {
          background: transparent;
          border: 1px dashed rgba(6, 30, 24, 0.06);
          padding: 10px;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
