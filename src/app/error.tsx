'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service (optional)
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="text-3xl font-bold text-[#0f172a] mb-3">Qualcosa è andato storto</h1>

        <p className="text-[#64748b] mb-8">
          Si è verificato un errore imprevisto. Il team è stato notificato.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-emerald-600 transition-colors text-white font-semibold px-6 py-3 rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
            Riprova
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-[#e2e8f0] hover:bg-[#f8fafc] text-[#475569] font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <Home className="w-4 h-4" />
            Torna alla home
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 text-xs text-[#64748b]">
            <summary className="cursor-pointer font-medium text-[#475569] mb-2">Dettagli errore (solo dev)</summary>
            <pre className="whitespace-pre-wrap break-all">{error?.message}</pre>
            {error?.stack && (
              <pre className="mt-2 text-[10px] opacity-70 overflow-auto max-h-40">{error.stack}</pre>
            )}
          </details>
        )}
      </div>
    </div>
  );
}
