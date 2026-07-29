"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  MousePointerClick,
  Highlighter,
  Play,
  Sparkles,
  FileCode,
  LucideIcon,
  Check,
  ChevronRight,
  Chrome,
} from "lucide-react";

interface StatItem {
  icon: LucideIcon;
  value: string;
  label: string;
}

interface FeatureItem {
  icon: LucideIcon;
  text: string;
}

interface Translation {
  badge: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  cta: string;
  ctaSub: string;
  stats: StatItem[];
  features: FeatureItem[];
  steps: { icon: LucideIcon; title: string; desc: string }[];
}

const ChromeExtensionCTA = () => {
  const t: Record<string, Translation> = {
    en: {
      badge: "Chrome Extension",
      title: "Highlight code on any page.",
      titleAccent: "AI analyzes it instantly.",
      subtitle:
        "Select text on GitHub, docs, Stack Overflow or any site. One click sends it to Semplycode for a full review in Italian.",
      cta: "Add to Chrome",
      ctaSub: "Free · No account required",
      stats: [
        { icon: Highlighter, value: "Select", label: "highlight on page" },
        { icon: Zap, value: "1 click", label: "to analyze" },
        { icon: Sparkles, value: "IT", label: "reviews in Italian" },
      ],
      features: [
        { icon: MousePointerClick, text: "Floating button on text selection" },
        { icon: FileCode, text: "Syntax-friendly code detection" },
        { icon: Shield, text: "Side panel — no tab switching" },
      ],
      steps: [
        { icon: Highlighter, title: "Select", desc: "Highlight code on any webpage" },
        { icon: Zap, title: "Analyze", desc: "One click sends it to AI" },
        { icon: Sparkles, title: "Fix", desc: "Get a full review in Italian" },
      ],
    },
    it: {
      badge: "Estensione Chrome",
      title: "Evidenzia il codice su qualsiasi pagina.",
      titleAccent: "L'AI lo analizza subito.",
      subtitle:
        "Seleziona testo su GitHub, documentazione, Stack Overflow o qualsiasi sito. Un click invia tutto a Semplycode per una review completa in italiano.",
      cta: "Aggiungi a Chrome",
      ctaSub: "Gratis · Nessun account richiesto",
      stats: [
        { icon: Highlighter, value: "Seleziona", label: "ed evidenzia" },
        { icon: Zap, value: "1 click", label: "per analizzare" },
        { icon: Sparkles, value: "IT", label: "review in italiano" },
      ],
      features: [
        { icon: MousePointerClick, text: "Pulsante flottante sulla selezione" },
        { icon: FileCode, text: "Rileva testo con aspetto da codice" },
        { icon: Shield, text: "Pannello laterale senza cambiare tab" },
      ],
      steps: [
        { icon: Highlighter, title: "Seleziona", desc: "Evidenzia codice su qualsiasi sito" },
        { icon: Zap, title: "Analizza", desc: "Un click lo invia all'AI" },
        { icon: Sparkles, title: "Correggi", desc: "Ricevi una review completa in italiano" },
      ],
    },
  };

  const language = "it";
  const current = t[language] || t.it;

  return (
    <section
      id="estensione"
      className="relative py-24 md:py-32 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 -translate-y-1/2 left-[-120px] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute top-1/2 -translate-y-1/2 right-[-120px] w-[500px] h-[500px] rounded-full bg-teal-500/4 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #10b981 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div             className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6 bg-emerald-50 border border-emerald-200 text-emerald-600">
              <Chrome size={12} />
              {current.badge}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 leading-[1.1] text-[#0f172a]">
              {current.title}
              <br />
              <span className="bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {current.titleAccent}
              </span>
            </h2>
            <p className="text-lg text-[#475569] max-w-2xl mx-auto">
              {current.subtitle}
            </p>
          </motion.div>

          {/* Grid: Browser mockup + content */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
            {/* Browser mockup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, type: "spring", stiffness: 60 }}
              className="relative order-1 lg:order-2"
            >
              <div className="relative w-full min-h-[280px] md:aspect-video max-w-[540px] mx-auto rounded-2xl overflow-hidden border border-emerald-200 bg-[#0a0c10] shadow-2xl shadow-emerald-500/10 flex items-center justify-center group cursor-pointer">
                <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 via-transparent to-emerald-500/5" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/30 group-hover:scale-110 transition-all duration-300">
                    <Play className="w-7 h-7 text-emerald-400 ml-0.5" fill="currentColor" />
                  </div>
                  <p className="text-sm font-medium text-[#94a3b8]">Guarda il video demo</p>
                </div>
              </div>

              {/* Decorative dots */}
              <div className="absolute -bottom-4 -left-4 w-24 h-24 border border-emerald-200 rounded-2xl -z-10 hidden lg:block" />
              <div className="absolute -top-4 -right-4 w-20 h-20 border border-emerald-200 rounded-2xl -z-10 hidden lg:block" />
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, type: "spring", stiffness: 60 }}
              className="order-2 lg:order-1"
            >
              {/* Feature list */}
              <div className="space-y-4 mb-10">
                {current.features.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-emerald-200 transition-all group"
                  >
                    <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 border border-emerald-200 group-hover:bg-emerald-100 transition-all">
                      <f.icon size={18} strokeWidth={2} />
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-[#0f172a]">
                        {f.text}
                      </span>
                    </div>
                    <ChevronRight size={14} className="ml-auto text-[#cbd5e1] group-hover:text-emerald-600 transition-all" />
                  </motion.div>
                ))}
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 }}
                className="grid grid-cols-3 gap-3 mb-8"
              >
                {current.stats.map((s, i) => (
                  <div
                    key={i}
                    className="text-center p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-emerald-200 transition-all"
                  >
                    <s.icon
                      size={20}
                      className="mx-auto mb-2 text-emerald-600"
                      strokeWidth={2}
                    />
                    <div className="text-sm font-bold text-[#0f172a]">{s.value}</div>
                    <div className="text-[10px] text-[#64748b] uppercase tracking-wide mt-0.5">
                      {s.label}
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <Link
                  href="/chat"
                  className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:brightness-110 hover:shadow-xl hover:shadow-emerald-500/40 transition-all"
                >
                  <Chrome size={20} className="text-white" />
                  {current.cta}
                </Link>
                <p className="text-xs text-[#94a3b8] mt-3 flex items-center gap-1.5">
                  <Check size={12} className="text-emerald-600" />
                  {current.ctaSub}
                </p>
              </motion.div>
            </motion.div>
          </div>

          {/* Steps workflow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold tracking-widest mb-4">
                COME FUNZIONA
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-[#0f172a]">
                Tre passi per analizzare il codice
              </h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {current.steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="relative text-center p-6 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-emerald-200 transition-all group"
                >
                  {/* Step number */}
                  <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    {i + 1}
                  </div>
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-100 transition-all">
                    <step.icon size={24} className="text-emerald-600" />
                  </div>
                  <h4 className="text-lg font-bold text-[#0f172a] mb-1">{step.title}</h4>
                  <p className="text-sm text-[#64748b]">{step.desc}</p>
                  {/* Arrow between steps on desktop */}
                  {i < current.steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-5 text-emerald-300 -translate-y-1/2">
                      <ChevronRight size={20} />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ChromeExtensionCTA;
