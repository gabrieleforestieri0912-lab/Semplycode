'use client';

import React from 'react';
import { Code2, Brain, Languages, Zap, Shield, FileCode, Bug } from 'lucide-react';
import { motion } from 'framer-motion';

const Features = () => {
  const features = [
    {
      title: "Analisi Intelligente",
      desc: "Incolla il tuo codice e ricevi un report dettagliato su problemi, bug e miglioramenti.",
      icon: <Brain className="w-6 h-6" />,
    },
    {
      title: "Debug Istantaneo",
      desc: "Rileva errori mentre scrivi e ricevi suggerimenti contestuali per correggere.",
      icon: <Bug className="w-6 h-6" />,
    },
    {
      title: "20+ Linguaggi",
      desc: "JavaScript, Python, Rust, Go, PHP, SQL e molti altri linguaggi supportati.",
      icon: <Languages className="w-6 h-6" />,
    },
    {
      title: "Refactoring",
      desc: "Ottieni versioni ottimizzate del tuo codice con best practices moderne.",
      icon: <FileCode className="w-6 h-6" />,
    },
    {
      title: "Spiegazioni in Italiano",
      desc: "Tutte le analisi e spiegazioni sono in italiano, perfette per imparare.",
      icon: <Code2 className="w-6 h-6" />,
    },
    {
      title: "Locally Processed",
      desc: "Il tuo codice non viene memorizzato. Privato e sicuro, sempre.",
      icon: <Shield className="w-6 h-6" />,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section id="features" className="py-20 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Funzionalità
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 max-w-xl mx-auto text-base md:text-lg px-4 sm:px-0"
          >
            Tutto ciò che ti serve per migliorare il tuo codice, in un unico strumento.
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gray-200"
            >
              <div className="w-12 h-12 bg-accent text-primary rounded-xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
