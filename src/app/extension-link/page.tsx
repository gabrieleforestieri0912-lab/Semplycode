"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Copy, Check, RefreshCw, Loader2, MonitorSmartphone } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { useLanguage } from "../../context/LanguageContext";

export default function ExtensionLinkPage() {
  const { language } = useLanguage();
  const t = {
    it: {
      title: "Collega l'estensione",
      subtitle: "Usa questo codice per accedere dall'estensione Chrome con lo stesso account.",
      generating: "Generazione codice...",
      validNote: "Valido 2 minuti · uso singolo",
      copied: "Copiato!",
      copy: "Copia codice",
      newCodeTitle: "Genera un nuovo codice",
      genError: "Errore generazione codice",
      copyError: "Impossibile copiare automaticamente: seleziona e copia il codice.",
      howTo: "Come collegare",
      step1: "Copia il codice qui sopra",
      step2a: "Apri l'estensione Semplycode → sezione",
      step2b: "Impostazioni",
      step3a: "Incolla il codice in",
      step3b: "“Collega account webapp”",
      step3c: "e premi",
      step3d: "Collega",
    },
    en: {
      title: "Link the extension",
      subtitle: "Use this code to sign in from the Chrome extension with the same account.",
      generating: "Generating code...",
      validNote: "Valid 2 minutes · single use",
      copied: "Copied!",
      copy: "Copy code",
      newCodeTitle: "Generate a new code",
      genError: "Code generation failed",
      copyError: "Could not copy automatically: select and copy the code.",
      howTo: "How to link",
      step1: "Copy the code above",
      step2a: "Open the Semplycode extension →",
      step2b: "Settings",
      step3a: "Paste the code into",
      step3b: "“Link webapp account”",
      step3c: "and press",
      step3d: "Link",
    },
  }[language];
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const generateCode = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/link-code/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.genError);
      setCode(data.code);
    } catch (err) {
      setError((err as Error).message || t.genError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateCode();
  }, []);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t.copyError);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white dark:bg-[#080d14] flex items-center justify-center p-6 py-16">
        <div className="max-w-md w-full space-y-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-emerald-500 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Home
          </Link>

          <div className="bg-white dark:bg-[#0a0c10] border border-[#e2e8f0] dark:border-[#1e293b] rounded-3xl p-6 shadow-xl shadow-black/5">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-11 h-11 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <MonitorSmartphone className="text-white w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-extrabold text-[#0f172a] dark:text-[#f1f5f9]">
                  {t.title}
                </h1>
                <p className="text-xs text-[#64748b]">
                  {t.subtitle}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#64748b]">
                <Loader2 size={16} className="animate-spin" /> {t.generating}
              </div>
            ) : code ? (
              <>
                <div className="text-center my-6">
                  <div className="font-mono text-2xl tracking-[0.3em] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl py-4 select-all">
                    {code}
                  </div>
                  <p className="text-[11px] text-[#94a3b8] mt-2">
                    {t.validNote}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                    {copied ? t.copied : t.copy}
                  </button>
                  <button
                    type="button"
                    onClick={generateCode}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold border border-[#e2e8f0] dark:border-[#1e293b] text-[#475569] hover:text-[#0f172a] transition-colors"
                    title={t.newCodeTitle}
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>
              </>
            ) : (
              <p className="text-center text-sm text-red-500 py-6">{error}</p>
            )}

            <div className="mt-6 pt-5 border-t border-[#e2e8f0] dark:border-[#1e293b]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#94a3b8] mb-2">
                {t.howTo}
              </p>
              <ol className="text-sm text-[#475569] dark:text-[#94a3b8] space-y-1.5 list-decimal pl-5">
                <li>{t.step1}</li>
                <li>
                  {t.step2a}{" "}
                  <strong>{t.step2b}</strong>
                </li>
                <li>
                  {t.step3a} <strong>{t.step3b}</strong> {t.step3c}{" "}
                  <strong>{t.step3d}</strong>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
