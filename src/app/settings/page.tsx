"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { motion, type Variants } from "framer-motion";
import {
  User,
  Mail,
  CreditCard,
  LogOut,
  Loader2,
  Save,
  Sun,
  Moon,
  Globe,
  ChevronDown,
  Crown,
  Shield,
  FolderDown,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { SkeletonSettings } from "@/app/components/Skeleton";

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  plan: string;
  avatarUrl?: string;
}

interface FeedbackInfo {
  type: "success" | "error";
  message: string;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" as const },
  }),
};

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, { label: string; color: string }> = {
    free:       { label: "Piano Gratuito",  color: "bg-slate-100 text-slate-600 border-slate-200" },
    starter:    { label: "Piano Starter",   color: "bg-blue-50 text-blue-600 border-blue-200" },
    pro:        { label: "Piano Pro",       color: "bg-violet-50 text-violet-600 border-violet-200" },
    enterprise: { label: "Enterprise",     color: "bg-amber-50 text-amber-600 border-amber-200" },
  };
  const { label, color } = map[plan] ?? map.free;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${color}`}>
      <Crown className="w-3 h-3" />
      {label}
    </span>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user: supabaseUser, status } = useSupabaseSession();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [feedback, setFeedback] = useState<FeedbackInfo | null>(null);
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (status === "loading") return;
    if (supabaseUser) {
      const fullName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || "";
      setUser({
        firstName: fullName.split(" ")[0] || "User",
        lastName:  fullName.split(" ").slice(1).join(" ") || "",
        email:     supabaseUser.email || "",
        plan:      "free",
        avatarUrl: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
      });
      fetch("/api/usage/stats")
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.plan) setUser((prev) => prev ? { ...prev, plan: data.plan } : prev);
        })
        .catch(() => {});
    } else {
      router.push("/login");
    }
  }, [supabaseUser, status, router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const [exportPath, setExportPath] = useState("");
  const [exportAutoPrefix, setExportAutoPrefix] = useState(false);

  useEffect(() => {
    try {
      const savedPath = localStorage.getItem("semplycode:export_path") || "";
      const savedPrefix = localStorage.getItem("semplycode:export_autoprefix") === "true";
      setExportPath(savedPath);
      setExportAutoPrefix(savedPrefix);
    } catch {
      // ignore
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      // Salva preferenze locali di esportazione
      try {
        localStorage.setItem("semplycode:export_path", exportPath.trim());
        localStorage.setItem("semplycode:export_autoprefix", exportAutoPrefix ? "true" : "false");
      } catch (err) {
        console.error("Failed to save export settings to localStorage:", err);
      }

      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: user!.firstName, lastName: user!.lastName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Salvataggio non riuscito");
      setUser((cur) => ({ ...cur!, ...data.user }));
      setFeedback({ type: "success", message: "Modifiche e impostazioni di esportazione salvate con successo." });
    } catch (error) {
      setFeedback({ type: "error", message: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
    : "?";

  const tokenLabel = {
    free: "30 crediti / mese ≈ ~6 analisi",
    starter: "1.500 crediti / mese ≈ ~300 analisi",
    pro: "3.000 crediti / mese ≈ ~600 analisi",
    enterprise: "Team — lista d’attesa (crediti su richiesta)",
  }[user?.plan ?? "free"] ?? "30 crediti / mese ≈ ~6 analisi";

  if (!user || status === "loading") {
    return (
      <>
        <Navbar />
        <SkeletonSettings />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="w-full max-w-2xl 3xl:max-w-3xl mx-auto px-4 sm:px-6 mt-20 sm:mt-24 mb-16 space-y-4">

        {/* ── Profile hero card ─────────────────────────── */}
        <motion.div
          custom={0} variants={cardVariants} initial="hidden" animate="visible"
          className="relative overflow-hidden bg-white border border-[#e2e8f0] rounded-3xl shadow-xl shadow-black/5 p-6 sm:p-8"
        >
          {/* decorative glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              {user.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-emerald-500/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/25">
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white" />
            </div>

            {/* Name + email + plan */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h1 className="text-2xl font-bold text-[#0f172a] truncate">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm text-[#64748b] mt-0.5 truncate">{user.email}</p>
              <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                <PlanBadge plan={user.plan} />
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-600 border-emerald-200">
                  <Shield className="w-3 h-3" />
                  Account attivo
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Edit name ─────────────────────────────────── */}
        <motion.div
          custom={1} variants={cardVariants} initial="hidden" animate="visible"
          className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" /> Informazioni personali
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1.5">Nome</label>
              <input
                type="text"
                value={user.firstName}
                onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1.5">Cognome</label>
              <input
                type="text"
                value={user.lastName}
                onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </motion.div>

        {/* ── Email (readonly) ──────────────────────────── */}
        <motion.div
          custom={2} variants={cardVariants} initial="hidden" animate="visible"
          className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-emerald-500" /> Email
          </h2>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-4 py-2.5 bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl text-sm text-[#94a3b8] cursor-not-allowed"
          />
          <p className="text-xs text-[#94a3b8] mt-2">L&apos;email non può essere modificata.</p>
        </motion.div>

        {/* ── Piano ─────────────────────────────────────── */}
        <motion.div
          custom={3} variants={cardVariants} initial="hidden" animate="visible"
          className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-500" /> Abbonamento
          </h2>
          <div className="flex items-center justify-between bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
            <div>
              <PlanBadge plan={user.plan} />
              <p className="text-xs text-[#64748b] mt-2">{tokenLabel}</p>
            </div>
            {user.plan === "free" && (
              <a
                href="/#prezzi"
                className="shrink-0 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold rounded-xl shadow shadow-emerald-500/20 hover:brightness-110 transition-all"
              >
                Upgrade
              </a>
            )}
          </div>
        </motion.div>

        {/* ── Lingua ────────────────────────────────────── */}
        <motion.div
          custom={4} variants={cardVariants} initial="hidden" animate="visible"
          className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" /> Lingua
          </h2>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => toggleLanguage(e.target.value as "it" | "en")}
              className="appearance-none w-full px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="it">Italiano</option>
              <option value="en">English</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          </div>
        </motion.div>

        {/* ── Tema ──────────────────────────────────────── */}
        <motion.div
          custom={5} variants={cardVariants} initial="hidden" animate="visible"
          className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            {theme === "dark" ? <Sun className="w-4 h-4 text-emerald-500" /> : <Moon className="w-4 h-4 text-emerald-500" />}
            Tema
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#0f172a]">
                {theme === "dark" ? "Tema scuro" : "Tema chiaro"}
              </p>
              <p className="text-xs text-[#64748b] mt-0.5">
                {theme === "dark"
                  ? "Passa al tema chiaro per una visuale più luminosa"
                  : "Passa al tema scuro per minore affaticamento visivo"}
              </p>
            </div>
            {/* Toggle switch */}
            <button
              onClick={toggleTheme}
              aria-label="Cambia tema"
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                theme === "dark" ? "bg-emerald-500" : "bg-[#cbd5e1]"
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                  theme === "dark" ? "left-[1.875rem]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </motion.div>

        {/* ── Configurazione Percorso Esportazione ──────── */}
        <motion.div
          custom={6} variants={cardVariants} initial="hidden" animate="visible"
          className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
              <FolderDown className="w-4 h-4 text-emerald-500" /> Esportazione & Download
            </h2>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Personalizzabile
            </span>
          </div>
          <p className="text-xs text-[#64748b] mb-4 leading-relaxed">
            Configura il percorso o prefisso di salvataggio per i file di codice (.py, .ts, .js, .html, ecc.) e le chat AI esportate.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="export-path-input" className="block text-xs font-semibold text-[#334155] mb-1.5">
                Cartella o Percorso di destinazione preferito
              </label>
              <input
                id="export-path-input"
                type="text"
                value={exportPath}
                onChange={(e) => setExportPath(e.target.value)}
                placeholder="es. C:/Progetti/Semplycode oppure Semplycode/Exports"
                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono transition-all"
              />
              <p className="text-[11px] text-[#94a3b8] mt-1.5 leading-relaxed">
                Suggerimento: puoi anche impostare la cartella dei download predefinita nelle impostazioni del tuo browser per salvare i file scaricati direttamente in questo percorso.
              </p>
            </div>

            <label className="flex items-center gap-3 p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={exportAutoPrefix}
                onChange={(e) => setExportAutoPrefix(e.target.checked)}
                className="rounded border-[#cbd5e1] text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-semibold text-[#0f172a] block">Includi nome cartella come prefisso file</span>
                <span className="text-[#64748b] text-[11px]">
                  Es. <code className="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">Exports_solution.py</code> per identificare subito la provenienza del file.
                </span>
              </div>
            </label>
          </div>
        </motion.div>

        {/* ── Feedback ──────────────────────────────────── */}
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl px-4 py-3 text-sm font-medium border ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            {feedback.message}
          </motion.div>
        )}

        {/* ── Actions ───────────────────────────────────── */}
        <motion.div
          custom={6} variants={cardVariants} initial="hidden" animate="visible"
          className="flex flex-col sm:flex-row gap-3 pb-2"
        >
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold shadow shadow-emerald-500/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? "Salvataggio..." : "Salva Modifiche"}
          </button>

          <button
            onClick={handleLogout}
            className="flex-1 py-3 border border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Esci dall&apos;account
          </button>
        </motion.div>

      </div>

      <Footer />
    </>
  );
}
