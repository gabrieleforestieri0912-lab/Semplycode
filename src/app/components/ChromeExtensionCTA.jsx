'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Chrome, Download, Star, ArrowRight, Terminal, Shield, Zap } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const ChromeExtensionCTA = () => {
  const { language } = useLanguage();

  const t = {
    en: {
      badge: "Chrome Extension",
      title: "Bring AI Code Analysis to Your Browser",
      subtitle: "Install our Chrome extension and get instant code analysis while browsing GitHub, Stack Overflow, or any code repository.",
      features: [
        { icon: Terminal, text: "Inline code analysis" },
        { icon: Zap, text: "Real-time suggestions" },
        { icon: Shield, text: "Privacy-first (local processing)" }
      ],
      cta: "Add to Chrome",
      stats: "10K+ developers already installed"
    },
    it: {
      badge: "Estensione Chrome",
      title: "Porta l'AI nel tuo Browser",
      subtitle: "Installa l'estensione Chrome e analizza il codice istantaneamente mentre navighi su GitHub, Stack Overflow o qualsiasi repository.",
      features: [
        { icon: Terminal, text: "Analisi inline" },
        { icon: Zap, text: "Suggerimenti in tempo reale" },
        { icon: Shield, text: "Elaborazione locale" }
      ],
      cta: "Aggiungi a Chrome",
      stats: "10K+ sviluppatori"
    }
  };

  const current = t[language];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-b from-emerald-50/50 to-white backdrop-blur-xl border border-emerald-100 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-[0_20px_60px_rgba(6,78,59,0.08)]">
            {/* Decorative elements */}
            <div className="absolute top-6 right-6 w-20 h-20 bg-primary/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-6 left-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl"></div>

            <div className="flex flex-col lg:flex-row items-center gap-10">
              {/* Chrome Icon */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-gradient-to-br from-primary to-emerald-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20 relative overflow-hidden">
                  <img src="/semplycode.png" alt="Semplycode" className="w-20 h-20 rounded-xl" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center border-4 border-white">
                    <Download className="text-white w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4">
                  {current.badge}
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">
                  {current.title}
                </h2>

                <p className="text-gray-600 text-lg mb-6 max-w-xl">
                  {current.subtitle}
                </p>

                <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                  {current.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-600 text-sm bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                      <feature.icon className="w-4 h-4 text-primary" />
                      {feature.text}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 group cursor-pointer">
                    <Chrome className="w-5 h-5" />
                    {current.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {current.stats}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ChromeExtensionCTA;