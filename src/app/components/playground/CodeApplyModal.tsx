"use client";

import { useMemo } from "react";
import { X } from "lucide-react";

interface DiffRow {
  type: "same" | "change" | "remove" | "add";
  old: string;
  new: string;
  line: number;
}

interface CodeApplyModalProps {
  oldCode: string;
  newCode: string;
  onApply: (code: string) => void;
  onClose: () => void;
}

function buildDiffLines(oldText: string, newText: string): DiffRow[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const max = Math.max(oldLines.length, newLines.length);
  const rows: DiffRow[] = [];

  for (let i = 0; i < max; i++) {
    const a = oldLines[i];
    const b = newLines[i];
    if (a === b) {
      rows.push({ type: "same", old: a ?? "", new: b ?? "", line: i + 1 });
    } else if (a !== undefined && b !== undefined) {
      rows.push({ type: "change", old: a, new: b, line: i + 1 });
    } else if (a !== undefined) {
      rows.push({ type: "remove", old: a, new: "", line: i + 1 });
    } else {
      rows.push({ type: "add", old: "", new: b ?? "", line: i + 1 });
    }
  }
  return rows;
}

export default function CodeApplyModal({ oldCode, newCode, onApply, onClose }: CodeApplyModalProps) {
  const diff = useMemo(() => buildDiffLines(oldCode, newCode), [oldCode, newCode]);
  const changedCount = diff.filter((r) => r.type !== "same").length;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#0d1117] border border-emerald-900/40 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-900/30">
          <div>
            <h3 className="text-sm font-bold text-white">Anteprima modifiche</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {changedCount} righe diverse rispetto all&apos;editor
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white rounded-lg"
            aria-label="Chiudi"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 font-mono text-xs custom-scrollbar space-y-0.5">
          {diff.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-[2rem_1fr] gap-2 px-2 py-0.5 rounded ${
                row.type === "add"
                  ? "bg-emerald-500/10"
                  : row.type === "remove"
                    ? "bg-red-500/10"
                    : row.type === "change"
                      ? "bg-amber-500/10"
                      : ""
              }`}
            >
              <span className="text-gray-600 select-none">{row.line}</span>
              <div>
                {row.type === "remove" && (
                  <span className="text-red-300 line-through">{row.old}</span>
                )}
                {row.type === "add" && (
                  <span className="text-emerald-300">+ {row.new}</span>
                )}
                {row.type === "change" && (
                  <>
                    <div className="text-red-300/90 line-through">- {row.old}</div>
                    <div className="text-emerald-300">+ {row.new}</div>
                  </>
                )}
                {row.type === "same" && (
                  <span className="text-gray-500">{row.old || " "}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-emerald-900/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-xl border border-emerald-900/30"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() => onApply(newCode)}
            className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90"
          >
            Applica tutto
          </button>
        </div>
      </div>
    </div>
  );
}
