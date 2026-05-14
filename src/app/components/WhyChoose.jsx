'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const WhyChoose = () => {
  const reasons = [
    {
      title: "Capisci il \"perché\"",
      desc: "Non ti diamo solo codice funzionante. Ti spieghiamo ogni riga, così impari davvero come funziona."
    },
    {
      title: "Impari dal tuo codice",
      desc: "Usi il tuo codice come base per capire concetti nuovi. È come avere un tutor personale 24/7."
    },
    {
      title: "Codice che funziona davvero",
      desc: "Non affidarti a AI che generano codice casuale. Noi analizziamo il TUO codice esistente e lo miglioriamo."
    },
    {
      title: "Sicuro e Privato",
      desc: "Il tuo codice non viene memorizzato. L'analisi è istantanea e il codice resta solo tuo."
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section className="py-20 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perché Semplycode?
            </h2>
            <p className="text-lg text-gray-600">
              In un mondo pieno di AI che scrivono codice da sole, noi facciamo qualcosa di diverso.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {reasons.map((reason, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex gap-4"
              >
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {reason.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {reason.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 p-8 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl text-center"
          >
            <p className="text-lg text-gray-700 font-medium">
              <span className="text-emerald-700">Copilot, ChatGPT, Claude</span> scrivono codice al posto tuo.
            </p>
            <p className="text-lg text-gray-700 font-medium mt-2">
              <span className="text-emerald-600 font-bold">Semplycode</span> ti insegna a farlo.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <p className="text-gray-500 text-sm">
              La differenza tra un developer che usa AI e uno che la <span className="text-emerald-600 font-semibold">capisce</span>?
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              Semplycode.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;