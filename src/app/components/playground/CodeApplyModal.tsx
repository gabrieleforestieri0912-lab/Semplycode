"use client";

import { useMemo, useState } from "react";
import { X, Copy, Check, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { mergeSuggestion } from "@/lib/codeMerge";

interface CodeApplyModalProps {
  oldCode: string;
  newCode: string;
  filePath?: string;
  onApply: (code: string) => void;
  onClose: () => void;
}

export default function CodeApplyModal({ oldCode, newCode, filePath, onApply, onClose }: CodeApplyModalProps) {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const t = {
    it: {
      title: "Anteprima modifiche",
      close: "Chiudi",
      cancel: "Annulla",
      applyPatch: "Applica patch",
      applyFull: "Sostituisci tutto",
      copy: "Copia codice",
      copied: "Copiato",
      fragmentWarn: "Il suggerimento AI è un frammento, non il file intero. La patch intelligente modifica solo i blocchi corrispondenti e lascia intatto il resto. Usa “Sostituisci tutto” solo se vuoi davvero buttare il resto del file.",
      fullNote: "Il suggerimento sembra il file completo: la sostituzione è sicura.",
      patchNote: "Patch intelligente: solo i blocchi corrispondenti vengono aggiornati.",
      alreadyNote: "Il codice è già aggiornato: niente da applicare.",
      showResult: "Risultato dopo l'applicazione",
      showSuggested: "Suggerimento AI grezzo",
    },
    en: {
      title: "Preview changes",
      close: "Close",
      cancel: "Cancel",
      applyPatch: "Apply patch",
      applyFull: "Replace all",
      copy: "Copy code",
      copied: "Copied",
      fragmentWarn: "The AI suggestion is a fragment, not the whole file. Smart patch only updates matching blocks and keeps the rest. Use “Replace all” only if you really want to discard the rest.",
      fullNote: "The suggestion looks like the full file: replacement is safe.",
      patchNote: "Smart patch: only matching blocks are updated.",
      alreadyNote: "Code is already up to date: nothing to apply.",
      showResult: "Result after apply",
      showSuggested: "Raw AI suggestion",
    },
  }[language];

  const merge = useMemo(() => mergeSuggestion(oldCode, newCode), [oldCode, newCode]);
  const [view, setView] = useState<"result" | "raw">("result");

  // Cosa mostriamo nel diff: il risultato mergiato (default) oppure il grezzo.
  const previewOld = oldCode;
  const previewNew = view === "result" && merge.mode !== "fragment" && merge.mode !== "empty" ? merge.merged : newCode;

  const diffRows = useMemo(() => {
    const a = previewOld.split("\n");
    const b = previewNew.split("\n");
    const max = Math.max(a.length, b.length);
    const rows: { type: "same" | "change" | "add" | "remove"; old: string; nw: string; line: number }[] = [];
    // Diff riga-per-riga (leggero, basta per anteprima).
    for (let i = 0; i < max; i++) {
      const x = a[i];
      const y = b[i];
      if (x === y) rows.push({ type: "same", old: x ?? "", nw: y ?? "", line: i + 1 });
      else if (x !== undefined && y !== undefined) rows.push({ type: "change", old: x, nw: y, line: i + 1 });
      else if (x !== undefined) rows.push({ type: "remove", old: x, nw: "", line: i + 1 });
      else rows.push({ type: "add", old: "", nw: y ?? "", line: i + 1 });
    }
    return rows;
  }, [previewOld, previewNew]);

  const changedCount = diffRows.filter((r) => r.type !== "same").length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(merge.safe ? merge.merged : newCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard non disponibile */ }
  };

  const canApplySafe = merge.mode === "full" || merge.mode === "patch";
  const isFragment = merge.mode === "fragment";
  const isAlready = merge.mode === "already-applied";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#0d1117] border border-emerald-900/40 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-900/30">
          <div>
            <h3 className="text-sm font-bold text-white">{t.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {changedCount} · {merge.note}
              {filePath ? <span className="text-emerald-400/90"> · {filePath}</span> : null}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:text-white rounded-lg" aria-label={t.close}>
            <X size={18} />
          </button>
        </div>

        {isFragment && (
          <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
            <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-amber-200/90">{t.fragmentWarn}</p>
          </div>
        )}
        {!isFragment && !isAlready && (
          <div className="mx-4 mt-3 rounded-xl border border-emerald-900/30 bg-emerald-950/30 px-3 py-2">
            <p className="text-xs text-emerald-300/80">
              {merge.mode === "full" ? t.fullNote : t.patchNote}
              {merge.patchedBlocks.length > 0 ? ` (${merge.patchedBlocks.join(", ")})` : ""}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 px-4 pt-3">
          <button
            type="button"
            onClick={() => setView("result")}
            className={`px-3 py-1.5 text-xs rounded-lg border ${view === "result" ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/40" : "text-gray-500 border-emerald-900/30"}`}
          >
            {t.showResult}
          </button>
          <button
            type="button"
            onClick={() => setView("raw")}
            className={`px-3 py-1.5 text-xs rounded-lg border ${view === "raw" ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/40" : "text-gray-500 border-emerald-900/30"}`}
          >
            {t.showSuggested}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 font-mono text-xs custom-scrollbar space-y-0.5">
          {diffRows.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-[2rem_1fr] gap-2 px-2 py-0.5 rounded ${
                row.type === "add" ? "bg-emerald-500/10"
                : row.type === "remove" ? "bg-red-500/10"
                : row.type === "change" ? "bg-amber-500/10" : ""
              }`}
            >
              <span className="text-gray-600 select-none">{row.line}</span>
              <div className="min-w-0 break-words whitespace-pre-wrap">
                {row.type === "remove" && <span className="text-red-300 line-through">{row.old}</span>}
                {row.type === "add" && <span className="text-emerald-300">+ {row.nw}</span>}
                {row.type === "change" && (
                  <>
                    <div className="text-red-300/90 line-through">- {row.old}</div>
                    <div className="text-emerald-300">+ {row.nw}</div>
                  </>
                )}
                {row.type === "same" && <span className="text-gray-500">{row.old || " "}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-end gap-2 px-5 py-4 border-t border-emerald-900/30">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-gray-300 hover:text-white rounded-xl border border-emerald-900/30"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? t.copied : t.copy}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-xl border border-emerald-900/30"
          >
            {t.cancel}
          </button>
          {canApplySafe && (
            <button
              type="button"
              onClick={() => onApply(merge.merged)}
              className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90"
            >
              {t.applyPatch}
            </button>
          )}
          {isFragment && (
            <button
              type="button"
              onClick={() => onApply(newCode)}
              title={t.fragmentWarn}
              className="px-4 py-2 text-sm font-semibold bg-red-600/80 text-white rounded-xl hover:bg-red-600"
            >
              {t.applyFull}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
