import Link from "next/link";
import CodeFloatBackground from "./components/CodeFloatBackground";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-[#0f172a] font-sans relative overflow-hidden">
      {/* Background orbs - uguali a Hero */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.06) 40%, transparent 68%)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute top-1/2 right-[-80px] w-[360px] h-[360px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 65%)",
          }}
        />
      </div>

      {/* Background codice fluttuante (decorativo, aria-hidden) - uguale a Hero */}
      <CodeFloatBackground />

      <div className="relative z-10 max-w-xl w-full p-8 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc]/60 text-center">
        <h1 className="text-6xl font-extrabold text-[#0f172a] mb-2">404</h1>
        <p className="text-sm text-[#64748b] mb-4">Pagina non trovata</p>
        <div className="p-6 mx-auto mb-4 rounded-xl border border-[#e2e8f0] bg-white shadow-xl">
          <p className="text-sm text-[#475569] leading-relaxed">
            Sembra che la pagina che stai cercando non esista oppure sia stata
            spostata. Torna alla home per continuare a esplorare Semplycode.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg bg-primary hover:bg-emerald-600 text-white font-semibold"
          >
            Vai alla Home
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-[#475569] hover:text-[#0f172a]"
          >
            Ricarica
          </Link>
        </div>
      </div>
    </div>
  );
}
