'use client';

import React from 'react';
import Link from 'next/link';
import { Code2, Brain, Languages, Zap, Shield, FileCode, Upload, LucideIcon, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Feature {
  title: string;
  desc: string;
  icon: LucideIcon;
  accent: string;
  glow: string;
  gradientFrom: string;
}

const features: Feature[] = [
  {
    title: "Analisi Intelligente",
    desc: "Incolla codice o carica file: report su errori, spiegazioni e codice corretto in italiano.",
    icon: Brain,
    accent: "#10b981",
    glow: "rgba(16,185,129,0.15)",
    gradientFrom: "#10b981",
  },
  {
    title: "Debug con stack trace",
    desc: "Incolla l'errore del terminale insieme al codice per un'analisi mirata alla causa.",
    icon: Zap,
    accent: "#f59e0b",
    glow: "rgba(245,158,11,0.12)",
    gradientFrom: "#f59e0b",
  },
  {
    title: "20+ Linguaggi",
    desc: "JavaScript, Python, Rust, Go, PHP, SQL e molti altri linguaggi supportati.",
    icon: Languages,
    accent: "#60a5fa",
    glow: "rgba(96,165,250,0.12)",
    gradientFrom: "#60a5fa",
  },
  {
    title: "Carica file e ZIP",
    desc: "Trascina file di codice o un archivio ZIP: l'AI analizza tutto automaticamente.",
    icon: Upload,
    accent: "#a78bfa",
    glow: "rgba(167,139,250,0.12)",
    gradientFrom: "#a78bfa",
  },
  {
    title: "Spiegazioni in Italiano",
    desc: "Tutte le analisi e spiegazioni sono in italiano, perfette per imparare.",
    icon: Code2,
    accent: "#34d399",
    glow: "rgba(52,211,153,0.12)",
    gradientFrom: "#34d399",
  },
  {
    title: "Tipi di review",
    desc: "Sicurezza, performance, stile o analisi completa: scegli il focus nella Chat AI.",
    icon: FileCode,
    accent: "#fb7185",
    glow: "rgba(251,113,133,0.12)",
    gradientFrom: "#fb7185",
  },
];

const Features = () => {
  return (
    <section
      id="funzionalita"
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container mx-auto px-8 md:px-16 lg:px-24 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-5 bg-emerald-50 border border-emerald-200 text-emerald-600"
          >
            Funzionalità
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-[#0f172a] mb-4"
          >
            Tutto ciò che ti serve per migliorare il codice
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[#475569] max-w-2xl mx-auto"
          >
            Dal primo snippet al progetto multi-file: analisi strutturata, export e condivisione.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group relative p-6 rounded-2xl border border-[#e2e8f0] bg-white transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-900/10"
              style={{
                boxShadow: `0 0 40px ${f.glow}`,
              }}
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-6 right-6 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, ${f.gradientFrom}, transparent)` }}
              />

              {/* Corner glow */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${f.glow.replace('0.12', '0.08')} 0%, transparent 70%)`,
                }}
              />

              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${f.glow} 0%, ${f.accent}15 100%)`,
                  color: f.accent,
                  boxShadow: `0 0 20px ${f.glow}`,
                }}
              >
                <f.icon size={22} />
              </div>
              <h3 className="text-lg font-bold text-[#0f172a] mb-2 transition-colors duration-200">
                {f.title}
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed mb-4">{f.desc}</p>

              <Link
                href="/chat"
                className="flex items-center gap-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0"
                style={{ color: f.accent }}
              >
                Scopri di più
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
