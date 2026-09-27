"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

interface ModePickerProps {
  value: string;
  modes: readonly string[];
  labels: Record<string, string>;
  descs?: Record<string, string>;
  onChange: (mode: string) => void;
  ariaLabel: string;
  closeLabel: string;
  /** Il menù si apre verso l'alto (default) o verso il basso. */
  dropUp?: boolean;
}

/** Selettore modalità minimalista stile "scegli modello" dei siti AI: pill compatta + lista essenziale. */
export default function ModePicker({
  value,
  modes,
  labels,
  descs,
  onChange,
  ariaLabel,
  closeLabel,
  dropUp = true,
}: ModePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative shrink-0"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={descs?.[value] ?? ariaLabel}
        aria-label={ariaLabel}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-gray-300 hover:bg-white/5 transition-colors"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
        <span className="max-w-[120px] truncate">{labels[value] || value}</span>
        <ChevronDown size={12} className={`shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default bg-transparent"
          />
          <div
            role="menu"
            aria-label={ariaLabel}
            className={`absolute left-0 z-30 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]/95 backdrop-blur-xl p-1 shadow-2xl shadow-black/60 ${dropUp ? "bottom-full mb-2" : "top-full mt-2"}`}
          >
            {modes.map((m) => {
              const active = value === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  title={descs?.[m]}
                  onClick={() => {
                    onChange(m);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${active ? "bg-white/[0.07] text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}`}
                >
                  <span className="flex-1 truncate font-medium">{labels[m] || m}</span>
                  {active && <Check size={12} className="shrink-0 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
