"use client";

import { useEffect, useState } from 'react';
import { Sparkles, Code2, Brain, Bookmark, ArrowRight, X } from 'lucide-react';

interface OnboardingProps {
  onClose?: () => void;
}

const STEPS = [
  {
    icon: Sparkles,
    title: 'Benvenuto su Semplycode',
    desc: 'Ti guidiamo in 30 secondi: incolla codice, ottieni errori con riga + spiegazione italiana e fix in diff.',
    detail: null as string | null,
    code: null as string | null,
  },
  {
    icon: Code2,
    title: '1 — Incolla o carica (vero limite: 5 file)',
    desc: 'Editor CodeMirror con rilevamento linguaggio automatico. Trascina fino a 5 file (100KB cad., 20 su Enterprise) o importa da GitHub — lo stack trace è opzionale.',
    detail: 'Prova subito con un esempio pre-caricato:',
    code: `function calcolaTotale(carrello) {\n  let totale = 0;\n  for (let i = 0; i <= carrello.length; i++) {\n    totale += carrello[i].prezzo;\n  }\n  return totale;\n}`,
  },
  {
    icon: Brain,
    title: '2 — Analisi in italiano',
    desc: 'Scegli Correzione (solo fix minimi) o Revisione (DRY, naming, sicurezza). Citazione riga se >50 righe e correlazione con stack trace.',
    detail: 'Esempio di report che vedrai a destra:',
    code: `### Errori Trovati\n- Riga 3 → i <= length legge undefined\n### Spiegazione\nIndice fuori range, lancia TypeError\n### Codice corretto\n- for (... i <= len ...)\n+ for (... i < len ...)`,
  },
  {
    icon: Bookmark,
    title: '3 — Applica, salva e continua',
    desc: 'Copia con un click o applica il diff nell’editor, salva nel Cassetto (Leitner), esporta Markdown o condividi link temporaneo — poi chiedi “perché” in chat.',
    detail: null,
    code: null,
  },
];

export default function Onboarding({ onClose }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const total = STEPS.length;
  const cur = STEPS[step];
  const Icon = cur.icon;

  useEffect(() => {
    try { localStorage.setItem('semplycode:onboard:v2', '1'); } catch {}
  }, []);

  const next = () => setStep((s) => Math.min(s + 1, total - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl bg-[#0d1117] rounded-2xl border border-emerald-900/30 shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-white/5">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300" style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>

        <button onClick={onClose} aria-label="Chiudi" className="absolute right-3 top-3 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors">
          <X size={14} />
        </button>

        <div className="p-6 sm:p-7">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Icon size={18} />
            </span>
            <span className="text-xs font-bold tracking-widest uppercase text-emerald-400">Step {step + 1} / {total}</span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{cur.title}</h3>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">{cur.desc}</p>

          {cur.code && (
            <div className="mb-4 rounded-xl border border-emerald-900/30 bg-[#010409]/70 overflow-hidden">
              <div className="px-3 py-2 border-b border-emerald-900/20 flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-widest uppercase text-gray-400">{step === 1 ? 'Esempio codice' : 'Anteprima report'}</span>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('semplycode:applySuggestion', { detail: { code: cur.code } }));
                    onClose?.();
                  }}
                  className="text-xs px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                >
                  Inserisci nell’editor
                </button>
              </div>
              <pre className="text-[11px] font-mono text-gray-300 p-3 overflow-auto max-h-40 whitespace-pre-wrap break-words">{cur.code}</pre>
            </div>
          )}

          {/* Dots */}
          <div className="flex items-center justify-center gap-1.5 my-4">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-emerald-500' : 'w-1.5 bg-white/15 hover:bg-white/25'}`} aria-label={`Vai a step ${i + 1}`} />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button onClick={onClose} className="text-xs font-semibold text-gray-400 hover:text-white px-3 py-2 rounded-full hover:bg-white/5 transition-colors">Salta</button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button onClick={prev} className="px-4 py-2 rounded-full border border-emerald-900/30 text-gray-300 hover:text-white hover:bg-white/5 text-sm font-semibold transition-colors">Indietro</button>
              )}
              {step < total - 1 ? (
                <button onClick={next} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-md hover:brightness-110 transition-all">
                  Avanti <ArrowRight size={14} />
                </button>
              ) : (
                <button onClick={onClose} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-white text-[#0f172a] text-sm font-bold hover:bg-gray-100 transition-colors">
                  Inizia a codificare
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
