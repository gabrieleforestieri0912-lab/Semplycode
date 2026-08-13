'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Code2, Zap, GraduationCap, ArrowRight, Sparkles, LucideIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const MotionLink = motion.create(Link);

interface Step {
  step: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  accent: string;
  glow: string;
}

interface Translation {
  badge: string;
  headline: string;
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
      headline: "Simple as 1-2-3",
      subtitle: "Three simple steps to transform your coding skills",
      steps: [
        {
          step: "01",
          title: "Paste Your Code",
          desc: "Simply copy and paste any code snippet you're struggling with into our intelligent editor.",
          icon: Code2,
          accent: "#10b981",
          glow: "rgba(16,185,129,0.3)",
        },
        {
          step: "02",
          title: "AI Analysis",
          desc: "Our advanced AI analyzes logic, identifies bugs, and explains complex patterns in plain language.",
          icon: Sparkles,
          accent: "#a78bfa",
          glow: "rgba(167,139,250,0.3)",
        },
        {
          step: "03",
          title: "Learn & Apply",
          desc: "Get optimized code with one click and learn the reasoning behind every change.",
          icon: GraduationCap,
          accent: "#60a5fa",
          glow: "rgba(96,165,250,0.3)",
        },
      ],
      cta: "Try it now",
    },
    it: {
      badge: "Come Funziona",
      headline: "Semplice come 1-2-3",
      subtitle: "Tre semplici passi per trasformare le tue abilità di coding",
      steps: [
        {
          step: "01",
          title: "Incolla il Codice",
          desc: "Copia e incolla qualsiasi frammento di codice nel nostro editor intelligente.",
          icon: Code2,
          accent: "#10b981",
          glow: "rgba(16,185,129,0.3)",
        },
        {
          step: "02",
          title: "Analisi AI",
          desc: "La nostra AI avanzata analizza la logica, identifica i bug e spiega i pattern complessi.",
          icon: Sparkles,
          accent: "#a78bfa",
          glow: "rgba(167,139,250,0.3)",
        },
        {
          step: "03",
          title: "Impara & Applica",
          desc: "Ottieni codice ottimizzato con un click e comprendi il ragionamento dietro ogni cambiamento.",
          icon: GraduationCap,
          accent: "#60a5fa",
          glow: "rgba(96,165,250,0.3)",
        },
      ],
      cta: "Provalo ora",
    },
  };

  const current = (t as unknown as Record<string, Translation>)[language] || t.it;

  return (
    <section
      id="come-funziona"
      className="relative pt-12 md:pt-16 pb-24 md:pb-32 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)" }}
        />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-5 bg-emerald-50 border border-emerald-200 text-emerald-600"
          >
            <Zap size={11} fill="currentColor" />
            {current.badge}
          </div>
          <h2
            className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-[#0f172a]"
          >
            {current.headline}
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-[#475569]">
            {current.subtitle}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {current.steps.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, type: "spring", stiffness: 70 }}
              className="relative group"
            >
              <div
                className="relative rounded-3xl p-8 h-full flex flex-col transition-all duration-400 bg-white border border-[#e2e8f0]"
              >
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${item.glow.replace("0.3", "0.06")} 0%, transparent 70%)`,
                  }}
                />

                <div className="flex items-center justify-between mb-7">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-400"
                    style={{
                      background: `${item.accent}18`,
                      border: `1px solid ${item.accent}30`,
                    }}
                  >
                    <item.icon size={24} style={{ color: item.accent }} />
                  </div>
                  <span
                    className="text-5xl font-black select-none"
                    style={{ color: "color-mix(in srgb, var(--foreground) 8%, transparent)" }}
                  >
                    {item.step}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-3 text-[#0f172a]">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed flex-grow text-[#64748b]">
                  {item.desc}
                </p>

                {i < 2 && (
                  <div className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full items-center justify-center shadow-lg shadow-emerald-500/15"
                    style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.25))", border: "1px solid rgba(16,185,129,0.35)" }}
                  >
                    <ArrowRight size={16} className="text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-14 text-center"
        >
          <MotionLink
            href="#demo"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm transition-all group"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#fff",
              boxShadow: "0 0 30px rgba(16,185,129,0.25)",
            }}
          >
            {current.cta}
            <ArrowRight size={15} className="group-hover:translate-x-1 text-emerald-200 transition-transform" />
          </MotionLink>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
