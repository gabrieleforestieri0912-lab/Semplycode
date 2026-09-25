'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Code2, Zap, GraduationCap, ArrowRight, Sparkles, LucideIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const MotionLink = motion.create(Link);

interface Step {
  title: string;
  desc: string;
  icon: LucideIcon;
  accent: string;
  glow: string;
  slug: string;
}

interface Translation {
  badge: string;
  headlineA: string;
  headlineB: string;
  subtitle: string;
  steps: Step[];
  cta: string;
}

interface Translations {
  en: Translation;
  it: Translation;
}

const HowItWorks = () => {
  const { language } = useLanguage();

  const t: Translations = {
    en: {
      badge: "How It Works",
      headlineA: "Paste code.",
      headlineB: "Get an explained fix.",
      subtitle: "Paste, drag files or import from GitHub → structured report in your language with line, cause and corrected code.",
      steps: [
        {
          title: "Paste or upload",
          desc: "Paste a snippet in the CodeMirror editor or drag up to 5 files (100 KB each, JS/TS/Python/Java/Go/Rust…) — plus ZIP or a GitHub URL. Add a stack trace and language is auto-detected.",
          icon: Code2,
          accent: "#10b981",
          glow: "rgba(16,185,129,0.5)",
          slug: "incolla-o-carica",
        },
        {
          title: "Analysis in plain language",
          desc: "The AI pinpoints bugs, cites the exact line when code is >50 lines and returns Errors · Explanation · Corrected code in Italian — minimal fixes in Correction mode or full DRY/naming/security review in Revision mode.",
          icon: Sparkles,
          accent: "#2dd4bf",
          glow: "rgba(45,212,191,0.5)",
          slug: "analisi-in-italiano",
        },
        {
          title: "Apply and keep going",
          desc: "Copy with one click or apply via diff, save to your Drawer (Leitner), export Markdown or share a link, then keep chatting to ask “why” or request variants.",
          icon: GraduationCap,
          accent: "#14b8a6",
          glow: "rgba(20,184,166,0.5)",
          slug: "applica-e-continua",
        },
      ],
      cta: "Try it now",
    },
    it: {
      badge: "Come Funziona",
      headlineA: "Incolla codice.",
      headlineB: "Ricevi fix spiegato.",
      subtitle: "Editor, file o GitHub → report strutturato in italiano con riga, causa e codice corretto.",
      steps: [
        {
          title: "Incolla o carica",
          desc: "Incolli uno snippet nell’editor o trascini fino a 5 file (100 KB cad., JS/TS/Python/Java/Go/Rust…) — anche ZIP o URL GitHub. Puoi aggiungere lo stack trace: il linguaggio viene rilevato automaticamente.",
          icon: Code2,
          accent: "#10b981",
          glow: "rgba(16,185,129,0.5)",
          slug: "incolla-o-carica",
        },
        {
          title: "Analisi in italiano",
          desc: "L’AI individua bug e logica, cita la riga esatta se il codice supera 50 righe e genera in italiano Errori · Spiegazione · Codice corretto — solo fix minimi in Correzione, o revisione completa DRY/naming/sicurezza in Revisione.",
          icon: Sparkles,
          accent: "#2dd4bf",
          glow: "rgba(45,212,191,0.5)",
          slug: "analisi-in-italiano",
        },
        {
          title: "Applica e continua",
          desc: "Copi il fix con un click o lo applichi con il diff, lo salvi nel Cassetto (Leitner), lo esporti in Markdown o link condivisibile e continui a chattare per chiedere “perché” o varianti.",
          icon: GraduationCap,
          accent: "#14b8a6",
          glow: "rgba(20,184,166,0.5)",
          slug: "applica-e-continua",
        },
      ],
      cta: "Provalo ora",
    },
  };

  const current = (t as unknown as Record<string, Translation>)[language] || t.it;

  return (
    <section
      id="come-funziona"
      className="relative pt-10 md:pt-14 lg:pt-16 pb-20 md:pb-28 lg:pb-32 overflow-hidden"
    >
      {/* Background decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        <div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(45,212,191,0.07) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-1/3 left-0 w-[300px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)" }}
        />
      </div>

      <div className="container mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 md:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6 relative"
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-15" />
            <span className="absolute inset-px rounded-full bg-white" />
            <Zap size={11} fill="currentColor" className="relative text-emerald-500" />
            <span className="relative text-emerald-600">{current.badge}</span>
          </motion.div>

          <h2 className="text-[clamp(1.75rem,4vw,4rem)] 3xl:text-[4.5rem] font-black tracking-tight mb-4 sm:mb-5 text-[#0f172a]">
            {current.headlineA}{" "}
            <span className="text-gradient">
              {current.headlineB}
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-2 sm:px-0 text-[#475569]">
            {current.subtitle}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl 4xl:max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-5 2xl:gap-8 3xl:gap-10">
            {current.steps.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 70 }}
                className="relative group"
              >
                {/* Gradient border wrapper */}
                <div className="relative h-full rounded-3xl p-px bg-[#e2e8f0] transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-emerald-400 group-hover:via-teal-400 group-hover:to-emerald-500 group-hover:shadow-xl group-hover:shadow-emerald-500/10">
                  <div className="relative h-full rounded-[calc(1.5rem-1px)] bg-white overflow-hidden p-5 sm:p-7 xl:p-8">
                    {/* Hover radial glow */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% 0%, ${item.glow.replace("0.5", "0.08")} 0%, transparent 70%)`,
                      }}
                    />

                    {/* Icon + step chip */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="relative">
                        <div
                          className="absolute inset-0 rounded-2xl blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-500"
                          style={{ background: item.glow }}
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                          className="relative w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-400"
                          style={{
                            background: `${item.accent}14`,
                            border: `1px solid ${item.accent}30`,
                            color: item.accent,
                            boxShadow: `0 8px 24px -8px ${item.glow}`,
                          }}
                        >
                          <item.icon size={24} />
                        </motion.div>
                      </div>

                      <span
                        className="text-sm font-bold tracking-widest px-2.5 py-1 rounded-full"
                        style={{ background: `${item.accent}12`, color: item.accent, border: `1px solid ${item.accent}22` }}
                      >
                        <ArrowRight size={13} style={{ display: "inline", verticalAlign: "-2px" }} />
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mb-3 text-[#0f172a]">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#64748b]">
                      {item.desc}
                    </p>
                    <Link
                      href={`/guide/${item.slug}`}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold hover:gap-1.5 transition-all"
                      style={{ color: item.accent }}
                    >
                      {language === 'en' ? 'Full guide' : 'Guida completa'} <ArrowRight size={14} />
                    </Link>

                    {/* Bottom accent bar */}
                    <div
                      className="absolute bottom-0 left-7 right-7 h-[3px] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
                      style={{ background: `linear-gradient(90deg, ${item.accent}, transparent)` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex p-px rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
              <MotionLink
                href="#demo"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm text-white transition-all group bg-gradient-to-r from-emerald-500 to-teal-500"
              >
                {current.cta}
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform text-emerald-200" />
              </MotionLink>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
