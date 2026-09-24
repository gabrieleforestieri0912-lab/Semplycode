"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import { faqs } from "@/lib/faq";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="w-full py-16 md:py-24 3xl:py-32 bg-[#f8fafc]">
      <div className="container mx-auto max-w-3xl 2xl:max-w-4xl 3xl:max-w-5xl 4xl:max-w-6xl">
        <div className="text-center mb-10 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6 relative"
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-15" />
            <span className="absolute inset-px rounded-full bg-white" />
            <Sparkles size={11} className="relative text-emerald-500" />
            <span className="relative text-emerald-600">Domande frequenti</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl 3xl:text-7xl font-black tracking-tight text-[#0f172a] mb-4 sm:mb-5"
          >
            Tutto quello che{" "}
            <span className="text-gradient">
              devi sapere
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm xs:text-base sm:text-lg md:text-xl 3xl:text-2xl text-[#475569] max-w-2xl 3xl:max-w-3xl mx-auto px-2 sm:px-0"
          >
            Risposte chiare su Chat AI, limiti, piani e privacy.
          </motion.p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className={`overflow-hidden rounded-2xl bg-white border transition-all duration-300 ${
                  isOpen
                    ? "border-emerald-400 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/20"
                    : "border-[#e2e8f0] hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/5"
                }`}
              >
                <button
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  className="w-full min-h-[52px] flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-5 md:px-6 py-3.5 sm:py-4 text-left cursor-pointer"
                >
                  <span
                    className={`font-semibold text-sm sm:text-base 3xl:text-lg pr-2 transition-colors duration-300 ${
                      isOpen ? "text-emerald-700" : "text-[#0f172a]"
                    }`}
                  >
                    {faq.question}
                  </span>
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-full border shrink-0 transition-all duration-300 ${
                      isOpen
                        ? "rotate-180 bg-emerald-50 border-emerald-300 text-emerald-600"
                        : "border-[#e2e8f0] text-[#64748b] group-hover:border-emerald-300"
                    }`}
                  >
                    <ChevronDown size={16} strokeWidth={2.5} />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 md:px-6 pb-5">
                        <div className="pt-4 border-t border-[#e2e8f0]/70">
                          <p className="text-sm text-[#475569] leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
