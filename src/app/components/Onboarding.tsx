"use client";

import { useEffect, useRef, useState } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

/** Flag una-tantum: il tour parte solo al primo accesso all'editor. */
export const ONBOARDING_KEY = 'semplycode:onboard:chat:v1';

interface OnboardingProps {
  onClose?: () => void;
}

interface TourStep {
  /** Selettore CSS (anche multipli separati da virgola): si usa il primo visibile. */
  target: string;
  title: string;
  desc: string;
}

const STEPS: TourStep[] = [
  {
    target: '[data-tour="editor"]',
    title: 'Incolla il codice qui',
    desc: 'Editor con rilevamento automatico del linguaggio. Incolla e l\u2019analisi parte da sola, oppure premi Ctrl+Invio.',
  },
  {
    target: '[data-tour="composer-center"],[data-tour="composer-bottom"]',
    title: 'Chiedi all\u2019AI',
    desc: 'Scrivi qui domande sul codice: l\u2019input parte al centro e scende in fondo al primo invio. Invio per mandare, Shift+Invio per andare a capo.',
  },
  {
    target: '[data-tour="modes"]',
    title: 'Modalit\u00e0 di analisi',
    desc: 'Correzione (solo fix minimi), Revisione (qualit\u00e0 e best practice), Creazione (guida passo-passo) + altre analisi nel menu Altro.',
  },
  {
    target: '[data-tour="upload"]',
    title: 'File, cartelle, ZIP, GitHub',
    desc: 'Carica fino a 50 file: si aprono come tab e l\u2019AI li analizza insieme, relazioni comprese.',
  },
  {
    target: '[data-tour="report"]',
    title: 'Report con riga cliccabile',
    desc: 'Errori con riga evidenziata nell\u2019editor, blocchi codice con Copia, Applica al file attivo e Salva nel Cassetto.',
  },
  {
    target: '[data-tour="history"]',
    title: 'Cronologia e progetti',
    desc: 'Le chat si salvano da sole: cercale, rinominale o organizzale in progetti dalla barra laterale.',
  },
];

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

function findVisibleTarget(selector: string): Element | null {
  try {
    const els = Array.from(document.querySelectorAll(selector));
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width > 48 && r.height > 28 && r.bottom > 0 && r.top < window.innerHeight) {
        return el;
      }
    }
  } catch {
    // selettore non valido: nessuno step
  }
  return null;
}

export default function Onboarding({ onClose }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [place, setPlace] = useState<'below' | 'above' | 'center'>('below');
  const closedRef = useRef(false);
  const stepRef = useRef(0);
  stepRef.current = step;
  const total = STEPS.length;

  const finish = () => {
    if (closedRef.current) return;
    closedRef.current = true;
    try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch { /* storage non disponibile */ }
    onClose?.();
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  // Risolve lo step corrente sull'elemento reale: scroll, misura, posiziona.
  // Gli step senza target visibile (es. pannello nascosto su mobile) vengono saltati.
  useEffect(() => {
    let cancelled = false;
    let t1: ReturnType<typeof setTimeout> | undefined;
    let t2: ReturnType<typeof setTimeout> | undefined;

    const el = findVisibleTarget(STEPS[step].target);
    if (!el) {
      t1 = setTimeout(() => {
        if (cancelled) return;
        if (stepRef.current + 1 < STEPS.length) setStep(stepRef.current + 1);
        else finishRef.current();
      }, 60);
      return () => { cancelled = true; if (t1) clearTimeout(t1); };
    }

    try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch { /* ignore */ }

    const measure = () => {
      if (cancelled) return;
      const target = findVisibleTarget(STEPS[stepRef.current].target);
      if (!target) {
        if (stepRef.current + 1 < STEPS.length) setStep(stepRef.current + 1);
        else finishRef.current();
        return;
      }
      const r = target.getBoundingClientRect();
      const pad = 8;
      const b: Box = {
        top: Math.max(8, r.top - pad),
        left: Math.max(8, r.left - pad),
        width: Math.min(r.width + pad * 2, window.innerWidth - 16),
        height: r.height + pad * 2,
      };
      setBox(b);
      const tipH = 280;
      if (window.innerHeight - (b.top + b.height) > tipH + 16) setPlace('below');
      else if (b.top > tipH + 16) setPlace('above');
      else setPlace('center');
    };

    t1 = setTimeout(measure, 450);
    t2 = setTimeout(measure, 1400); // seconda misura dopo il layout definitivo
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelled = true;
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finishRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const goNext = () => {
    if (step + 1 < total) {
      setBox(null);
      setStep(step + 1);
    } else {
      finish();
    }
  };
  const goPrev = () => {
    if (step > 0) {
      setBox(null);
      setStep(step - 1);
    }
  };

  const cur = STEPS[step];
  const tipWidth = 340;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const tipLeft = box
    ? Math.max(12, Math.min(box.left, vw - tipWidth - 12))
    : Math.max(12, (vw - tipWidth) / 2);

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Tour guidato">
      {box && place !== 'center' ? (
        <div
          className="absolute rounded-xl border-2 border-emerald-400 transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]"
          style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/65" onClick={finish} />
      )}

      <button
        onClick={finish}
        aria-label="Chiudi tour"
        className="absolute right-4 top-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
      >
        <X size={16} />
      </button>

      <div
        className="absolute"
        style={
          place === 'center' || !box
            ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: `min(${tipWidth}px, calc(100vw - 24px))` }
            : place === 'below'
              ? { left: tipLeft, top: box.top + box.height + 12, width: `min(${tipWidth}px, calc(100vw - 24px))` }
              : { left: tipLeft, top: Math.max(12, box.top - 12), transform: 'translateY(-100%)', width: `min(${tipWidth}px, calc(100vw - 24px))` }
        }
      >
        <div className="bg-[#0d1117] rounded-2xl border border-emerald-900/40 shadow-2xl overflow-hidden">
          <div className="h-1 bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
              style={{ width: `${((step + 1) / total) * 100}%` }}
            />
          </div>
          <div className="p-5">
            <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-400">
              Step {step + 1} / {total}
            </span>
            <h3 className="text-base font-bold text-white mt-1 mb-1.5">{cur.title}</h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">{cur.desc}</p>

            <div className="flex items-center justify-center gap-1.5 mb-4">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setBox(null); setStep(i); }}
                  className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-emerald-500' : 'w-1.5 bg-white/15 hover:bg-white/25'}`}
                  aria-label={`Vai a step ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={finish}
                className="text-xs font-semibold text-gray-400 hover:text-white px-3 py-2 rounded-full hover:bg-white/5 transition-colors"
              >
                Salta
              </button>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={goPrev}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-full border border-emerald-900/30 text-gray-300 hover:text-white hover:bg-white/5 text-sm font-semibold transition-colors"
                  >
                    <ArrowLeft size={14} /> Indietro
                  </button>
                )}
                <button
                  onClick={goNext}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-md hover:brightness-110 transition-all"
                >
                  {step < total - 1 ? <>Avanti <ArrowRight size={14} /></> : 'Inizia'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
