'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Zap, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const HowItWorks = () => {
  const { language } = useLanguage();

  const t = {
    en: {
      title: "How It Works",
      subtitle: "Three simple steps to transform your coding skills",
      steps: [
        {
          step: "01",
          title: "Paste Your Code",
          desc: "Simply copy and paste any code snippet you're struggling with into our intelligent editor.",
          icon: Code2
        },
        {
          step: "02",
          title: "AI Analysis",
          desc: "Our advanced AI analyzes logic, identifies bugs, and explains complex patterns in plain English.",
          icon: Sparkles
        },
        {
          step: "03",
          title: "Learn & Apply",
          desc: "Get optimized code with one click and learn the reasoning behind every change.",
          icon: GraduationCap
        }
      ]
    },
    it: {
      title: "Come Funziona",
      subtitle: "Tre semplici passi per trasformare le tue abilità di coding",
      steps: [
        {
          step: "01",
          title: "Incolla il Codice",
          desc: "Copia e incolla qualsiasi frammento di codice nel nostro editor intelligente.",
          icon: Code2
        },
        {
          step: "02",
          title: "Analisi AI",
          desc: "La nostra AI avanzata analizza la logica, identifica i bug e spiega i pattern complessi.",
          icon: Sparkles
        },
        {
          step: "03",
          title: "Impara & Applica",
          desc: "Ottieni codice ottimizzato con un click e comprendi il ragionamento dietro ogni cambiamento.",
          icon: GraduationCap
        }
      ]
    }
  };

  const current = t[language];

  return (
    <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4">
            <Zap size={12} fill="currentColor" />
            {current.title}
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            {language === 'en' ? 'Simple as 1-2-3' : 'Semplice come 1-2-3'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {current.subtitle}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {current.steps.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-emerald-500/10 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
              
              <div className="relative bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(6,78,59,0.1)] transition-all duration-500 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <item.icon className="text-white w-7 h-7" />
                  </div>
                  <span className="text-6xl font-black text-gray-100/50 group-hover:text-emerald-100 transition-colors">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed flex-grow">{item.desc}</p>

                {i < 2 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                      <ArrowRight className="text-primary w-4 h-4" />
                    </div>
                  </div>
                )}
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
          <a 
            href="#demo"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 group"
          >
            {language === 'en' ? 'Try it now' : 'Provalo ora'}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;