"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/apiClient";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bookmark,
  Search,
  Tag,
  Calendar,
  Globe,
  Code2,
  Trash2,
  X,
  Sparkles,
  RefreshCw,
  Check,
  GraduationCap,
  Layers,
  Plus,
  ExternalLink,
  Loader2,
  FileText,
  Clock,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { SkeletonSettings } from "@/app/components/Skeleton";
import type {
  Note,
  NoteWithRelations,
  Category,
  LearningPath,
} from "@/lib/supabase/types";

interface QuizData {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface PathSuggestion {
  categoryName: string;
  noteIds: string[];
}

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

function langLabel(lang: string): string {
  return LANGUAGE_LABELS[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatNextReview(iso: string | null): string {
  if (!iso) return "";
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  if (days <= 0) return "oggi";
  if (days === 1) return "domani";
  return `tra ${days} giorni`;
}

export default function NotesPage() {
  const router = useRouter();
  const { user: sessionUser, status } = useSupabaseSession();

  const [notes, setNotes] = useState<NoteWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [dueNotes, setDueNotes] = useState<NoteWithRelations[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "due">("all");

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [quizNoteId, setQuizNoteId] = useState<string | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  const [pathSuggestions, setPathSuggestions] = useState<PathSuggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([]);
  const [creatingPath, setCreatingPath] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const loadNotes = useCallback(async () => {
    const data = await api.notes.list({
      q: search.trim() || undefined,
      category: activeCategory || undefined,
      status: activeFilter === "pending" ? "pending" : undefined,
    });
    setNotes(data.notes || []);
  }, [search, activeCategory, activeFilter]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [notesData, catsData, pathsData, dueData] = await Promise.all([
        api.notes.list(),
        api.categories.list(),
        api.paths.list(),
        api.notes.dueReviews(),
      ]);
      setNotes(notesData.notes || []);
      setCategories(catsData.categories || []);
      setPaths(pathsData.paths || []);
      setDueNotes(dueData.notes || []);
    } catch (error) {
      showToast((error as Error).message || "Errore caricamento note");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Categorizzazione asincrona: alla prima apertura il cassetto recupera
  // le note rimaste in "pending" (non bloccante).
  useEffect(() => {
    if (status !== "authenticated") return;
    loadAll();
    api.notes
      .categorizePending()
      .then(() => {
        // Dopo il batch, ricarica per mostrare le categorie appena assegnate
        loadNotes();
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Ricerca con debounce
  useEffect(() => {
    if (status !== "authenticated") return;
    const timer = setTimeout(() => {
      loadNotes().catch(() => {});
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadNotes().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, activeFilter]);

  // Suggerimenti di percorsi di apprendimento (leggeri e dismissibili):
  // categorie con almeno 2 note non ancora raggruppate in un percorso.
  useEffect(() => {
    try {
      const dismissed: string[] = JSON.parse(
        localStorage.getItem("semplycode:notes:dismissed-paths") || "[]",
      );
      setDismissedSuggestions(dismissed);
    } catch {
      /* ignore */
    }
  }, []);

  const computedSuggestions = useMemo(() => {
    const byCat = new Map<string, string[]>();
    for (const note of notes) {
      for (const cat of note.categories) {
        const list = byCat.get(cat.name) || [];
        list.push(note.id);
        byCat.set(cat.name, list);
      }
    }
    const existingPathCat = new Set<string>();
    // Se esiste già un percorso con quel nome, non suggerire più
    for (const p of paths) {
      existingPathCat.add(p.title.toLowerCase());
    }
    return [...byCat.entries()]
      .filter(([name, ids]) => ids.length >= 2 && !existingPathCat.has(name.toLowerCase()))
      .filter(([name]) => !dismissedSuggestions.includes(name))
      .map(([categoryName, noteIds]) => ({ categoryName, noteIds }));
  }, [notes, paths, dismissedSuggestions]);

  useEffect(() => {
    setPathSuggestions(computedSuggestions.slice(0, 2));
  }, [computedSuggestions]);

  const dismissSuggestion = (categoryName: string) => {
    const next = [...dismissedSuggestions, categoryName];
    setDismissedSuggestions(next);
    try {
      localStorage.setItem("semplycode:notes:dismissed-paths", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const createPath = async (suggestion: PathSuggestion) => {
    setCreatingPath(suggestion.categoryName);
    try {
      await api.paths.create(suggestion.categoryName, suggestion.noteIds);
      dismissSuggestion(suggestion.categoryName);
      showToast(`Percorso «${suggestion.categoryName}» creato!`);
      loadAll();
    } catch (error) {
      showToast((error as Error).message || "Errore creazione percorso");
    } finally {
      setCreatingPath(null);
    }
  };

  const selectedNote = selectedNoteId
    ? notes.find((n) => n.id === selectedNoteId) || null
    : null;

  // Deep link dall'estensione: /notes?note=<id> apre direttamente la nota
  useEffect(() => {
    if (selectedNoteId) return;
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get("note");
    if (!noteId || !notes.length) return;
    if (notes.some((n) => n.id === noteId)) {
      setSelectedNoteId(noteId);
      window.history.replaceState({}, "", "/notes");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, selectedNoteId]);

  // Sincronizzazione: una nota salvata dall'estensione appare qui
  // (polling leggero + refetch al ritorno sul tab; il Realtime è un
  // miglioramento progressivo quando le policy RLS sono applicate).
  useEffect(() => {
    if (status !== "authenticated") return;
    const refreshIfVisible = () => {
      if (!document.hidden) loadNotes().catch(() => {});
    };
    const interval = setInterval(refreshIfVisible, 30000);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [status, loadNotes]);

  useEffect(() => {
    if (!sessionUser?.email) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let supabase: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;
    try {
      supabase = createClient();
      channel = supabase
        .channel(`notes-${sessionUser.email}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notes",
            filter: `user_id=eq.${sessionUser.email}`,
          },
          () => loadNotes().catch(() => {}),
        )
        .subscribe();
    } catch {
      // Realtime non disponibile (es. RLS non ancora applicate): il polling copre.
    }
    return () => {
      if (supabase && channel) supabase.removeChannel(channel);
    };
  }, [sessionUser, loadNotes]);

  const openNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setQuiz(null);
    setQuizAnswer(null);
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("Eliminare questa nota?")) return;
    try {
      await api.notes.remove(noteId);
      setSelectedNoteId(null);
      showToast("Nota eliminata");
      loadAll();
    } catch (error) {
      showToast((error as Error).message || "Errore eliminazione");
    }
  };

  const handleRename = async (noteId: string, title: string) => {
    if (!title.trim()) return;
    try {
      await api.notes.update(noteId, { title: title.trim() });
      loadNotes();
    } catch (error) {
      showToast((error as Error).message || "Errore salvataggio titolo");
    }
  };

  const recategorize = async (noteId: string) => {
    try {
      await api.notes.categorize(noteId);
      showToast("Categorie aggiornate");
      loadAll();
    } catch (error) {
      showToast((error as Error).message || "Errore categorizzazione");
    }
  };

  // ── Ripasso (quiz) ───────────────────────────────────

  const startQuiz = async (noteId: string) => {
    setQuizLoading(true);
    setQuizAnswer(null);
    try {
      const data = await api.notes.quiz(noteId);
      setQuiz(data.quiz);
      setQuizNoteId(noteId);
    } catch (error) {
      showToast((error as Error).message || "Errore generazione quiz");
    } finally {
      setQuizLoading(false);
    }
  };

  const answerQuiz = async (optionIndex: number) => {
    const current = quiz;
    if (quizAnswer !== null || !quizNoteId || !current) return;
    setQuizAnswer(optionIndex);
    const correct = optionIndex === current.correct;
    try {
      await api.notes.review(quizNoteId, correct);
    } catch {
      /* il risultato resta mostrato anche se fallisce la registrazione */
    }
    loadAll();
  };

  const closeQuiz = () => {
    setQuiz(null);
    setQuizNoteId(null);
    setQuizAnswer(null);
  };

  // ── Guardia login ─────────────────────────────────────

  if (status === "loading") {
    return (
      <>
        <Navbar />
        <SkeletonSettings />
        <Footer />
      </>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return (
      <>
        <Navbar />
        <SkeletonSettings />
        <Footer />
      </>
    );
  }

  const visibleNotes = activeFilter === "due" ? dueNotes : notes;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white dark:bg-[#080d14]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-[#0f172a] flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Bookmark className="text-white w-6 h-6" />
                </span>
                Il mio Cassetto
              </h1>
              <p className="text-sm text-[#64748b] mt-2">
                {notes.length} note salvate · {categories.length} categorie
                {dueNotes.length > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[#b45309] bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 text-xs font-semibold">
                    <Clock size={12} /> {dueNotes.length} da ripassare
                  </span>
                )}
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca nelle note..."
                className="w-full bg-white border border-[#e2e8f0] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Banner suggerimento percorso (leggero e dismissibile) */}
          <AnimatePresence>
            {pathSuggestions.map((s) => (
              <motion.div
                key={s.categoryName}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3"
              >
                <Layers className="text-emerald-600 w-5 h-5 shrink-0" />
                <p className="text-sm text-emerald-900 flex-1">
                  Hai <strong>{s.noteIds.length} note</strong> su{" "}
                  <strong>«{s.categoryName}»</strong>. Raggruppale in un percorso
                  di apprendimento per ripassarle insieme.
                </p>
                <button
                  type="button"
                  onClick={() => createPath(s)}
                  disabled={creatingPath === s.categoryName}
                  className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60"
                >
                  {creatingPath === s.categoryName ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  Crea percorso
                </button>
                <button
                  type="button"
                  onClick={() => dismissSuggestion(s.categoryName)}
                  className="shrink-0 text-emerald-600/60 hover:text-emerald-800 transition-colors"
                  aria-label="Ignora suggerimento"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
            {/* Sidebar filtri */}
            <aside className="space-y-1">
              <FilterButton
                active={activeFilter === "all" && !activeCategory}
                onClick={() => {
                  setActiveFilter("all");
                  setActiveCategory(null);
                }}
                icon={<Layers size={14} />}
                label="Tutte le note"
                count={notes.length}
              />
              <FilterButton
                active={activeFilter === "due"}
                onClick={() => setActiveFilter("due")}
                icon={<GraduationCap size={14} />}
                label="Da ripassare"
                count={dueNotes.length}
              />
              <FilterButton
                active={activeFilter === "pending"}
                onClick={() => setActiveFilter("pending")}
                icon={<Sparkles size={14} />}
                label="In attesa di categorie"
                count={notes.filter((n) => n.status === "pending").length}
              />

              <div className="pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2 px-2">
                  Categorie
                </p>
                <div className="space-y-1">
                  {categories.length === 0 && (
                    <p className="text-xs text-[#94a3b8] px-2">
                      Le categorie compaiono qui dopo la prima analisi.
                    </p>
                  )}
                  {categories.map((cat) => {
                    const count = notes.filter((n) =>
                      n.categories.some((c) => c.id === cat.id),
                    ).length;
                    return (
                      <FilterButton
                        key={cat.id}
                        active={activeCategory === cat.id}
                        onClick={() => {
                          setActiveFilter("all");
                          setActiveCategory(activeCategory === cat.id ? null : cat.id);
                        }}
                        icon={<Tag size={13} />}
                        label={cat.name}
                        count={count}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2 px-2">
                  Percorsi
                </p>
                <div className="space-y-1">
                  {paths.length === 0 && (
                    <p className="text-xs text-[#94a3b8] px-2">
                      Crea percorsi per ripassare argomenti correlati.
                    </p>
                  )}
                  {paths.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm text-[#475569] rounded-lg"
                    >
                      <GraduationCap size={13} className="text-primary shrink-0" />
                      <span className="truncate flex-1">{p.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Lista note */}
            <section>
              {loading ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-40 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] animate-pulse"
                    />
                  ))}
                </div>
              ) : visibleNotes.length === 0 ? (
                <div className="text-center py-20 bg-white border border-[#e2e8f0] rounded-3xl">
                  <Bookmark className="w-10 h-10 text-[#cbd5e1] mx-auto mb-3" />
                  <p className="font-semibold text-[#0f172a]">Nessuna nota qui</p>
                  <p className="text-sm text-[#64748b] mt-1 max-w-sm mx-auto">
                    Salva le spiegazioni dall&apos;analisi del codice con il
                    bottone <strong>Salva nel cassetto</strong>.
                  </p>
                  <Link
                    href="/chat"
                    className="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl px-4 py-2 transition-colors"
                  >
                    <Code2 size={15} /> Analizza codice
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {visibleNotes.map((note, i) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      index={i}
                      onOpen={() => openNote(note.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Dettaglio nota */}
      <AnimatePresence>
        {selectedNote && (
          <NoteDetailModal
            note={selectedNote}
            onClose={() => setSelectedNoteId(null)}
            onDelete={() => handleDelete(selectedNote.id)}
            onRename={(title) => handleRename(selectedNote.id, title)}
            onRecategorize={() => recategorize(selectedNote.id)}
            onQuiz={() => startQuiz(selectedNote.id)}
            quizLoading={quizLoading}
          />
        )}
      </AnimatePresence>

      {/* Quiz modal */}
      <AnimatePresence>
        {quiz && (
          <QuizModal
            quiz={quiz}
            answer={quizAnswer}
            onAnswer={answerQuiz}
            onClose={closeQuiz}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-white text-sm font-medium rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-2"
          >
            <Check size={15} className="text-emerald-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}

// ─── Sub-components ────────────────────────────────────

function FilterButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-all ${
        active
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold"
          : "text-[#475569] hover:bg-[#f8fafc] border border-transparent"
      }`}
    >
      <span className={active ? "text-emerald-600" : "text-[#94a3b8]"}>{icon}</span>
      <span className="truncate flex-1 text-left">{label}</span>
      <span
        className={`text-[11px] font-semibold rounded-full px-1.5 ${
          active ? "bg-emerald-100 text-emerald-700" : "bg-[#f1f5f9] text-[#64748b]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function NoteCard({
  note,
  index,
  onOpen,
}: {
  note: NoteWithRelations;
  index: number;
  onOpen: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      onClick={onOpen}
      className="group bg-white border border-[#e2e8f0] rounded-2xl p-5 cursor-pointer hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/5 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
              {langLabel(note.language)}
            </span>
            {note.source_type === "extension" && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#475569] bg-[#f1f5f9] rounded-full px-2 py-0.5">
                <Globe size={10} /> Estensione
              </span>
            )}
            {note.status === "pending" && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                <Sparkles size={10} /> Categorizzazione...
              </span>
            )}
            {note.due && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#b45309] bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                <Clock size={10} /> Ripasso
              </span>
            )}
          </div>
          <h3 className="font-bold text-[#0f172a] leading-snug line-clamp-2">
            {note.title || "Nota di codice"}
          </h3>
          <div className="mt-2 text-[10px] text-[#94a3b8] flex items-center gap-2">
            <Calendar size={11} /> {formatDate(note.created_at)}
            {note.next_review_at && (
              <>
                <span>·</span>
                <GraduationCap size={11} /> prossimo ripasso {formatNextReview(note.next_review_at)}
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="shrink-0 text-[#94a3b8] hover:text-primary transition-colors"
          aria-label="Espandi codice"
        >
          <Code2 size={16} />
        </button>
      </div>

      {expanded && (
        <pre className="mt-3 max-h-40 overflow-auto rounded-xl bg-[#0b0f1a] text-emerald-300 text-[11px] p-3 font-mono leading-relaxed">
          {note.snippet_code}
        </pre>
      )}

      {note.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {note.categories.slice(0, 3).map((cat) => (
            <span
              key={cat.id}
              className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5"
            >
              {cat.name}
            </span>
          ))}
          {note.categories.length > 3 && (
            <span className="text-[10px] text-[#64748b]">
              +{note.categories.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

function NoteDetailModal({
  note,
  onClose,
  onDelete,
  onRename,
  onRecategorize,
  onQuiz,
  quizLoading,
}: {
  note: NoteWithRelations;
  onClose: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  onRecategorize: () => void;
  onQuiz: () => void;
  quizLoading: boolean;
}) {
  const [title, setTitle] = useState(note.title);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => setTitle(note.title), [note.id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 16 }}
        transition={{ type: "spring", duration: 0.35 }}
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shrink-0">
              <Bookmark className="text-white w-4.5 h-4.5" />
            </span>
            <div className="min-w-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => title.trim() && onRename(title)}
                className="font-bold text-[#0f172a] text-lg w-full bg-transparent focus:outline-none focus:border-b focus:border-emerald-400 px-0.5"
                aria-label="Titolo della nota"
              />
              <p className="text-[11px] text-[#94a3b8]">
                {langLabel(note.language)} · {formatDate(note.created_at)}
                {note.source_url && (
                  <span className="ml-2 inline-flex items-center gap-1 text-primary">
                    <Globe size={10} /> {new URL(note.source_url).hostname}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onQuiz}
              disabled={quizLoading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg px-3 py-2 transition-colors disabled:opacity-60"
            >
              {quizLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <GraduationCap size={13} />
              )}
              Ripassa
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#64748b] hover:text-[#0f172a] rounded-lg hover:bg-[#f1f5f9] transition-colors"
              aria-label="Chiudi"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
          {/* Categorie */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">
              Categorie
            </p>
            <div className="flex flex-wrap gap-1.5">
              {note.categories.length === 0 && (
                <span className="text-xs text-[#64748b] italic">
                  Nessuna categoria ancora —{" "}
                  <button
                    type="button"
                    onClick={onRecategorize}
                    className="text-emerald-600 font-semibold hover:underline"
                  >
                    categorizza ora
                  </button>
                </span>
              )}
              {note.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1"
                >
                  <Tag size={11} /> {cat.name}
                </span>
              ))}
              {note.categories.length > 0 && (
                <button
                  type="button"
                  onClick={onRecategorize}
                  className="text-[11px] text-[#64748b] hover:text-emerald-600 flex items-center gap-1 px-1 transition-colors"
                >
                  <RefreshCw size={11} /> ri-analizza
                </button>
              )}
            </div>
          </div>

          {/* Codice */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2 flex items-center gap-1.5">
              <Code2 size={12} /> Codice originale
            </p>
            <div className="rounded-xl border border-[#e2e8f0] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="w-full px-3 py-1.5 text-[11px] text-[#64748b] bg-[#f8fafc] hover:bg-[#f1f5f9] text-left transition-colors"
              >
                {showCode ? "Nascondi codice" : "Mostra codice"} ({note.snippet_code.length} caratteri)
              </button>
              {showCode && (
                <pre className="max-h-72 overflow-auto bg-[#0b0f1a] text-emerald-300 text-xs p-4 font-mono leading-relaxed custom-scrollbar">
                  {note.snippet_code}
                </pre>
              )}
            </div>
          </div>

          {/* Spiegazione */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2 flex items-center gap-1.5">
              <FileText size={12} /> Spiegazione
            </p>
            <div className="text-sm text-[#334155] leading-relaxed notes-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.explanation}</ReactMarkdown>
            </div>
          </div>

          {/* Ripasso */}
          {note.leitner_box > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-amber-900">
                Livello ripasso{" "}
                <strong>
                  {"●".repeat(note.leitner_box)}
                  {"○".repeat(4 - note.leitner_box)}
                </strong>
                {note.next_review_at && (
                  <span className="block text-xs text-amber-700 mt-0.5">
                    Prossimo ripasso: {formatNextReview(note.next_review_at)}
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={onQuiz}
                className="text-xs font-semibold text-amber-800 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors"
              >
                Ripassa ora
              </button>
            </div>
          )}

          {/* Note correlate */}
          {note.related && note.related.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-2">
                Note correlate
              </p>
              <div className="space-y-2">
                {note.related.map((rel) => (
                  <div
                    key={rel.id}
                    className="flex items-center gap-2 text-sm text-[#334155] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2"
                  >
                    <Layers size={13} className="text-primary shrink-0" />
                    <span className="truncate flex-1">{rel.title}</span>
                    <span className="text-[10px] text-[#94a3b8] shrink-0">
                      {rel.categories.map((c) => c.name).join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#e2e8f0]">
          <p className="text-[11px] text-[#94a3b8]">
            {note.source_ref ? `Da chat: ${note.source_ref}` : "Salvata manualmente"}
          </p>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg px-3 py-2 transition-colors"
          >
            <Trash2 size={13} /> Elimina
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function QuizModal({
  quiz,
  answer,
  onAnswer,
  onClose,
}: {
  quiz: QuizData;
  answer: number | null;
  onAnswer: (i: number) => void;
  onClose: () => void;
}) {
  const answered = answer !== null;
  const isCorrect = answered && answer === quiz.correct;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 16 }}
        transition={{ type: "spring", duration: 0.35 }}
        className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <GraduationCap className="w-5 h-5" />
            <h3 className="font-bold text-[#0f172a]">Mini-quiz di ripasso</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#64748b] hover:text-[#0f172a] rounded-lg hover:bg-[#f1f5f9] transition-colors"
            aria-label="Chiudi quiz"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-[#0f172a] font-medium mb-4">{quiz.question}</p>

        <div className="space-y-2">
          {quiz.options.map((option, i) => {
            let className =
              "w-full text-left text-sm px-4 py-3 rounded-xl border transition-all ";
            if (!answered) {
              className += "border-[#e2e8f0] text-[#334155] hover:border-emerald-400 hover:bg-emerald-50/50";
            } else if (i === quiz.correct) {
              className += "border-emerald-400 bg-emerald-50 text-emerald-800";
            } else if (i === answer) {
              className += "border-red-300 bg-red-50 text-red-700";
            } else {
              className += "border-[#e2e8f0] text-[#94a3b8]";
            }
            return (
              <button
                key={i}
                type="button"
                disabled={answered}
                onClick={() => onAnswer(i)}
                className={className}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="font-mono text-xs opacity-70">{"ABCD"[i]}.</span>
                  {option}
                  {answered && i === quiz.correct && (
                    <Check size={15} className="text-emerald-600" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 rounded-xl px-4 py-3 text-sm ${
              isCorrect
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-amber-50 border border-amber-200 text-amber-800"
            }`}
          >
            <p className="font-semibold mb-1">
              {isCorrect ? "Risposta corretta! ✓" : "Non proprio, ecco il perché:"}
            </p>
            {quiz.explanation}
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg px-3 py-1.5 transition-colors"
              >
                Continua
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
