"use client";

import React, { useState, useCallback, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X, Play, AlertTriangle, Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import Toast, { useToast } from "./Toast";

interface FileData {
  name: string;
  content: string | ArrayBuffer | null;
  language: string;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 100 * 1024;

type ExampleId = "off-by-one" | "sql-injection" | "py-efficiency";

interface PrecomputedExample {
  id: ExampleId;
  label: string;
  fileName: string;
  language: string;
  code: string;
  highlightLine: number;
  report: {
    errorTitle: string;
    errorDesc: string;
    explanation: string;
    diffMinus: string;
    diffPlus: string;
    note: string;
  };
}

const PRECOMPUTED_EXAMPLES: PrecomputedExample[] = [
  {
    id: "off-by-one",
    label: "Off-by-one JS",
    fileName: "calcolaTotale.js",
    language: "JavaScript",
    code: `function calcolaTotale(carrello) {\n  let totale = 0;\n  for (let i = 0; i <= carrello.length; i++) {\n    totale += carrello[i].prezzo;\n  }\n  return totale;\n}`,
    highlightLine: 3,
    report: {
      errorTitle: "Off-by-one — riga 3",
      errorDesc: "i <= carrello.length legge carrello[carrello.length] → undefined",
      explanation: "L’ultima iterazione esce dai limiti dell’array; undefined.prezzo lancia TypeError e il totale diventa NaN.",
      diffMinus: "for (let i = 0; i <= carrello.length; i++) {",
      diffPlus: "for (let i = 0; i < carrello.length; i++) {",
      note: "Fix minimo, struttura invariata.",
    },
  },
  {
    id: "sql-injection",
    label: "SQL injection",
    fileName: "login.py",
    language: "Python",
    code: `def login(username, password):\n    query = f"SELECT * FROM users WHERE name='{username}' AND pwd='{password}'"\n    cursor.execute(query)\n    return cursor.fetchone()`,
    highlightLine: 2,
    report: {
      errorTitle: "Injection — riga 2",
      errorDesc: "Interpolazione f-string nella query → SQL injection",
      explanation: "Un valore con apice chiude la stringa SQL e inietta comandi. Usa parametri ? / placeholder.",
      diffMinus: `query = f"SELECT * FROM users WHERE name='{username}'..."`,
      diffPlus: `query = "SELECT * FROM users WHERE name=? AND pwd=?"\ncursor.execute(query, (username, password))`,
      note: "Sicurezza: query parametrizzata.",
    },
  },
  {
    id: "py-efficiency",
    label: "Loop inefficiente",
    fileName: "somma.py",
    language: "Python",
    code: `def somma_quadrati(n):\n    result = []\n    for i in range(n):\n        result.append(i*i)\n    return sum(result)`,
    highlightLine: 3,
    report: {
      errorTitle: "Stile / Performance — riga 3",
      errorDesc: "Loop + append poi sum: allocazione intermedia inutile",
      explanation: "Si crea una lista temporanea solo per sommarla. Una generator expression evita l’allocazione.",
      diffMinus: "for i in range(n):\n        result.append(i*i)\n    return sum(result)",
      diffPlus: "return sum(i*i for i in range(n))",
      note: "Niente lista intermedia, O(1) memoria extra.",
    },
  },
];

export default function ImportCodeSection() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast, showToast } = useToast();
  const router = useRouter();
  const [selected, setSelected] = useState<ExampleId>("off-by-one");
  const { language } = useLanguage();
  const t = {
    it: {
      badge: "PROVA CON I TUOI FILE",
      title: "Analizza i tuoi file di codice",
      subtitle: "Guarda prima un risultato reale già calcolato — poi, se vuoi, carica i tuoi file senza obbligo.",
      examplesTitle: "Esempi già analizzati — senza chiamare l’AI",
      examplesSub: "Risultato pre-calcolato, statico. La dropzone resta sotto per il tuo codice.",
      labels: {
        "off-by-one": "Off-by-one JS",
        "sql-injection": "SQL injection",
        "py-efficiency": "Loop inefficiente",
      } as Record<ExampleId, string>,
      reports: {
        "off-by-one": {
          errorTitle: "Off-by-one — riga 3",
          errorDesc: "i <= carrello.length legge carrello[carrello.length] → undefined",
          explanation: "L’ultima iterazione esce dai limiti dell’array; undefined.prezzo lancia TypeError e il totale diventa NaN.",
          note: "Fix minimo, struttura invariata.",
        },
        "sql-injection": {
          errorTitle: "Injection — riga 2",
          errorDesc: "Interpolazione f-string nella query → SQL injection",
          explanation: "Un valore con apice chiude la stringa SQL e inietta comandi. Usa parametri ? / placeholder.",
          note: "Sicurezza: query parametrizzata.",
        },
        "py-efficiency": {
          errorTitle: "Stile / Performance — riga 3",
          errorDesc: "Loop + append poi sum: allocazione intermedia inutile",
          explanation: "Si crea una lista temporanea solo per sommarla. Una generator expression evita l’allocazione.",
          note: "Niente lista intermedia, O(1) memoria extra.",
        },
      } as Record<ExampleId, { errorTitle: string; errorDesc: string; explanation: string; note: string }>,
      tryInChat: "Prova questo codice in Chat AI",
      explanationTitle: "Spiegazione",
      fixTitle: "Fix proposto — diff",
      staticNoteSuffix: "— esempio statico, nessuna chiamata AI.",
      orUpload: "oppure carica i tuoi file",
      dropTitle: "Trascina i file qui",
      dropOr: "oppure",
      chooseFiles: "Scegli file dal computer",
      limitsLine: "Max 5 file (20 su Enterprise) • 100KB per file • JS, TS, Python, Java, Go, Rust...",
      uploadedFiles: "File caricati",
      removeAll: "Rimuovi tutti",
      analyzeA: "Analizza",
      analyzeB: "con AI",
      realLimits: "Limiti reali: max 5 file (20 su Enterprise) • 100KB per file • ZIP su Pro/Enterprise • GitHub da Starter",
      redirectNote: "Verrai reindirizzato a Chat AI. L'AI analizzerà tutti i file e mostrerà i risultati.",
      fileTooBigA: "Il file ",
      fileTooBigB: " è troppo grande (max 100KB)",
      unsupportedFormat: "Formato non supportato: ",
    },
    en: {
      badge: "TRY WITH YOUR FILES",
      title: "Analyze your code files",
      subtitle: "First see a real pre-computed result — then, if you want, upload your files with no obligation.",
      examplesTitle: "Pre-analyzed examples — without calling the AI",
      examplesSub: "Pre-computed, static result. The dropzone below stays for your code.",
      labels: {
        "off-by-one": "Off-by-one JS",
        "sql-injection": "SQL injection",
        "py-efficiency": "Inefficient loop",
      } as Record<ExampleId, string>,
      reports: {
        "off-by-one": {
          errorTitle: "Off-by-one — line 3",
          errorDesc: "i <= carrello.length reads carrello[carrello.length] → undefined",
          explanation: "The last iteration goes out of the array bounds; undefined.prezzo throws TypeError and the total becomes NaN.",
          note: "Minimal fix, structure unchanged.",
        },
        "sql-injection": {
          errorTitle: "Injection — line 2",
          errorDesc: "f-string interpolation in the query → SQL injection",
          explanation: "A value with a quote closes the SQL string and injects commands. Use ? parameters / placeholders.",
          note: "Security: parameterized query.",
        },
        "py-efficiency": {
          errorTitle: "Style / Performance — line 3",
          errorDesc: "Loop + append then sum: useless intermediate allocation",
          explanation: "A temporary list is created just to sum it. A generator expression avoids the allocation.",
          note: "No intermediate list, O(1) extra memory.",
        },
      } as Record<ExampleId, { errorTitle: string; errorDesc: string; explanation: string; note: string }>,
      tryInChat: "Try this code in Chat AI",
      explanationTitle: "Explanation",
      fixTitle: "Proposed fix — diff",
      staticNoteSuffix: "— static example, no AI call.",
      orUpload: "or upload your files",
      dropTitle: "Drag files here",
      dropOr: "or",
      chooseFiles: "Choose files from your computer",
      limitsLine: "Max 5 files (20 on Enterprise) • 100KB per file • JS, TS, Python, Java, Go, Rust...",
      uploadedFiles: "Uploaded files",
      removeAll: "Remove all",
      analyzeA: "Analyze",
      analyzeB: "with AI",
      realLimits: "Real limits: max 5 files (20 on Enterprise) • 100KB per file • ZIP on Pro/Enterprise • GitHub from Starter",
      redirectNote: "You'll be redirected to Chat AI. The AI will analyze all files and show the results.",
      fileTooBigA: "File ",
      fileTooBigB: " is too large (max 100KB)",
      unsupportedFormat: "Unsupported format: ",
    },
  }[language];

  const activeExample = PRECOMPUTED_EXAMPLES.find((e) => e.id === selected)!;
  const activeReport = t.reports[selected];

  const detectLanguageFromExt = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      py: 'python', java: 'java', cpp: 'cpp', c: 'c', go: 'go', rs: 'rust',
      php: 'php', sql: 'sql', css: 'css', html: 'html', json: 'json'
    };
    return map[ext] || 'javascript';
  };

  const handleFiles = useCallback((newFiles: File[]) => {
    const validFiles: File[] = [];

    for (const file of newFiles) {
      if (files.length + validFiles.length >= MAX_FILES) break;

      if (file.size > MAX_FILE_SIZE) {
        showToast(`${t.fileTooBigA}${file.name}${t.fileTooBigB}`, "error");
        continue;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const allowed = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'sql', 'css', 'html', 'json'];
      if (!allowed.includes(ext)) {
        showToast(`${t.unsupportedFormat}${file.name}`, "error");
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    Promise.all<FileData>(
      validFiles.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
              resolve({
                name: file.name,
                content: e.target?.result ?? null,
                language: detectLanguageFromExt(file.name),
              });
            };
            reader.readAsText(file);
          })
      )
    ).then((fileData) => {
      setFiles((prev) => [...prev, ...fileData].slice(0, MAX_FILES));
    });
  }, [files, showToast, t.fileTooBigA, t.fileTooBigB, t.unsupportedFormat]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    handleFiles(selectedFiles);
    e.target.value = '';
  };

  const handleAnalyze = () => {
    if (files.length === 0) return;

    try {
      localStorage.setItem(
        'semplycode:imported-files',
        JSON.stringify(files)
      );
    } catch (e) {
      console.error('Failed to store imported files', e);
    }

    router.push('/chat?import=true');
  };

  const handleUseExample = () => {
    const ex = activeExample;
    const fileData: FileData = {
      name: ex.fileName,
      content: ex.code,
      language: ex.language.toLowerCase() === 'javascript' ? 'javascript' : ex.language.toLowerCase(),
    };
    try {
      localStorage.setItem('semplycode:imported-files', JSON.stringify([fileData]));
    } catch {}
    router.push('/chat?import=true');
  };

  return (
    <motion.section
      id="importa-file"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="w-full py-16 sm:py-24 md:py-28 bg-[#f8fafc] relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)" }} />
      </div>
        <div className="container mx-auto max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl 4xl:max-w-[1600px]">
          <div className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs sm:text-sm font-semibold mb-4">
              {t.badge}
            </div>
            <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl 3xl:text-6xl font-bold tracking-tight text-[#0f172a] mb-4">
              {t.title}
            </h2>
            <p className="text-sm xs:text-base sm:text-lg 3xl:text-xl text-[#475569] max-w-2xl 3xl:max-w-3xl mx-auto px-2 sm:px-0">{t.subtitle}</p>
          </div>

        {/* Selettore esempi pre-calcolati - sopra la dropzone */}
        <div className="mb-8 rounded-3xl border border-[#e2e8f0] bg-white shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-[#e2e8f0] bg-[#f8fafc] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-emerald-700">{t.examplesTitle}</p>
              <p className="text-xs text-[#64748b] mt-1">{t.examplesSub}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRECOMPUTED_EXAMPLES.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setSelected(ex.id)}
                  className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all ${selected === ex.id ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'bg-white text-[#475569] border-[#e2e8f0] hover:border-emerald-300 hover:text-[#0f172a]'}`}
                  aria-pressed={selected === ex.id}
                >
                  {t.labels[ex.id]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-0">
            {/* Codice */}
            <div className="bg-[#0f172a] p-4 sm:p-5 order-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-semibold text-slate-300">{activeExample.fileName}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/10 font-bold tracking-widest uppercase">{activeExample.language}</span>
              </div>
              <pre className="text-[12px] sm:text-[13px] leading-[1.7] font-mono m-0 whitespace-pre-wrap break-words">
                <code>
                  {activeExample.code.split('\n').map((line, idx) => {
                    const n = idx + 1;
                    const isHighlight = n === activeExample.highlightLine;
                    return (
                      <span key={n} className={isHighlight ? 'flex items-center -mx-4 sm:-mx-5 px-4 sm:px-5 bg-red-500/15 border-l-[3px] border-red-500' : 'block'}>
                        <span className="text-slate-500 select-none inline-block w-6 text-right mr-3 shrink-0">{n}</span>
                        <span className={isHighlight ? 'text-red-100' : 'text-slate-300'}>{line || ' '}</span>
                        {isHighlight && <span className="ml-auto pl-3 flex items-center gap-1 text-[11px] font-sans font-semibold text-red-300 shrink-0"><AlertTriangle size={11} /> bug</span>}
                      </span>
                    );
                  })}
                </code>
              </pre>
              <button onClick={handleUseExample} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-colors"><Copy size={13} /> {t.tryInChat}</button>
            </div>

            {/* Report pre-calcolato */}
            <div className="p-4 sm:p-5 bg-[#f8fafc] order-2 flex flex-col gap-3">
              <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-3">
                <p className="text-xs font-bold text-red-700 flex items-center gap-1.5"><AlertTriangle size={12} /> {activeReport.errorTitle}</p>
                <p className="text-xs text-red-600 mt-1 leading-relaxed">{activeReport.errorDesc}</p>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-3">
                <p className="text-xs font-bold text-amber-700">{t.explanationTitle}</p>
                <p className="text-xs text-[#475569] mt-1 leading-relaxed">{activeReport.explanation}</p>
              </div>
              <div className="rounded-xl border border-[#e2e8f0] bg-white overflow-hidden">
                <div className="px-3 py-2 bg-white border-b border-[#e2e8f0] flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-emerald-700"><Check size={12} /> {t.fixTitle}</div>
                <div className="font-mono text-xs">
                  <div className="px-3 py-1.5 bg-red-50 text-red-700 border-l-[3px] border-red-400"><span className="text-red-400 mr-2">−</span>{activeExample.report.diffMinus}</div>
                  <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border-l-[3px] border-emerald-500"><span className="text-emerald-500 mr-2">+</span>{activeExample.report.diffPlus}</div>
                </div>
              </div>
              <p className="text-xs text-[#64748b]">{activeReport.note} {t.staticNoteSuffix}</p>
            </div>
          </div>
        </div>

        {/* Separatore */}
        <div className="flex items-center gap-3 my-8">
          <div className="h-px flex-1 bg-[#e2e8f0]" />
          <span className="text-xs font-bold tracking-widest uppercase text-[#94a3b8]">{t.orUpload}</span>
          <div className="h-px flex-1 bg-[#e2e8f0]" />
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-2xl sm:rounded-3xl p-4 xs:p-6 sm:p-10 3xl:p-14 text-center transition-all ${
            isDragging 
              ? 'border-emerald-400 bg-emerald-500/10' 
              : 'border-[#1e293b]/30 hover:border-emerald-500/50'
          }`}
          style={{ background: 'linear-gradient(135deg, #0a0c10 0%, #14181f 100%)' }}
        >
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5 sm:mb-6 border border-emerald-500/20">
            <Upload className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
          </div>

          <p className="text-lg xs:text-xl 3xl:text-2xl font-semibold text-white mb-2">
            {t.dropTitle}
          </p>
          <p className="text-sm xs:text-base text-[#94a3b8] mb-5 sm:mb-6">{t.dropOr}</p>

          <label className="inline-flex items-center justify-center gap-2 px-5 xs:px-6 py-3 min-h-[48px] max-w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition-colors text-xs xs:text-sm 3xl:text-base font-medium text-[#cbd5e1]">
            <FileText size={16} />
            {t.chooseFiles}
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.go,.rs,.php,.sql,.css,.html,.json"
            />
          </label>

          <p className="text-[11px] xs:text-xs 3xl:text-sm text-[#64748b] mt-4 px-2" style={{color: '#64748b'}}>
            {t.limitsLine}
          </p>
        </div>

        {files.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-semibold text-[#475569]">
                {t.uploadedFiles} ({files.length}/{MAX_FILES})
              </span>
              <button
                onClick={() => setFiles([])}
                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <X size={14} /> {t.removeAll}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3 group backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-white truncate">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-[#64748b]">
                        {file.language}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="opacity-40 group-hover:opacity-100 p-1 text-[#94a3b8] hover:text-red-400 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={files.length === 0}
            className="inline-flex items-center justify-center gap-2.5 sm:gap-3 px-6 sm:px-8 py-3.5 sm:py-4 w-full xs:w-auto min-h-[48px] rounded-2xl bg-linear-to-r from-emerald-500 to-teal-500 text-white font-semibold text-base sm:text-lg 3xl:text-xl shadow-lg shadow-emerald-500/20 hover:brightness-105 active:scale-[0.985] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5" />
            {t.analyzeA} {files.length > 0 ? `${files.length} file` : ''} {t.analyzeB}
          </button>
          <p className="text-xs text-[#64748b] text-center px-2">
            {t.realLimits}
          </p>
        </div>

        <p className="text-center text-xs text-[#64748b] mt-4">
          {t.redirectNote}
        </p>
      </div>
      <Toast toast={toast} />
    </motion.section>
  );
}
