"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  CreditCard,
  LogOut,
  Loader2,
  Save,
  Sparkles,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";
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
}

interface FeedbackInfo {
  type: "success" | "error";
  message: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user: supabaseUser, status } = useSupabaseSession();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [feedback, setFeedback] = useState<FeedbackInfo | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (supabaseUser) {
      setUser({
        firstName:
          supabaseUser.user_metadata?.full_name?.split(" ")[0] || "User",
        lastName:
          supabaseUser.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
        email: supabaseUser.email || "",
        plan: "free",
      });
      fetch("/api/usage/stats")
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.plan) {
            setUser((prev) => prev ? { ...prev, plan: data.plan } : prev);
          }
        })
        .catch(() => {});
    } else {
      router.push("/login");
    }
  }, [supabaseUser, status, router]);

  const handleLogout = async () => {
    if (!window.confirm("Sei sicuro di voler uscire?")) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleSave = async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: user!.firstName,
          lastName: user!.lastName,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Salvataggio non riuscito");
      }

      setUser((current) => ({ ...current!, ...data.user }));
      setFeedback({
        type: "success",
        message: "Modifiche salvate con successo.",
      });
    } catch (error) {
      setFeedback({ type: "error", message: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const planLabel =
    user?.plan === "enterprise"
      ? "Piano Enterprise"
      : user?.plan === "pro"
        ? "Piano Pro"
        : "Piano Gratuito";

  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

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

      <section className="w-full max-w-3xl mx-auto p-6 md:p-10 bg-white rounded-3xl border border-[#e2e8f0] shadow-xl shadow-black/5 my-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#0f172a]">Impostazioni</h1>
              <p className="text-sm text-[#64748b]">Gestisci il tuo account</p>
            </div>
          </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-[#f8fafc] backdrop-blur-sm border border-[#e2e8f0] rounded-2xl p-4"
          >
            <p className="text-emerald-400 font-medium">{planLabel}</p>
            <p className="text-sm text-[#64748b]">
              {user.plan === "free"
                ? "100 token AI al mese"
                : user.plan === "starter"
                  ? "1500 token AI al mese"
                  : user.plan === "pro"
                    ? "3000 token AI al mese"
                    : "Token AI illimitati"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Email
            </h2>
            <div>
              <input
                type="email"
                value={user.email}
                onChange={() => {}}
                disabled
                className="w-full px-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-[#64748b]"
              />
              <p className="text-xs text-[#64748b] mt-2">
                L&apos;email non può essere modificata
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Abbonamento
            </h2>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-emerald-600 font-medium">{planLabel}</p>
              <p className="text-sm text-[#64748b]">
                {user.plan === "free"
                  ? "100 token AI al mese"
                  : user.plan === "starter"
                    ? "1500 token AI al mese"
                    : user.plan === "pro"
                      ? "3000 token AI al mese"
                      : "Token AI illimitati"}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Lingua del sito
            </h2>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-2">
                Seleziona lingua
              </label>
               <div className="relative">
                 <select
                   value={language}
                   onChange={(e) => toggleLanguage(e.target.value as 'it' | 'en')}
                   className="appearance-none w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-2xl text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all cursor-pointer hover:border-emerald-900"
                 >
                   <option value="en">English</option>
                   <option value="it">Italiano</option>
                 </select>
                 <ChevronDown className="pointer-events-none absolute inset-y-0 right-4 flex items-center w-4 h-4 text-emerald-400/70" />
               </div>
              <p className="text-xs text-[#64748b] mt-2">
                Lingua corrente: {language}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-primary" />}
              Tema
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#475569]">
                  {theme === 'dark' ? 'Tema scuro' : 'Tema chiaro'}
                </p>
                <p className="text-xs text-[#64748b] mt-0.5">
                  {theme === 'dark' ? 'Attiva il tema chiaro per una visuale più luminosa' : 'Attiva il tema scuro per minore affaticamento'}
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-emerald-600' : 'bg-gray-600'
                }`}
              >
                <div
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
                  theme === 'dark' ? 'left-0.5' : 'left-[1.85rem]'
                }`}
                />
              </button>
            </div>
          </motion.div>

          {feedback && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${feedback.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}
            >
              {feedback.message}
            </div>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {loading ? "Salvataggio..." : "Salva Modifiche"}
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={handleLogout}
            className="w-full py-3 border border-red-200 text-red-500 rounded-xl font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Esci
          </motion.button>
        </div>
      </div>
    </section>

      <Footer />
    </>
  );
}
