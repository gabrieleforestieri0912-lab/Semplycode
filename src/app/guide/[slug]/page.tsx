"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Code2, Sparkles, GraduationCap, BookOpen, Check, ExternalLink, Copy, FileText, Github, Layers } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { useLanguage } from "@/context/LanguageContext";

type Guide = {
  badge: string;
  title: string;
  subtitle: string;
  intro: string;
  sections: { h: string; p: string; bullets?: string[]; code?: { lang: string; text: string } }[];
  checklist: string[];
  resources: { label: string; href: string; external?: boolean }[];
  cta: string;
};

const guides: Record<string, { it: Guide; en: Guide }> = {
  "paste-or-upload": {
    it: {
      badge: "Guida 1 / 3",
      title: "Incolla o carica — come fornire codice a Semplycode",
      subtitle: "Snippet, file, ZIP o GitHub. Tutto con rilevamento linguaggio automatico.",
      intro: "Semplycode accetta codice in tre modi equivalenti. Scegli quello più comodo: l’AI riceve lo stesso contesto strutturato e risponde con lo stesso formato.",
      sections: [
        {
          h: "Editor CodeMirror",
          p: "Incolla qualsiasi frammento (anche parziale) nell’editor. Il linguaggio viene rilevato da euristica + estensione file. Ideale per debug rapidi.",
          bullets: ["Supporta JS/TS/Python/Java/Go/Rust/PHP/SQL… (20+ linguaggi)", "Evidenziazione e chiusura parentesi automatica", "Incolla anche stack trace insieme al codice per correlazione riga-errore"],
        },
        {
          h: "Drag & drop file e ZIP",
          p: "Trascina fino a 5 file (100 KB cad., 20 su Enterprise) nell’area tratteggiata o selezionali da “Scegli file”. Lo ZIP è sbloccato su Pro/Enterprise e viene estratto lato server (max 5 file, max 100 KB cad.).",
          bullets: ["Estensioni ammesse: .js .ts .jsx .tsx .py .java .cpp .c .go .rs .php .sql .css .html .json", "Limite reale verificabile: src/lib/planLimits.ts → pro 5, enterprise 20", "Contesto multi-file inviato come unico payload all’AI"],
          code: { lang: "bash", text: "# Esempio: carica 3 file\napp.ts (2 KB)\nutils.py (1.4 KB)\nquery.sql (0.8 KB)\n# → Analisi cross-file in un solo report" },
        },
        {
          h: "Import da GitHub",
          p: "Incolla un URL raw GitHub (es. https://raw.githubusercontent.com/.../file.ts) nel campo GitHub della Chat. Disponibile da Starter in su (allowGithub).",
          bullets: ["Un solo file per import GitHub (usa ZIP per multi-file)", "Utile per revisionare file singoli senza clonare repo"],
        },
      ],
      checklist: ["Il file supera 100 KB? Dividilo o rimuovi asset non-code", "ZIP con più di 5 file? Seleziona i più rilevanti", "Hai uno stack trace? Incollalo insieme al codice (modalità Debug)"],
      resources: [
        { label: "Prova subito nell’editor → #demo", href: "/#demo" },
        { label: "Area dropzone → #importa-file", href: "/#importa-file" },
        { label: "Limiti per piano → #prezzi", href: "/#prezzi" },
        { label: "Docs CodeMirror 6", href: "https://codemirror.net/", external: true },
      ],
      cta: "Apri Chat AI e incolla il tuo snippet",
    },
    en: {
      badge: "Guide 1 / 3",
      title: "Paste or upload — how to give code to Semplycode",
      subtitle: "Snippet, files, ZIP or GitHub. Same structured context, same report format.",
      intro: "Three equivalent ways to provide code. The AI receives the same structured payload and replies with the same format.",
      sections: [
        {
          h: "CodeMirror editor",
          p: "Paste any snippet (even partial). Language is auto-detected via heuristic + file extension. Best for quick debugging.",
          bullets: ["Supports JS/TS/Python/Java/Go/Rust/PHP/SQL… (20+)", "Highlight + auto-close brackets", "Paste a stack trace together with code for line correlation"],
        },
        {
          h: "Drag & drop files & ZIP",
          p: "Drag up to 5 files (100 KB each, 20 on Enterprise) or use the picker. ZIP is unlocked on Pro/Enterprise (max 5 files, 100 KB each) and extracted server-side.",
          bullets: ["Allowed: .js .ts .jsx .tsx .py .java .cpp .c .go .rs .php .sql .css .html .json", "Real limits: src/lib/planLimits.ts → pro 5, enterprise 20", "Multi-file context sent as single AI payload"],
          code: { lang: "bash", text: "# Example: 3 files\napp.ts (2 KB)\nutils.py (1.4 KB)\nquery.sql (0.8 KB)\n# → Cross-file analysis in one report" },
        },
        {
          h: "Import from GitHub",
          p: "Paste a raw GitHub URL in Chat’s GitHub field. Available from Starter upwards (allowGithub).",
          bullets: ["One file per GitHub import (use ZIP for multi-file)", "Useful to review single files without cloning"],
        },
      ],
      checklist: ["File >100 KB? Split or remove non-code assets", "ZIP >5 files? Pick the most relevant ones", "Have a stack trace? Paste it with the code (Debug mode)"],
      resources: [
        { label: "Try the editor → #demo", href: "/#demo" },
        { label: "Dropzone → #importa-file", href: "/#importa-file" },
        { label: "Plan limits → #prezzi", href: "/#prezzi" },
        { label: "CodeMirror 6 Docs", href: "https://codemirror.net/", external: true },
      ],
      cta: "Open Chat AI and paste your snippet",
    },
  },
  "analysis": {
    it: {
      badge: "Guida 2 / 3",
      title: "Analisi in italiano — riga, causa e fix",
      subtitle: "Correzione (solo fix) o Revisione (DRY/naming/sicurezza). Citazione riga se >50 righe.",
      intro: "Ogni analisi genera un report Markdown in italiano con la stessa struttura, così sai sempre dove guardare. La priorità è il codice che fornisci.",
      sections: [
        {
          h: "Correzione vs Revisione",
          p: "Correzione: corregge solo errori sintattici/logici/runtime, mantiene la struttura. Revisione: oltre ai fix, ottimizza naming, DRY, leggibilità, performance, sicurezza e best practice dello stack rilevato.",
          bullets: ["Correzione → “Codice corretto (solo fix minimi)”", "Revisione → “Codice revisionato + Miglioramenti + Best practice”", "Sotto-focus in Revisione: Sicurezza (injection/XSS/secret), Performance (loop/query), Stile (DRY/naming)"],
        },
        {
          h: "Riga citata e stack trace",
          p: "Se il codice supera 50 righe, il prompt impone “cita sempre riga XX”. Se fornisci stack trace, la correlazione ha priorità: l’AI allinea il messaggio d’errore alle righe del tuo snippet.",
          bullets: ["Esempio: riga 31–35 switch con ternario → fix: case 'guest' esplicito", "Esempio: riga 54 loop su store vuoto → seed prima del loop"],
          code: { lang: "markdown", text: "## Errori Trovati\n- Riga 31 — Switch con ternario nel default\n## Spiegazione\nIl default poco leggibile nasconde il ramo guest\n## Codice corretto\n```ts\ncase 'guest': return 'Ospite';\n```" },
        },
        {
          h: "Cosa ottieni",
          p: "Un report con Errori (con riga), Spiegazione causa-effetto in italiano semplice, e snippet corretto copiabile. Puoi continuare a chattare per chiedere “perché” o varianti.",
        },
      ],
      checklist: ["Codice >50 righe? Controlla che la riga citata sia quella giusta", "Hai incollato lo stack trace? Se sì, verifica la riga evidenziata", "Vuoi solo fix o anche ottimizzazioni? Scegli Correzione/Revisione"],
      resources: [
        { label: "Prompt reali → src/lib/analysisPrompts.ts", href: "https://github.com/gabrieleforestieri0912-lab/Semplycode/blob/main/src/lib/analysisPrompts.ts", external: true },
        { label: "Esempio live → #demo (58 righe)", href: "/#demo" },
        { label: "Tipi di analisi in Chat AI", href: "/chat" },
      ],
      cta: "Prova una Revisione completa",
    },
    en: {
      badge: "Guide 2 / 3",
      title: "Analysis in Italian — line, cause and fix",
      subtitle: "Correction (fixes only) or Revision (DRY/naming/security). Line cited if >50 lines.",
      intro: "Every analysis returns the same Italian Markdown structure, so you always know where to look. Your code is the priority.",
      sections: [
        {
          h: "Correction vs Revision",
          p: "Correction: fixes only syntax/logic/runtime errors, keeps structure. Revision: also optimizes naming, DRY, readability, performance, security and stack best practices.",
          bullets: ["Correction → “Corrected code (minimal fixes)”", "Revision → “Revised code + Improvements + Best practices”", "Sub-focus in Revision: Security (injection/XSS/secret), Performance (loops/queries), Style (DRY/naming)"],
        },
        {
          h: "Line citation & stack trace",
          p: "If code exceeds 50 lines the prompt forces “always cite line XX”. If you provide a stack trace, correlation has priority.",
          bullets: ["Example: line 31–35 switch with ternary → fix: explicit case 'guest'", "Example: line 54 loop over empty store → seed before loop"],
          code: { lang: "markdown", text: "## Errors Found\n- Line 31 — Switch with ternary in default\n## Explanation\nDefault hides guest branch\n## Corrected code\n```ts\ncase 'guest': return 'Guest';\n```" },
        },
        {
          h: "What you get",
          p: "A report with Errors (with line), cause-effect Explanation in simple Italian, and copyable corrected snippet. Keep chatting to ask “why” or request variants.",
        },
      ],
      checklist: ["Code >50 lines? Check cited line is correct", "Pasted a stack trace? Verify highlighted line", "Want fixes only or also optimizations? Pick Correction/Revision"],
      resources: [
        { label: "Real prompts → src/lib/analysisPrompts.ts", href: "https://github.com/gabrieleforestieri0912-lab/Semplycode/blob/main/src/lib/analysisPrompts.ts", external: true },
        { label: "Live example → #demo (58 lines)", href: "/#demo" },
        { label: "Analysis types in Chat AI", href: "/chat" },
      ],
      cta: "Try a full Revision",
    },
  },
  "apply-and-continue": {
    it: {
      badge: "Guida 3 / 3",
      title: "Applica e continua — dal fix al Cassetto",
      subtitle: "Copia, diff, salva, esporta, condividi e continua a chattare.",
      intro: "Il report non è un vicolo cieco: ogni snippet corretto è portabile e il dialogo prosegue. Così impari, non solo incolli.",
      sections: [
        {
          h: "Copia con un click o applica con diff",
          p: "Sul blocco codice del report: “Copia” copia negli appunti; “Applica” apre il diff (CodeApplyModal) che mostra — vs + e sovrascrive l’editor solo se confermi.",
          bullets: ["Diff a due colonne con conteggio righe diverse", "Applica sostituisce l’editor e lancia nuova analisi automatica"],
        },
        {
          h: "Salva nel Cassetto (Leitner)",
          p: "“Salva” crea una nota con titolo/spiegazione/codice. La categorizzazione AI è asincrona e la ripetizione spaziata (box 0-4 → intervalli 3/7/14/30/60 giorni) ti fa ripassare al momento giusto.",
          bullets: ["Categorie normalizzate per utente, riuso id esistenti", "Polling 30s + Realtime per sincro webapp/estensione"],
        },
        {
          h: "Esporta e condividi",
          p: "Esporta Markdown/codice, o “Condividi” per creare un link temporaneo (7 giorni) via /api/share — solo su tua esplicita richiesta, non salvataggio automatico.",
          bullets: ["Export include conversazione + snippet", "Share URL: /share/[token] — scade, non indicizzato"],
        },
      ],
      checklist: ["Hai applicato il diff? Riesegui l’analisi per verifica", "Vuoi memorizzare? Salva e lascia che il Leitner pianifichi il ripasso", "Vuoi mostrare a un collega? Condividi il link, non lo snippet grezzo"],
      resources: [
        { label: "Cassetto → /notes", href: "/notes" },
        { label: "Cronologia → /dashboard", href: "/dashboard" },
        { label: "Esportazione → src/lib/exportUtils.ts", href: "https://github.com/gabrieleforestieri0912-lab/Semplycode/blob/main/src/lib/exportUtils.ts", external: true },
      ],
      cta: "Continua a chattare — chiedi “perché”",
    },
    en: {
      badge: "Guide 3 / 3",
      title: "Apply and keep going — from fix to Drawer",
      subtitle: "Copy, diff, save, export, share and keep chatting.",
      intro: "The report is not a dead end: every corrected snippet is portable and the conversation continues. You learn, not just paste.",
      sections: [
        {
          h: "Copy in one click or apply via diff",
          p: "On the report’s code block: “Copy” copies to clipboard; “Apply” opens the diff (CodeApplyModal) showing — vs + and overwrites the editor only on confirm.",
          bullets: ["Two-column diff with changed-lines count", "Apply replaces the editor and triggers a new automatic analysis"],
        },
        {
          h: "Save to Drawer (Leitner)",
          p: "“Save” creates a note with title/explanation/code. AI categorization is async and spaced repetition (box 0-4 → 3/7/14/30/60 days) schedules review at the right time.",
          bullets: ["Categories normalized per user, reuse existing ids", "30s polling + Realtime for webapp/extension sync"],
        },
        {
          h: "Export & share",
          p: "Export Markdown/code, or “Share” to create a temporary link (7 days) via /api/share — only on explicit request, not auto-save.",
          bullets: ["Export includes conversation + snippet", "Share URL: /share/[token] — expires, not indexed"],
        },
      ],
      checklist: ["Applied the diff? Re-run analysis to verify", "Want to memorize? Save and let Leitner schedule review", "Want to show a colleague? Share the link, not raw snippet"],
      resources: [
        { label: "Drawer → /notes", href: "/notes" },
        { label: "History → /dashboard", href: "/dashboard" },
        { label: "Export → src/lib/exportUtils.ts", href: "https://github.com/gabrieleforestieri0912-lab/Semplycode/blob/main/src/lib/exportUtils.ts", external: true },
      ],
      cta: "Keep chatting — ask “why”",
    },
  },
};

