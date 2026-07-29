"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Come funziona Semplycode?",
    answer:
      "Apri Chat AI, incolla codice o carica file. L'AI produce un report con errori, spiegazioni, suggerimenti e codice corretto. Puoi anche chattare sul codice, esportare il report o condividere un link.",
  },
  {
    question: "Devo registrarmi subito?",
    answer:
      "No. Puoi provare Chat AI come ospite con 3 analisi al giorno. Con un account gratuito hai 10 analisi giornaliere, cronologia chat e dashboard.",
  },
  {
    question: "Quali linguaggi sono supportati?",
    answer:
      "JavaScript, TypeScript, Python, Java, C/C++, Go, Rust, PHP, SQL, CSS, HTML, JSON e altri. Il linguaggio viene rilevato automaticamente.",
  },
  {
    question: "Come vengono trattati i miei dati?",
    answer:
      "Il codice viene inviato al motore AI per l'analisi. Se sei registrato, le chat possono essere salvate nel tuo account. Non vendiamo il tuo codice. Leggi la privacy policy per i dettagli.",
  },
  {
    question: "Posso caricare più file o uno ZIP?",
    answer:
      "Sì, fino a 5 file (100KB ciascuno) o un archivio ZIP in Chat AI. Puoi anche importare un singolo file da GitHub incollando l'URL.",
  },
  {
    question: "Qual è la differenza tra i piani?",
    answer:
      "Gratuito: 10 analisi al giorno. Pro: analisi illimitate e funzionalità avanzate. Enterprise: per team con esigenze dedicate.",
  },
  {
    question: "L'estensione Chrome è disponibile?",
    answer:
      "L'estensione è in arrivo. Nel frattempo usa Chat AI sul web e il caricamento file per analizzare il tuo codice.",
  },
  {
    question: "Serve connessione internet?",
    answer:
      "Sì, l'analisi AI richiede connessione. Puoi scrivere codice nell'editor offline e analizzare quando sei online.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="w-full py-16 bg-[#f8fafc]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-6 md:px-12 max-w-3xl"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold tracking-widest mb-4">
            DOMANDE FREQUENTI
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0f172a] mb-3">
            Tutto quello che devi sapere
          </h2>
          <p className="text-base text-[#475569] max-w-2xl mx-auto">
            Risposte chiare su Chat AI, limiti e piani.
          </p>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className="border border-[#e2e8f0] rounded-2xl bg-white overflow-hidden"
              >
                <button
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-black/[0.02] transition-colors"
                >
                  <span className="font-medium text-sm text-[#0f172a] pr-3">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-emerald-600 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pt-2 pb-4 text-sm text-[#475569] leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
