"use client";

import { useEffect, useState } from 'react';

interface OnboardingProps {
  onClose?: () => void;
}

const SAMPLES = [
  { title: 'Hello JS', lang: 'javascript', code: `function greet(name) {\n  return ` + "`Ciao ${name}!`" + `\n}\nconsole.log(greet('Mondo'));` },
  { title: 'Fibonacci (py)', lang: 'python', code: `def fib(n):\n    a,b=0,1\n    for _ in range(n):\n        a,b=b,a+b\n    return a\n\nprint(fib(10))` },
];

export default function Onboarding({ onClose }: OnboardingProps) {
  const [step] = useState(0);

  useEffect(() => {
    try { localStorage.setItem('semplycode:onboard:v1', '1'); } catch {}
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-2xl bg-[#0d1117] p-6 rounded-lg border border-emerald-900/30">
        <h3 className="text-xl font-bold text-white mb-2">Benvenuto su Semplycode</h3>
        <p className="text-sm text-gray-300 mb-4">Ecco alcuni esempi per iniziare. Puoi applicare uno snippet all&apos;editor con il pulsante &quot;Inserisci&quot;.</p>

        <div className="space-y-3 mb-4">
          {SAMPLES.map((s, i) => (
            <div key={i} className="p-3 bg-[#010409]/60 rounded">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-100">{s.title} &middot; {s.lang}</div>
                <div>
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('semplycode:applySuggestion', { detail: { code: s.code } }));
                      onClose?.();
                    }}
                    className="text-xs px-2 py-1 bg-primary text-white rounded"
                  >
                    Inserisci
                  </button>
                </div>
              </div>
              <pre className="text-[11px] font-mono text-gray-300 overflow-auto max-h-28">{s.code}</pre>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 bg-transparent border border-emerald-900/30 text-gray-300 rounded">Chiudi</button>
        </div>
      </div>
    </div>
  );
}