// Alias per retro-compatibilità: vecchi slug italiani → nuovi inglesi (route solo in inglese)
const alias: Record<string, string> = {
  "incolla-o-carica": "paste-or-upload",
  "analisi-in-italiano": "analysis",
  "applica-e-continua": "apply-and-continue",
};

export default function GuidePage() {
  const params = useParams<{ slug: string }>();
  const rawSlug = params?.slug as string;
  const slug = alias[rawSlug] || rawSlug;
  const { language } = useLanguage();
  const data = guides[slug];
  const guide = data ? (data[language as keyof typeof data] as Guide) || data.it : null;

  const iconMap: Record<string, React.ElementType> = {
    "paste-or-upload": Code2,
    "analysis": Sparkles,
    "apply-and-continue": GraduationCap,
  };
  const Icon = iconMap[slug] || BookOpen;

  if (!guide) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-white pt-28 pb-20">
          <div className="container mx-auto max-w-3xl text-center">
            <h1 className="text-2xl font-bold text-[#0f172a]">Guida non trovata</h1>
            <Link href="/#come-funziona" className="mt-4 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700">
              <ArrowLeft size={16} /> Torna a Come Funziona
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <section className="relative pt-24 sm:pt-28 pb-12 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 68%)" }} />
          </div>
          <div className="container mx-auto max-w-3xl px-4 sm:px-6 relative">
            <Link href="/#come-funziona" className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-emerald-600 mb-6">
              <ArrowLeft size={14} /> {language === "en" ? "Back to How it Works" : "Torna a Come Funziona"}
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-widest uppercase mb-4">
              <Icon size={13} /> {guide.badge}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0f172a] leading-tight">{guide.title}</h1>
            <p className="mt-3 text-base sm:text-lg text-[#475569] leading-relaxed">{guide.subtitle}</p>
            <p className="mt-4 text-sm text-[#64748b] leading-relaxed border-l-2 border-emerald-500/30 pl-4">{guide.intro}</p>
          </div>
        </section>

        <section className="pb-12">
          <div className="container mx-auto max-w-3xl px-4 sm:px-6">
            <div className="space-y-8">
              {guide.sections.map((s, i) => (
                <div key={i} className="rounded-2xl border border-[#e2e8f0] bg-white p-5 sm:p-6 shadow-sm">
                  <h2 className="text-base sm:text-lg font-bold text-[#0f172a] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 text-xs font-bold">{i + 1}</span>
                    {s.h}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#475569]">{s.p}</p>
                  {s.bullets && (
                    <ul className="mt-3 space-y-2">
                      {s.bullets.map((b) => (
                        <li key={b} className="flex gap-2 text-sm text-[#334155]"><Check size={14} className="mt-0.5 text-emerald-500 shrink-0" /><span>{b}</span></li>
                      ))}
                    </ul>
                  )}
                  {s.code && (
                    <pre className="mt-4 rounded-xl bg-[#0f172a] text-[#e2e8f0] p-4 text-xs font-mono overflow-x-auto whitespace-pre">
                      <code>{s.code.text}</code>
                    </pre>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
              <h3 className="text-sm font-bold text-amber-800 flex items-center gap-1.5"><Layers size={14} /> Checklist rapida</h3>
              <ul className="mt-3 space-y-1.5">
                {guide.checklist.map((c) => (
                  <li key={c} className="flex gap-2 text-sm text-[#475569]"><span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 shrink-0" /><span>{c}</span></li>
                ))}
              </ul>
            </div>

            <div className="mt-8 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-5">
              <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-1.5"><BookOpen size={14} /> Risorse</h3>
              <ul className="mt-3 space-y-2">
                {guide.resources.map((r) => (
                  <li key={r.label}>
                    <Link href={r.href} target={r.external ? "_blank" : undefined} className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 hover:underline">
                      {r.label} {r.external ? <ExternalLink size={12} /> : <ArrowRight size={12} />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/chat" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all">
                {guide.cta} <ArrowRight size={16} />
              </Link>
              <Link href="/#come-funziona" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-[#e2e8f0] bg-white text-[#0f172a] font-semibold hover:bg-[#f8fafc] transition-colors">
                <Code2 size={16} /> {language === "en" ? "See all steps" : "Vedi tutti i passi"}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
